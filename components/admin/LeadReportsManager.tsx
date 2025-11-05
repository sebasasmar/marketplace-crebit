import React, { useState, useEffect, useCallback } from 'react';
import type { LeadReport } from '@/types';
import { apiService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '../ui/PaginationControls';
import { TableSkeleton } from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';

const LeadReportsManager: React.FC = () => {
    const [reports, setReports] = useState<LeadReport[]>([]);
    const [totalReports, setTotalReports] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { addToast } = useToast();
    const [selectedReport, setSelectedReport] = useState<LeadReport | null>(null);
    const [sortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        const { data, total } = await apiService.getAllReports({ page: currentPage, limit: itemsPerPage, sort: sortConfig });
        setReports(data);
        setTotalReports(total);
        setLoading(false);
    }, [currentPage, itemsPerPage, sortConfig]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpdateStatus = async (reportId: string, status: LeadReport['status']) => {
        await apiService.updateReportStatus(reportId, status);
        fetchReports();
        addToast(`Reporte ${status === 'aprobado' ? 'aprobado' : 'rechazado'}.`, 'success');
    };
    
    const getStatusChip = (status: LeadReport['status']) => {
        const colors = {
            pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            aprobado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rechazado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            en_revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
    };
    const reasonText = {
        datos_incorrectos: 'Datos Incorrectos',
        no_contesta: 'No Contesta',
        ya_tiene_credito: 'Ya tiene crédito',
        no_interesado: 'No Interesado',
        otro: 'Otro'
    };
    
    const DetailItem: React.FC<{ label: string, value: React.ReactNode, isMono?: boolean }> = ({ label, value, isMono = false }) => (
        <div>
            <strong className="text-gray-500 dark:text-gray-400">{label}:</strong>
            <span className={`ml-2 ${isMono ? 'font-mono text-xs' : ''}`}>{value ?? 'N/A'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Reportes de Calidad de Leads</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="table-responsive">
                {loading ? <TableSkeleton columns={6} /> : (
                    reports.length > 0 ? (
                    <>
                    <table className="w-full text-sm text-left text-brand-gray-500 dark:text-gray-400">
                       <thead className="text-xs text-brand-gray-700 uppercase bg-brand-gray-100 dark:bg-gray-700 dark:text-gray-300">
                           <tr>
                                <th scope="col" className="px-6 py-3">Fecha</th>
                                <th scope="col" className="px-6 py-3">Empresa</th>
                                <th scope="col" className="px-6 py-3">Lead</th>
                                <th scope="col" className="px-6 py-3">Razón</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                           </tr>
                       </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id} onClick={() => setSelectedReport(report)} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-brand-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <td className="px-6 py-4">{new Date(report.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text dark:text-white">{report.empresa_nombre}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text dark:text-white">{report.lead?.nombre || 'N/A'}</td>
                                    <td className="px-6 py-4">{reasonText[report.reason]}</td>
                                    <td className="px-6 py-4">{getStatusChip(report.status)}</td>
                                    <td className="px-6 py-4 space-x-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                        {report.status === 'pendiente' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(report.id, 'aprobado')} className="font-medium text-brand-secondary hover:underline">Aprobar</button>
                                                <button onClick={() => handleUpdateStatus(report.id, 'rechazado')} className="font-medium text-brand-danger hover:underline">Rechazar</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <PaginationControls
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalReports / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                        totalItems={totalReports}
                    />
                    </>
                    ) : (
                        <EmptyState 
                            title="No hay reportes pendientes"
                            message="Cuando una empresa reporte un lead de baja calidad, aparecerá aquí para su revisión."
                        />
                    )
                )}
                </div>
            </div>
            <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title={`Detalles del Reporte #${selectedReport?.id.slice(0,8)}`} size="2xl">
                {selectedReport && (
                    <div className="space-y-6 text-sm text-brand-text dark:text-gray-300">
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Detalles del Reporte</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="ID Reporte" value={selectedReport.id} isMono />
                                <DetailItem label="Fecha" value={new Date(selectedReport.created_at).toLocaleString()} />
                                <DetailItem label="Empresa" value={selectedReport.empresa_nombre} />
                                <DetailItem label="Razón" value={reasonText[selectedReport.reason]} />
                                <DetailItem label="Estado Actual" value={getStatusChip(selectedReport.status)} />
                            </div>
                            {selectedReport.comments && (
                                <div className="mt-4">
                                    <strong className="text-gray-500 dark:text-gray-400">Comentarios de la Empresa:</strong>
                                    <p className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-md italic">{selectedReport.comments}</p>
                                </div>
                            )}
                        </div>
                         {selectedReport.lead && <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Información del Lead Reportado</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                <DetailItem label="Nombre" value={selectedReport.lead.nombre} />
                                <DetailItem label="Cédula" value={selectedReport.lead.cedula} />
                                <DetailItem label="Email" value={selectedReport.lead.email} />
                                <DetailItem label="Teléfono" value={selectedReport.lead.telefono} />
                                <DetailItem label="Monto Solicitado" value={`$${selectedReport.lead.monto_solicitado.toLocaleString('es-CO')}`} />
                                <DetailItem label="Pagaduría" value={selectedReport.lead.pagaduria} />
                                <DetailItem label="Score" value={selectedReport.lead.score} />
                                <DetailItem label="Riesgo" value={selectedReport.lead.riesgo} />
                            </div>
                        </div>}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default LeadReportsManager;