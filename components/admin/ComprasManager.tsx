import React, { useState, useEffect, useCallback } from 'react';
import type { Compra } from '@/types';
import { apiService } from '@/services/api';
import PaginationControls from '../ui/PaginationControls';
import { TableSkeleton } from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';

const ComprasManager: React.FC = () => {
    const [compras, setCompras] = useState<Compra[]>([]);
    const [totalCompras, setTotalCompras] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha_compra', direction: 'desc' });
    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);

    const fetchCompras = useCallback(async () => {
        setLoading(true);
        const { data, total } = await apiService.getAllCompras({ page: currentPage, limit: itemsPerPage, sort: sortConfig });
        setCompras(data);
        setTotalCompras(total);
        setLoading(false);
    }, [currentPage, itemsPerPage, sortConfig]);

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);
    
    const DetailItem: React.FC<{ label: string, value: React.ReactNode, isMono?: boolean }> = ({ label, value, isMono = false }) => (
        <div>
            <strong className="text-gray-500 dark:text-gray-400">{label}:</strong>
            <span className={`ml-2 ${isMono ? 'font-mono text-xs' : ''}`}>{value ?? 'N/A'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text dark:text-white">Historial de Compras Global</h1>
                <button onClick={() => apiService.exportDataAsCsv('compras')} className="bg-white dark:bg-gray-700 text-brand-text dark:text-white px-4 py-2 rounded-lg font-semibold border border-brand-gray-300 dark:border-gray-600 hover:bg-brand-gray-100 dark:hover:bg-gray-600">Exportar a CSV</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="table-responsive">
                {loading ? <TableSkeleton columns={5} /> : (
                    compras.length > 0 ? (
                    <>
                    <table className="w-full text-sm text-left text-brand-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-brand-gray-700 uppercase bg-brand-gray-100 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Fecha Compra</th>
                                <th scope="col" className="px-6 py-3">Empresa</th>
                                <th scope="col" className="px-6 py-3">Lead</th>
                                <th scope="col" className="px-6 py-3">Precio</th>
                                <th scope="col" className="px-6 py-3">Convertido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map(compra => (
                                <tr key={compra.id} onClick={() => setSelectedCompra(compra)} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-brand-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200">
                                    <td className="px-6 py-4">{new Date(compra.fecha_compra).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text dark:text-white">{compra.empresa?.nombre_empresa}</td>
                                    <td className="px-6 py-4">{compra.lead?.nombre}</td>
                                    <td className="px-6 py-4 font-semibold text-brand-secondary">${compra.precio.toLocaleString('es-CO')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${compra.convertido ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200 text-gray-800'}`}>
                                            {compra.convertido ? 'Sí' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </>
                    ) : (
                       <EmptyState
                            title="No se han realizado compras"
                            message="Cuando las empresas compren leads, su historial aparecerá aquí."
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
                />}
            </div>
            <Modal isOpen={!!selectedCompra} onClose={() => setSelectedCompra(null)} title="Detalles de la Compra" size="2xl">
                {selectedCompra && selectedCompra.lead && (
                    <div className="space-y-6 text-sm text-brand-text dark:text-gray-300">
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Detalles de la Transacción</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="ID Compra" value={selectedCompra.id} isMono />
                                <DetailItem label="Fecha" value={new Date(selectedCompra.fecha_compra).toLocaleString()} />
                                <DetailItem label="Empresa" value={selectedCompra.empresa?.nombre_empresa} />
                                <DetailItem label="Precio Pagado" value={`$${selectedCompra.precio.toLocaleString('es-CO')}`} />
                                <DetailItem label="Plan Utilizado" value={selectedCompra.plan} />
                                <DetailItem label="Convertido" value={selectedCompra.convertido ? 'Sí' : 'No'} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Información del Lead Comprado</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="Nombre" value={selectedCompra.lead.nombre} />
                                <DetailItem label="Cédula" value={selectedCompra.lead.cedula} />
                                <DetailItem label="Email" value={selectedCompra.lead.email} />
                                <DetailItem label="Teléfono" value={selectedCompra.lead.telefono} />
                                <DetailItem label="Monto Solicitado" value={`$${selectedCompra.lead.monto_solicitado?.toLocaleString('es-CO')}`} />
                                <DetailItem label="Pagaduría" value={selectedCompra.lead.pagaduria} />
                                <DetailItem label="Score" value={selectedCompra.lead.score} />
                                <DetailItem label="Riesgo" value={selectedCompra.lead.riesgo} />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ComprasManager;