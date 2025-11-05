import React, { useState, useEffect, useCallback } from 'react';
import type { Empresa, Plan } from '@/types';
import { apiService } from '@/services/api';
import PaginationControls from '../ui/PaginationControls';
import { TableSkeleton } from '../ui/SkeletonLoader';
import Modal from '../ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import EmptyState from '../ui/EmptyState';

const EmpresasManager: React.FC = () => {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [totalEmpresas, setTotalEmpresas] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'nombre_empresa', direction: 'asc' });
    const { addToast } = useToast();
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Modal state
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
    const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [saldoAdjustment, setSaldoAdjustment] = useState(0);
    const [newPlan, setNewPlan] = useState<Plan>('freemium');

    const fetchEmpresas = useCallback(async () => {
        setLoading(true);
        const { data, total } = await apiService.getAllEmpresas({ page: currentPage, limit: itemsPerPage, sort: sortConfig });
        setEmpresas(data);
        setTotalEmpresas(total);
        setLoading(false);
    }, [currentPage, itemsPerPage, sortConfig]);

    useEffect(() => {
        fetchEmpresas();
    }, [fetchEmpresas]);

    const handleAdjustSaldo = async () => {
        if (!selectedEmpresa || saldoAdjustment === 0) return;
        // Fix: Use the new secure RPC method `adminAdjustSaldo` instead of the removed `adjustSaldo`.
        await apiService.adminAdjustSaldo(selectedEmpresa.id, saldoAdjustment);
        addToast(`Saldo de ${selectedEmpresa.nombre_empresa} ajustado.`, 'success');
        setIsSaldoModalOpen(false);
        setSaldoAdjustment(0);
        fetchEmpresas();
    };

    const handleChangePlan = async () => {
        if (!selectedEmpresa) return;
        await apiService.changePlan(selectedEmpresa.id, newPlan);
        addToast(`Plan de ${selectedEmpresa.nombre_empresa} cambiado a ${newPlan}.`, 'success');
        setIsPlanModalOpen(false);
        fetchEmpresas();
    };

    const openDetailsModal = (empresa: Empresa) => {
      setSelectedEmpresa(empresa);
      setIsDetailsModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text dark:text-white">Gestión de Empresas</h1>
                <button onClick={() => apiService.exportDataAsCsv('empresas')} className="bg-white dark:bg-gray-700 text-brand-text dark:text-white px-4 py-2 rounded-lg font-semibold border border-brand-gray-300 dark:border-gray-600 hover:bg-brand-gray-100 dark:hover:bg-gray-600">Exportar a CSV</button>
            </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="table-responsive">
                 {loading ? <TableSkeleton columns={5} /> : (
                    empresas.length > 0 ? (
                    <>
                    <table className="w-full text-sm text-left text-brand-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-brand-gray-700 uppercase bg-brand-gray-100 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre Empresa</th>
                                <th scope="col" className="px-6 py-3">Plan</th>
                                <th scope="col" className="px-6 py-3">Saldo</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empresas.map(empresa => (
                                <tr key={empresa.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-brand-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                                    <td onClick={() => openDetailsModal(empresa)} className="px-6 py-4 font-medium text-brand-text dark:text-white cursor-pointer hover:underline">{empresa.nombre_empresa}</td>
                                    <td className="px-6 py-4 capitalize">{empresa.plan}</td>
                                    <td className="px-6 py-4 font-semibold text-brand-secondary">${empresa.saldo.toLocaleString('es-CO')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${empresa.activo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {empresa.activo ? 'Activa' : 'Suspendida'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedEmpresa(empresa); setIsSaldoModalOpen(true); }} className="font-medium text-brand-primary hover:underline">Ajustar Saldo</button>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedEmpresa(empresa); setNewPlan(empresa.plan); setIsPlanModalOpen(true); }} className="font-medium text-brand-primary hover:underline">Cambiar Plan</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </>
                    ) : (
                        <EmptyState 
                            title="No hay empresas registradas"
                            message="Cuando una nueva empresa se registre en la plataforma, aparecerá aquí."
                        />
                    )
                 )}
                 </div>
                 {totalEmpresas > 0 && !loading && <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalEmpresas / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                    totalItems={totalEmpresas}
                />}
            </div>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Detalles de ${selectedEmpresa?.nombre_empresa}`} size="lg">
                {selectedEmpresa && (
                     <div className="space-y-4 text-sm text-brand-text dark:text-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">ID Empresa:</strong> <span className="font-mono text-xs">{selectedEmpresa.id}</span></div>
                            <div><strong className="text-gray-500 dark:text-gray-400">ID Usuario:</strong> <span className="font-mono text-xs">{selectedEmpresa.user_id}</span></div>
                            <div><strong className="text-gray-500 dark:text-gray-400">NIT:</strong> {selectedEmpresa.nit}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Email:</strong> {selectedEmpresa.email}</div>
                        </div>
                         <div className="border-t pt-4 mt-4 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400">Plan:</strong> <span className="capitalize">{selectedEmpresa.plan}</span></div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Saldo Actual:</strong> ${selectedEmpresa.saldo.toLocaleString('es-CO')}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Leads Comprados:</strong> {selectedEmpresa.leads_comprados}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Límite Gratis:</strong> {selectedEmpresa.leads_gratis_limite} (usados: {selectedEmpresa.leads_gratis_usados})</div>
                            <div><strong className="text-gray-500 dark:text-gray-400">Estado:</strong> {selectedEmpresa.activo ? 'Activa' : 'Suspendida'}</div>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal
                isOpen={isSaldoModalOpen}
                onClose={() => setIsSaldoModalOpen(false)}
                title={`Ajustar Saldo de ${selectedEmpresa?.nombre_empresa}`}
                footer={
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsSaldoModalOpen(false)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleAdjustSaldo} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark">Confirmar</button>
                    </div>
                }
            >
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-brand-text dark:text-white">Monto a ajustar</label>
                    <input type="number" value={saldoAdjustment} onChange={e => setSaldoAdjustment(Number(e.target.value))} className="form-control" placeholder="Ej: 50000 o -10000" />
                </div>
            </Modal>
             <Modal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                title={`Cambiar Plan de ${selectedEmpresa?.nombre_empresa}`}
                footer={
                     <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsPlanModalOpen(false)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleChangePlan} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark">Confirmar</button>
                    </div>
                }
             >
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-brand-text dark:text-white">Nuevo Plan</label>
                    <select value={newPlan} onChange={e => setNewPlan(e.target.value as Plan)} className="form-control">
                        <option value="freemium">Freemium</option>
                        <option value="basico">Básico</option>
                        <option value="profesional">Profesional</option>
                        <option value="empresarial">Empresarial</option>
                    </select>
                </div>
            </Modal>
        </div>
    );
};

export default EmpresasManager;