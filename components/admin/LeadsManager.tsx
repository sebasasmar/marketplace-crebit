import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Lead, LeadVertical, LeadRiesgo, LeadIntencion, LeadEstado } from '@/types';
import { apiService } from '@/services/api';
import Modal from '@components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '../ui/PaginationControls';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

interface LeadsManagerProps {
    initialFilters?: Partial<{
        vertical: LeadVertical;
        riesgo: LeadRiesgo;
        estado: LeadEstado;
    }>;
}

const initialNewLeadState: Partial<Lead> = {
    vertical: 'Colpensiones', riesgo: 'medio', intencion: 'media',
    nombre: '', cedula: '', email: '', telefono: '', pagaduria: '',
    edad: undefined, score: undefined, precio: undefined, monto_solicitado: undefined,
};

const leadStatuses: LeadEstado[] = ['captado', 'ofertado', 'reservado', 'vendido', 'rechazado', 'en_revision'];
const leadVerticales: LeadVertical[] = ['Colpensiones', 'Fopep', 'Magisterio', 'Fuerzas Militares'];
const leadRiesgos: LeadRiesgo[] = ['bajo', 'medio', 'alto'];

const LeadsManager: React.FC<LeadsManagerProps> = ({ initialFilters = {} }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ vertical: 'all', riesgo: 'all', estado: 'all' });
    const [newLead, setNewLead] = useState<Partial<Lead>>(initialNewLeadState);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha_creacion', direction: 'desc' });
    const { addToast } = useToast();

    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
    const [bulkStatus, setBulkStatus] = useState<LeadEstado>('ofertado');
    const selectAllRef = useRef<HTMLInputElement>(null);
    
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        const { data, total } = await apiService.getAllLeads({ 
            page: currentPage, 
            limit: itemsPerPage,
            searchTerm,
            filters,
            sort: sortConfig
        });
        setLeads(data);
        setTotalLeads(total);
        setLoading(false);
    }, [currentPage, itemsPerPage, searchTerm, filters, sortConfig]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // This effect synchronizes the internal filters state with the `initialFilters` prop.
    // Using JSON.stringify prevents re-renders when the prop object reference changes but its content doesn't.
    // It also correctly resets filters when an empty `initialFilters` object is passed.
    useEffect(() => {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }, [JSON.stringify(initialFilters)]);

    // This resets the current page whenever the search term or filters change.
    useEffect(() => {
      setCurrentPage(1);
      setSelectedLeads(new Set());
    }, [searchTerm, filters]);

    const handleCreateLead = async () => {
        if (!newLead.nombre || !newLead.cedula || !newLead.precio) {
            addToast('Nombre, cédula y precio son requeridos.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiService.createLead(newLead as any);
            addToast('Lead creado exitosamente.', 'success');
            setIsCreateModalOpen(false);
            setNewLead(initialNewLeadState);
            fetchLeads();
        } catch(e) {
            addToast('Hubo un error al crear el lead.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLeads(new Set(leads.map(lead => lead.id)));
        } else {
            setSelectedLeads(new Set());
        }
    };
    
    const handleSelectOne = (leadId: string) => {
        const newSelection = new Set(selectedLeads);
        if (newSelection.has(leadId)) {
            newSelection.delete(leadId);
        } else {
            newSelection.add(leadId);
        }
        setSelectedLeads(newSelection);
    };

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.checked = selectedLeads.size > 0 && selectedLeads.size === leads.length;
            selectAllRef.current.indeterminate = selectedLeads.size > 0 && selectedLeads.size < leads.length;
        }
    }, [selectedLeads, leads]);

    const handleBulkDelete = async () => {
        setIsSubmitting(true);
        try {
            await apiService.bulkDeleteLeads(Array.from(selectedLeads));
            addToast(`${selectedLeads.size} leads eliminados.`, 'success');
            setIsBulkDeleteModalOpen(false);
            setSelectedLeads(new Set());
            fetchLeads();
        } catch(e) {
            addToast('Error al eliminar leads.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkStatusUpdate = async () => {
        setIsSubmitting(true);
        try {
            await apiService.bulkUpdateLeadsStatus(Array.from(selectedLeads), bulkStatus);
            addToast(`${selectedLeads.size} leads actualizados a ${bulkStatus}.`, 'success');
            setIsBulkStatusModalOpen(false);
            setSelectedLeads(new Set());
            fetchLeads();
        } catch(e) {
            addToast('Error al actualizar estados.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusChip = (status: LeadEstado) => {
        const colors: Record<LeadEstado, string> = {
            captado: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
            ofertado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
            reservado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            vendido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rechazado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            en_revision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
    };
    
    const openDetailsModal = (lead: Lead) => {
      setSelectedLead(lead);
      setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text dark:text-white">Gestión de Leads</h1>
                <div className="flex items-center space-x-2">
                    <a href="/sample-leads.csv" download="sample-leads.csv" className="bg-white dark:bg-gray-700 text-brand-secondary px-4 py-2 rounded-lg font-semibold border border-brand-gray-300 dark:border-gray-600 hover:bg-brand-gray-100 dark:hover:bg-gray-600">
                        Descargar Muestra
                    </a>
                    <button onClick={() => apiService.exportDataAsCsv('leads')} className="bg-white dark:bg-gray-700 text-brand-text dark:text-white px-4 py-2 rounded-lg font-semibold border border-brand-gray-300 dark:border-gray-600 hover:bg-brand-gray-100 dark:hover:bg-gray-600">Exportar a CSV</button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark">Crear Lead</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="form-control"
                        aria-label="Buscar leads"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.vertical} onChange={e => setFilters({...filters, vertical: e.target.value})} className="form-control" aria-label="Filtrar por vertical">
                        <option value="all">Todas las Verticales</option>
                        {leadVerticales.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={filters.riesgo} onChange={e => setFilters({...filters, riesgo: e.target.value})} className="form-control" aria-label="Filtrar por riesgo">
                        <option value="all">Todos los Riesgos</option>
                        {leadRiesgos.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                    <select value={filters.estado} onChange={e => setFilters({...filters, estado: e.target.value})} className="form-control" aria-label="Filtrar por estado">
                        <option value="all">Todos los Estados</option>
                        {leadStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full bg-orange-100 dark:bg-orange-900/50 p-2 flex justify-between items-center z-20 transition-all duration-300 ease-in-out ${selectedLeads.size > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
                    <span className="text-sm font-medium text-brand-primary dark:text-orange-200">{selectedLeads.size} leads seleccionados</span>
                    <div className="space-x-2">
                        <button onClick={() => setIsBulkStatusModalOpen(true)} className="text-sm font-semibold text-brand-primary dark:text-orange-200 hover:underline">Cambiar Estado</button>
                        <button onClick={() => setIsBulkDeleteModalOpen(true)} className="text-sm font-semibold text-red-600 hover:underline">Eliminar</button>
                    </div>
                </div>
                <div className="table-responsive">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-96">
                        <Spinner size="lg" />
                        <p className="mt-4 text-brand-gray-500 dark:text-gray-400">Cargando leads...</p>
                    </div>
                ) : (
                    leads.length > 0 ? (
                    <>
                    <table className="w-full text-sm text-left text-brand-gray-500 dark:text-gray-400">
                       <thead className="text-xs text-brand-gray-700 uppercase bg-brand-gray-100 dark:bg-gray-700 dark:text-gray-300">
                           <tr>
                                <th scope="col" className="p-4"><input type="checkbox" ref={selectAllRef} onChange={handleSelectAll} className="w-4 h-4 text-brand-primary bg-gray-100 border-gray-300 rounded focus:ring-brand-primary dark:focus:ring-brand-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /></th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Vertical</th>
                                <th scope="col" className="px-6 py-3">Score</th>
                                <th scope="col" className="px-6 py-3">Riesgo</th>
                                <th scope="col" className="px-6 py-3">Precio</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                           </tr>
                       </thead>
                       <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-brand-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                                <td className="w-4 p-4"><input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => handleSelectOne(lead.id)} className="w-4 h-4 text-brand-primary bg-gray-100 border-gray-300 rounded focus:ring-brand-primary" /></td>
                                <td onClick={() => openDetailsModal(lead)} className="px-6 py-4 font-medium text-brand-text dark:text-white cursor-pointer hover:underline">{lead.nombre}</td>
                                <td className="px-6 py-4">{lead.vertical}</td>
                                <td className="px-6 py-4">{lead.score}</td>
                                <td className="px-6 py-4 capitalize">{lead.riesgo}</td>
                                <td className="px-6 py-4 font-semibold text-brand-secondary">${lead.precio.toLocaleString('es-CO')}</td>
                                <td className="px-6 py-4">{getStatusChip(lead.estado)}</td>
                            </tr>
                        ))}
                       </tbody>
                    </table>
                    </>
                    ) : (
                        <EmptyState 
                            title="No se encontraron leads"
                            message="Intenta ajustar tus filtros de búsqueda o crea un nuevo lead para empezar."
                            actionText="Crear Nuevo Lead"
                            onAction={() => setIsCreateModalOpen(true)}
                        />
                    )
                )}
                </div>
                 {totalLeads > 0 && !loading && <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalLeads / itemsPerPage)}
                    onPageChange={(page) => { setCurrentPage(page); setSelectedLeads(new Set()); }}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                    totalItems={totalLeads}
                />}
            </div>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Detalles de: ${selectedLead?.nombre}`} size="2xl">
                {selectedLead && (
                    <div className="space-y-4 text-sm text-brand-text dark:text-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">Cédula:</strong> {selectedLead.cedula}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Edad:</strong> {selectedLead.edad} años</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Email:</strong> {selectedLead.email}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Teléfono:</strong> {selectedLead.telefono}</div>
                        </div>
                        <div className="border-t pt-4 mt-4 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">Monto Solicitado:</strong> ${selectedLead.monto_solicitado.toLocaleString('es-CO')}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Pagaduría:</strong> {selectedLead.pagaduria}</div>
                             <div><strong className="text-gray-500 dark:text-gray-400">Vertical:</strong> {selectedLead.vertical}</div>
                        </div>
                         <div className="border-t pt-4 mt-4 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">Score:</strong> {selectedLead.score}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Riesgo:</strong> <span className="capitalize">{selectedLead.riesgo}</span></div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Intención:</strong> <span className="capitalize">{selectedLead.intencion}</span></div>
                        </div>
                        <div className="border-t pt-4 mt-4 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">Estado:</strong> {getStatusChip(selectedLead.estado)}</div>
                             <div><strong className="text-gray-500 dark:text-gray-400">Precio:</strong> ${selectedLead.precio.toLocaleString('es-CO')}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Vendido:</strong> {selectedLead.vendido ? `Sí (a ${selectedLead.empresa_compradora_id})` : 'No'}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Convertido:</strong> {selectedLead.convertido ? 'Sí' : 'No'}</div>
                             <div><strong className="text-gray-500 dark:text-gray-400">Fecha Creación:</strong> {new Date(selectedLead.fecha_creacion).toLocaleString()}</div>
                             {selectedLead.fecha_venta && <div><strong className="text-gray-500 dark:text-gray-400">Fecha Venta:</strong> {new Date(selectedLead.fecha_venta).toLocaleString()}</div>}
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => !isSubmitting && setIsCreateModalOpen(false)} title="Crear Nuevo Lead" size="2xl" footer={
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} type="button" className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Cancelar</button>
                    <button onClick={handleCreateLead} disabled={isSubmitting} type="button" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark flex items-center justify-center w-36 disabled:bg-opacity-50">
                        {isSubmitting ? <Spinner size="sm" /> : 'Confirmar Creación'}
                    </button>
                </div>
            }>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input id="lead-nombre" name="nombre" placeholder="Nombre" value={newLead.nombre} onChange={e => setNewLead({...newLead, nombre: e.target.value})} className="form-control" required />
                        <input id="lead-cedula" name="cedula" placeholder="Cédula" value={newLead.cedula} onChange={e => setNewLead({...newLead, cedula: e.target.value})} className="form-control" required />
                        <input id="lead-email" name="email" type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="form-control" />
                        <input id="lead-telefono" name="telefono" type="tel" placeholder="Teléfono" value={newLead.telefono} onChange={e => setNewLead({...newLead, telefono: e.target.value})} className="form-control" />
                        <input id="lead-edad" name="edad" type="number" placeholder="Edad" value={newLead.edad || ''} onChange={e => setNewLead({...newLead, edad: Number(e.target.value)})} className="form-control" />
                        <input id="lead-pagaduria" name="pagaduria" placeholder="Pagaduría" value={newLead.pagaduria} onChange={e => setNewLead({...newLead, pagaduria: e.target.value})} className="form-control" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 dark:border-gray-600">
                        <input id="lead-monto" name="monto_solicitado" type="number" placeholder="Monto Solicitado ($)" value={newLead.monto_solicitado || ''} onChange={e => setNewLead({...newLead, monto_solicitado: Number(e.target.value)})} className="form-control" />
                        <input id="lead-precio" name="precio" type="number" placeholder="Precio del Lead ($)" value={newLead.precio || ''} onChange={e => setNewLead({...newLead, precio: Number(e.target.value)})} className="form-control" required />
                        <input id="lead-score" name="score" type="number" placeholder="Score (0-100)" value={newLead.score || ''} onChange={e => setNewLead({...newLead, score: Number(e.target.value)})} className="form-control" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select id="lead-vertical" name="vertical" value={newLead.vertical} onChange={e => setNewLead({...newLead, vertical: e.target.value as LeadVertical})} className="form-control">
                            <option value="Colpensiones">Colpensiones</option>
                            <option value="Fopep">Fopep</option>
                            <option value="Magisterio">Magisterio</option>
                            <option value="Fuerzas Militares">Fuerzas Militares</option>
                        </select>
                        <select id="lead-riesgo" name="riesgo" value={newLead.riesgo} onChange={e => setNewLead({...newLead, riesgo: e.target.value as LeadRiesgo})} className="form-control">
                            <option value="bajo">Bajo</option>
                            <option value="medio">Medio</option>
                            <option value="alto">Alto</option>
                        </select>
                        <select id="lead-intencion" name="intencion" value={newLead.intencion} onChange={e => setNewLead({...newLead, intencion: e.target.value as LeadIntencion})} className="form-control">
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => !isSubmitting && setIsBulkDeleteModalOpen(false)} title="Confirmar Eliminación" size="md" footer={
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsBulkDeleteModalOpen(false)} disabled={isSubmitting} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Cancelar</button>
                    <button onClick={handleBulkDelete} disabled={isSubmitting} className="bg-brand-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center w-28 disabled:bg-opacity-50">
                        {isSubmitting ? <Spinner size="sm" /> : 'Eliminar'}
                    </button>
                </div>
            }>
                <p className="text-brand-text dark:text-gray-300">¿Estás seguro de que quieres eliminar {selectedLeads.size} leads? Esta acción no se puede deshacer.</p>
            </Modal>

            <Modal isOpen={isBulkStatusModalOpen} onClose={() => !isSubmitting && setIsBulkStatusModalOpen(false)} title="Cambiar Estado Masivo" size="md" footer={
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsBulkStatusModalOpen(false)} disabled={isSubmitting} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Cancelar</button>
                    <button onClick={handleBulkStatusUpdate} disabled={isSubmitting} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark flex items-center justify-center w-40 disabled:bg-opacity-50">
                        {isSubmitting ? <Spinner size="sm" /> : 'Confirmar Cambio'}
                    </button>
                </div>
            }>
                <div>
                    <label htmlFor="bulk-status-select" className="block text-sm font-medium text-brand-text dark:text-white mb-2">Seleccionar nuevo estado para {selectedLeads.size} leads:</label>
                    <select id="bulk-status-select" value={bulkStatus} onChange={e => setBulkStatus(e.target.value as LeadEstado)} className="form-control">
                        {leadStatuses.map(status => <option key={status} value={status} className="capitalize">{status}</option>)}
                    </select>
                </div>
            </Modal>
        </div>
    );
};

export default LeadsManager;