import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import type { Empresa, Compra, LeadReport } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '../ui/PaginationControls';
import { TableSkeleton } from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';

interface MisComprasProps {
    empresa: Empresa;
}

const MisCompras: React.FC<MisComprasProps> = ({ empresa }) => {
    const [compras, setCompras] = useState<Compra[]>([]);
    const [totalCompras, setTotalCompras] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
    const [reportingLead, setReportingLead] = useState<Compra | null>(null);
    const [reportData, setReportData] = useState({ reason: 'datos_incorrectos' as LeadReport['reason'], comments: ''});
    const [convertingLead, setConvertingLead] = useState<Compra | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha_compra', direction: 'desc' });
    const { addToast } = useToast();

    const fetchCompras = useCallback(async () => {
        setLoading(true);
        // Supabase requires referencing the foreign table name for sorting on nested columns.
        const apiSortConfig = {
            ...sortConfig,
            key: sortConfig.key.startsWith('lead.') ? `leads.${sortConfig.key.split('.')[1]}` : sortConfig.key,
        };
        const { data, total } = await apiService.getMisCompras({ empresaId: empresa.id, page: currentPage, limit: itemsPerPage, sort: apiSortConfig });
        setCompras(data);
        setTotalCompras(total);
        setLoading(false);
    }, [empresa.id, currentPage, itemsPerPage, sortConfig]);

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);
    
    const handleReportSubmit = async () => {
        if (!reportingLead) return;
        await apiService.reportLead({
            empresa_id: empresa.id,
            lead_id: reportingLead.lead_id,
            reason: reportData.reason,
            comments: reportData.comments
        });
        addToast("Reporte enviado exitosamente.", "success");
        setReportingLead(null);
    };

    const handleConversionSubmit = async () => {
        if (!convertingLead) return;
        await apiService.markAsConverted(convertingLead.id);
        addToast("¡Lead marcado como convertido! Buen trabajo.", "success");
        setConvertingLead(null);
        fetchCompras();
    };
    
    const getSuggestion = (compra: Compra) => {
        if(compra.convertido) return { text: "Completado", color: "text-brand-secondary" };
        return { text: "Contactar", color: "text-brand-primary" };
    };
    
    const DetailItem: React.FC<{ label: string, value: React.ReactNode, isMono?: boolean }> = ({ label, value, isMono = false }) => (
        <div>
            <strong className="text-gray-500 dark:text-gray-400">{label}:</strong>
            <span className={`ml-2 ${isMono ? 'font-mono text-xs' : ''}`}>{value ?? 'N/A'}</span>
        </div>
    );

    const sortOptions = [
      { value: 'fecha_compra-desc', label: 'Fecha (Más recientes)' },
      { value: 'fecha_compra-asc', label: 'Fecha (Más antiguas)' },
      { value: 'lead.nombre-asc', label: 'Lead Nombre (A-Z)' },
      { value: 'lead.nombre-desc', label: 'Lead Nombre (Z-A)' },
      { value: 'lead.vertical-asc', label: 'Lead Vertical (A-Z)' },
      { value: 'lead.vertical-desc', label: 'Lead Vertical (Z-A)' },
    ];

    const handleSortChange = (sortValue: string) => {
        const [key, direction] = sortValue.split('-');
        setSortConfig({ key, direction: direction as 'asc' | 'desc' });
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text dark:text-white">Mis Leads Comprados</h1>
                <button onClick={() => apiService.exportDataAsCsv('compras', compras)} className="bg-white dark:bg-gray-700 text-brand-text dark:text-white px-4 py-2 rounded-lg font-semibold border border-brand-gray-300 dark:border-gray-600 hover:bg-brand-gray-100 dark:hover:bg-gray-600">Exportar a CSV</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="table-responsive">
                {loading ? <TableSkeleton columns={5} /> : (
                    compras.length > 0 ? (
                    <>
                    <table className="w-full text-sm text-left text-brand-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-brand-gray-700 uppercase bg-brand-gray-100 dark:bg-gray-700 dark:text-gray-300">
                           <tr>
                                <th scope="col" className="px-6 py-3">Lead</th>
                                <th scope="col" className="px-6 py-3">Vertical</th>
                                <th scope="col" className="px-6 py-3">Fecha Compra</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Sugerencia</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                           </tr>
                        </thead>
                        <tbody>
                           {compras.map(compra => (
                               <tr key={compra.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-brand-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                                   <td onClick={() => setSelectedCompra(compra)} className="px-6 py-4 font-medium text-brand-text dark:text-white cursor-pointer hover:underline">{compra.lead?.nombre}</td>
                                   <td className="px-6 py-4">{compra.lead?.vertical}</td>
                                   <td className="px-6 py-4">{new Date(compra.fecha_compra).toLocaleDateString()}</td>
                                   <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${compra.convertido ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200 text-gray-800'}`}>
                                            {compra.convertido ? 'Convertido' : 'Pendiente'}
                                        </span>
                                   </td>
                                   <td className={`px-6 py-4 font-semibold ${getSuggestion(compra).color}`}>{getSuggestion(compra).text}</td>
                                   <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                       {!compra.convertido && <button onClick={(e) => { e.stopPropagation(); setConvertingLead(compra); }} className="font-medium text-brand-secondary hover:underline">Convertido</button>}
                                       <button onClick={(e) => { e.stopPropagation(); setReportingLead(compra); }} className="font-medium text-brand-danger hover:underline">Reportar</button>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                    </>
                    ) : (
                        <EmptyState 
                           title="Aún no has comprado leads"
                           message="Explora el marketplace para encontrar tus primeras oportunidades de negocio."
                           actionText="Ir al Marketplace"
                           onAction={() => { /* This would require lifting state up to navigate */ }}
                        />
                    )
                )}
                </div>
                 {totalCompras > 0 && !loading && <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCompras / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                    totalItems={totalCompras}
                    sortOptions={sortOptions}
                    currentSort={`${sortConfig.key}-${sortConfig.direction}`}
                    onSortChange={handleSortChange}
                />}
            </div>

            <Modal isOpen={!!selectedCompra} onClose={() => setSelectedCompra(null)} title={`Detalles de: ${selectedCompra?.lead?.nombre}`} size="2xl">
                {selectedCompra && selectedCompra.lead && (
                    <div className="space-y-6 text-sm text-brand-text dark:text-gray-300">
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Información de Contacto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="Nombre" value={selectedCompra.lead.nombre} />
                                <DetailItem label="Cédula" value={selectedCompra.lead.cedula} />
                                <DetailItem label="Email" value={selectedCompra.lead.email} />
                                <DetailItem label="Teléfono" value={selectedCompra.lead.telefono} />
                                <DetailItem label="Edad" value={selectedCompra.lead.edad ? `${selectedCompra.lead.edad} años` : 'N/A'} />
                            </div>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Detalles Financieros</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="Monto Solicitado" value={`$${selectedCompra.lead.monto_solicitado.toLocaleString('es-CO')}`} />
                                <DetailItem label="Pagaduría" value={selectedCompra.lead.pagaduria} />
                                <DetailItem label="Vertical" value={selectedCompra.lead.vertical} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Clasificación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                                <DetailItem label="Score" value={selectedCompra.lead.score} />
                                <DetailItem label="Riesgo" value={selectedCompra.lead.riesgo} />
                                <DetailItem label="Intención" value={selectedCompra.lead.intencion} />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={!!reportingLead} onClose={() => setReportingLead(null)} title={`Reportar Lead: ${reportingLead?.lead?.nombre}`}>
                 <form onSubmit={(e) => { e.preventDefault(); handleReportSubmit(); }} className="space-y-4">
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-brand-text dark:text-white">Razón del Reporte</label>
                        <select
                            id="report-reason"
                            value={reportData.reason}
                            onChange={e => setReportData({ ...reportData, reason: e.target.value as LeadReport['reason'] })}
                            className="form-control"
                        >
                            <option value="datos_incorrectos">Datos Incorrectos</option>
                            <option value="no_contesta">No Contesta</option>
                            <option value="ya_tiene_credito">Ya tiene crédito</option>
                            <option value="no_interesado">No Interesado</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="report-comments" className="block text-sm font-medium text-brand-text dark:text-white">Comentarios (Opcional)</label>
                        <textarea
                            id="report-comments"
                            rows={3}
                            value={reportData.comments}
                            onChange={e => setReportData({ ...reportData, comments: e.target.value })}
                            className="form-control"
                            placeholder="Proporciona más detalles sobre por qué reportas este lead..."
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                        <button type="button" onClick={() => setReportingLead(null)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="bg-brand-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700">
                            Enviar Reporte
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!convertingLead} onClose={() => setConvertingLead(null)} title={`Marcar como Convertido: ${convertingLead?.lead?.nombre}`}>
                 <div className="space-y-4">
                    <p className="text-sm text-brand-gray-600 dark:text-gray-300">
                        ¿Estás seguro de que quieres marcar este lead como convertido? Esta acción indica que el crédito fue aprobado y desembolsado exitosamente.
                    </p>
                    <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                        <button type="button" onClick={() => setConvertingLead(null)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleConversionSubmit} className="bg-brand-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                            Sí, marcar como convertido
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MisCompras;