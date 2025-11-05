import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Empresa, Lead, LeadSubscription } from '@/types';
import { apiService } from '@/services/api';
import Modal from '@components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '../ui/PaginationControls';

interface MarketplaceLeadsProps {
    empresa: Empresa;
    onPurchaseSuccess: (price: number) => void;
}

const LeadCard: React.FC<{ 
    lead: Lead; 
    onPurchase: (lead: Lead) => void; 
    onViewDetails: (lead: Lead) => void;
    isRecommended: boolean 
}> = ({ lead, onPurchase, onViewDetails, isRecommended }) => {
    const riskColor = {
        bajo: 'border-green-500',
        medio: 'border-yellow-500',
        alto: 'border-red-500',
    };
    return (
        <div 
            onClick={() => onViewDetails(lead)}
            className={`rounded-lg p-5 border-t-4 ${riskColor[lead.riesgo]} flex flex-col justify-between relative transition-all duration-200 cursor-pointer hover:shadow-xl dark:text-white ${isRecommended ? 'bg-orange-50 dark:bg-gray-700/50 shadow-lg ring-2 ring-brand-primary' : 'bg-white dark:bg-gray-800 shadow-md'}`}
        >
             {isRecommended && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-md z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Recomendado
                </div>
            )}
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-bold text-brand-text dark:text-white">{lead.vertical}</h3>
                    <span className="text-xl font-bold text-brand-secondary">${lead.precio.toLocaleString('es-CO')}</span>
                </div>
                <p className="text-sm text-brand-gray-500 dark:text-gray-400">{lead.pagaduria}</p>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Monto Solicitado:</span> <span className="font-semibold">${lead.monto_solicitado.toLocaleString('es-CO')}</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Edad:</span> <span className="font-semibold">{lead.edad} años</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Score:</span> <span className="font-semibold">{lead.score}</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Riesgo:</span> <span className="font-semibold capitalize">{lead.riesgo}</span></div>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(lead);
                }}
                className="mt-6 w-full bg-brand-primary text-white py-2 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors"
            >
                Comprar Lead
            </button>
        </div>
    );
};

const MarketplaceLeads: React.FC<MarketplaceLeadsProps> = ({ empresa, onPurchaseSuccess }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [subscriptions, setSubscriptions] = useState<LeadSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isPurchaseConfirmed, setIsPurchaseConfirmed] = useState(false);
    const [filters, setFilters] = useState<{ vertical: string, riesgo: string }>({ vertical: 'all', riesgo: 'all' });
    const [sortOption, setSortOption] = useState('fecha_creacion-desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const { addToast } = useToast();

    const fetchLeadsAndSubscriptions = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsResult, subsData] = await Promise.all([
                 apiService.getAvailableLeads({ 
                    page: currentPage, 
                    limit: itemsPerPage,
                    filters,
                    sort: sortOption,
                }),
                apiService.getSubscriptions({ empresaId: empresa.id, page: 1, limit: 1000 })
            ]);

            setLeads(leadsResult.data);
            setTotalLeads(leadsResult.total);
            setSubscriptions(subsData.data.filter(s => s.active));
        } catch (error) {
            console.error("Failed to fetch marketplace data:", error);
            addToast("No se pudieron cargar los leads. Intenta de nuevo más tarde.", "error");
        } finally {
            setLoading(false);
        }
    }, [empresa.id, currentPage, itemsPerPage, filters, sortOption, addToast]);

    useEffect(() => {
        fetchLeadsAndSubscriptions();
    }, [fetchLeadsAndSubscriptions]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchLeadsAndSubscriptions();
        setIsRefreshing(false);
        addToast('Lista de leads actualizada.', 'info');
    };

    const handlePurchase = (lead: Lead) => {
        setSelectedLead(lead);
        setIsPurchaseConfirmed(false);
    };

    const confirmPurchase = async () => {
        if (!selectedLead || !isPurchaseConfirmed) return;

        setIsConfirming(true);
        try {
            await apiService.purchaseLead(empresa.id, selectedLead.id);
            addToast('¡Lead comprado exitosamente!', 'success');
            onPurchaseSuccess(selectedLead.precio);
            fetchLeadsAndSubscriptions();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al comprar el lead. Inténtalo de nuevo.';
            addToast(errorMessage, 'error');
        } finally {
            setIsConfirming(false);
            setSelectedLead(null);
        }
    };
    
    const recommendedLeadIds = useMemo(() => {
        const ids = new Set<string>();
        if (subscriptions.length === 0 || leads.length === 0) return ids;
        leads.forEach(lead => {
            for (const sub of subscriptions) {
                const criteria = sub.criteria;
                let matches = true;
                if (criteria.vertical && lead.vertical !== criteria.vertical) matches = false;
                if (criteria.riesgo && lead.riesgo !== criteria.riesgo) matches = false;
                if (criteria.min_score && lead.score < Number(criteria.min_score)) matches = false;
                if (criteria.max_price && lead.precio > Number(criteria.max_price)) matches = false;
                if (criteria.min_monto && lead.monto_solicitado < Number(criteria.min_monto)) matches = false;
                if (matches) { ids.add(lead.id); break; }
            }
        });
        return ids;
    }, [leads, subscriptions]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortOption]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Marketplace de Leads</h1>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between gap-4 flex-wrap">
                 <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
                    <span className="text-sm font-medium text-brand-gray-600 dark:text-gray-300">Filtrar:</span>
                    <select value={filters.vertical} onChange={e => setFilters({...filters, vertical: e.target.value})} className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary text-sm">
                        <option value="all">Todas las Verticales</option>
                        <option value="Colpensiones">Colpensiones</option>
                        <option value="Fopep">Fopep</option>
                        <option value="Magisterio">Magisterio</option>
                        <option value="Fuerzas Militares">Fuerzas Militares</option>
                    </select>
                    <select value={filters.riesgo} onChange={e => setFilters({...filters, riesgo: e.target.value})} className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary text-sm">
                        <option value="all">Todos los Riesgos</option>
                        <option value="bajo">Bajo</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                    </select>
                     <span className="text-sm font-medium text-brand-gray-600 dark:text-gray-300 sm:pl-2">Ordenar:</span>
                     <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary text-sm">
                        <option value="fecha_creacion-desc">Más Recientes</option>
                        <option value="precio-asc">Precio (Menor a Mayor)</option>
                        <option value="precio-desc">Precio (Mayor a Menor)</option>
                        <option value="score-desc">Score (Mayor a Menor)</option>
                    </select>
                </div>
                 <button onClick={handleRefresh} disabled={isRefreshing || loading} className="p-2 rounded-full text-brand-gray-500 dark:text-gray-400 hover:bg-brand-gray-100 dark:hover:bg-gray-700 hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-wait" title="Refrescar leads">
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing || loading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.5-1.5a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l1.5-1.5A5.002 5.002 0 005 7.101V9a1 1 0 11-2 0V3a1 1 0 011-1zm12 16a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.5 1.5a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414l-1.5 1.5a5.002 5.002 0 008.399 2.899V17a1 1 0 112 0v1a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            {loading ? <div className="text-center py-10 dark:text-white">Cargando leads disponibles...</div> : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {leads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} onPurchase={handlePurchase} onViewDetails={setViewingLead} isRecommended={recommendedLeadIds.has(lead.id)} />
                    ))}
                </div>
                 <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalLeads / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                    totalItems={totalLeads}
                />
                </>
            )}

            <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Confirmar Compra">
                {selectedLead && (
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                             <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 dark:bg-gray-700">
                                <svg className="h-6 w-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-brand-text dark:text-white">Resumen de la Compra</h3>
                                <p className="text-sm text-brand-gray-600 dark:text-gray-300">Estás a punto de comprar este lead. La acción debitará el costo de tu saldo.</p>
                            </div>
                        </div>
                        <div className="bg-brand-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                             <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-gray-300">Vertical:</span> <span className="font-bold">{selectedLead.vertical}</span></div>
                             <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-gray-300">Monto Solicitado:</span> <span className="font-bold">${selectedLead.monto_solicitado.toLocaleString('es-CO')}</span></div>
                             <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-gray-300">Score:</span> <span className="font-bold">{selectedLead.score}</span></div>
                             <div className="flex justify-between text-lg border-t pt-2 mt-2 border-brand-gray-200 dark:border-gray-600"><span className="text-brand-gray-600 dark:text-gray-300 font-semibold">Precio Final:</span> <span className="font-bold text-brand-secondary">${selectedLead.precio.toLocaleString('es-CO')}</span></div>
                        </div>
                        <div className="border-t pt-4 mt-4 space-y-1 text-sm border-brand-gray-200 dark:border-gray-600">
                            <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Saldo Actual:</span><span className="dark:text-white">${empresa.saldo.toLocaleString('es-CO')}</span></div>
                            <div className="flex justify-between"><span className="text-brand-gray-600 dark:text-gray-300">Costo del Lead:</span><span className="text-brand-danger">-${selectedLead.precio.toLocaleString('es-CO')}</span></div>
                            <div className="flex justify-between font-bold text-brand-text dark:text-white border-t pt-2 mt-2 border-brand-gray-200 dark:border-gray-600"><span>Saldo Restante:</span><span>${(empresa.saldo - selectedLead.precio).toLocaleString('es-CO')}</span></div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-gray-600">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={isPurchaseConfirmed} onChange={(e) => setIsPurchaseConfirmed(e.target.checked)} className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary border-brand-gray-300 dark:bg-gray-700 dark:border-gray-500" />
                                <span className="text-sm text-brand-gray-600 dark:text-gray-300">Confirmo que he revisado los detalles y acepto el débito de mi saldo.</span>
                            </label>
                        </div>
                        <div className="flex justify-end pt-4 space-x-3">
                            <button onClick={() => setSelectedLead(null)} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                            <button onClick={confirmPurchase} disabled={isConfirming || !isPurchaseConfirmed} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark disabled:bg-opacity-50 disabled:cursor-not-allowed">{isConfirming ? 'Procesando...' : 'Confirmar y Comprar'}</button>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal isOpen={!!viewingLead} onClose={() => setViewingLead(null)} title="Detalles del Lead (Anónimo)" size="lg">
                {viewingLead && (
                     <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 text-brand-primary dark:bg-gray-700">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-brand-text dark:text-white">{viewingLead.vertical}</h2>
                                <p className="text-sm text-brand-gray-500 dark:text-gray-400">ID: <span className="font-mono text-xs">{viewingLead.id}</span></p>
                            </div>
                        </div>
                        <div className="border-t pt-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Detalles Financieros</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">Monto Solicitado:</span> <span className="font-medium text-brand-text dark:text-white">${viewingLead.monto_solicitado.toLocaleString('es-CO')}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Pagaduría:</span> <span className="font-medium text-brand-text dark:text-white">{viewingLead.pagaduria}</span></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text dark:text-white border-b pb-2 mb-3 dark:border-gray-700">Clasificación de CREBIT</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">Score:</span> <span className="font-medium text-brand-text dark:text-white">{viewingLead.score}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Riesgo:</span> <span className="font-medium text-brand-text dark:text-white capitalize">{viewingLead.riesgo}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Intención:</span> <span className="font-medium text-brand-text dark:text-white capitalize">{viewingLead.intencion}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t mt-6 dark:border-gray-700">
                            <button onClick={() => { const leadToPurchase = viewingLead; setViewingLead(null); handlePurchase(leadToPurchase); }} className="bg-brand-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
                               <span>Proceder a la Compra</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MarketplaceLeads;