import React, { useState, useEffect, useCallback } from 'react';
import type { Empresa, LeadSubscription, LeadVertical, LeadRiesgo } from '@/types';
import { apiService } from '@/services/api';
import Modal from '@components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '../ui/PaginationControls';
import EmptyState from '../ui/EmptyState';

interface LeadSubscriptionsProps {
    empresa: Empresa;
}

const initialNewSubState: Omit<LeadSubscription, 'id' | 'empresa_id' | 'daily_purchases'> = {
    name: '',
    criteria: { vertical: '', riesgo: '', min_score: '', max_price: '', min_monto: '' },
    max_daily_purchases: 5,
    active: true
};

const LeadSubscriptions: React.FC<LeadSubscriptionsProps> = ({ empresa }) => {
    const [subscriptions, setSubscriptions] = useState<LeadSubscription[]>([]);
    const [totalSubscriptions, setTotalSubscriptions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<LeadSubscription | null>(null);
    const [subscriptionData, setSubscriptionData] = useState(initialNewSubState);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const { addToast } = useToast();

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true);
        const { data, total } = await apiService.getSubscriptions({ empresaId: empresa.id, page: currentPage, limit: itemsPerPage });
        setSubscriptions(data);
        setTotalSubscriptions(total);
        setLoading(false);
    }, [empresa.id, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCriteria = Object.fromEntries(
            Object.entries(subscriptionData.criteria).map(([key, value]) => [key, value === '' ? undefined : value])
        );

        const dataToSave = { ...subscriptionData, criteria: cleanCriteria };

        if (editingSubscription) {
            await apiService.editSubscription(editingSubscription.id, dataToSave);
            addToast('Suscripción actualizada.', 'success');
        } else {
            await apiService.createLeadSubscription({ ...dataToSave, empresa_id: empresa.id });
            addToast('Suscripción creada.', 'success');
        }
        closeModal();
        fetchSubscriptions();
    };

    const handleDelete = async (subId: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar esta suscripción?')) {
            await apiService.deleteSubscription(subId);
            addToast('Suscripción eliminada.', 'success');
            fetchSubscriptions();
        }
    };
    
    const handleToggleActive = async (sub: LeadSubscription) => {
        const updatedSub = await apiService.updateSubscription(sub.id, !sub.active);
        if (updatedSub) {
            setSubscriptions(prev => prev.map(s => s.id === sub.id ? updatedSub : s));
            addToast(`Suscripción ${updatedSub.active ? 'activada' : 'desactivada'}.`, 'info');
        }
    }

    const openModal = (sub: LeadSubscription | null = null) => {
        if (sub) {
            setEditingSubscription(sub);
            setSubscriptionData({
                name: sub.name,
                criteria: {
                    vertical: sub.criteria.vertical || '',
                    riesgo: sub.criteria.riesgo || '',
                    min_score: sub.criteria.min_score || '',
                    max_price: sub.criteria.max_price || '',
                    min_monto: sub.criteria.min_monto || '',
                },
                max_daily_purchases: sub.max_daily_purchases,
                active: sub.active,
            });
        } else {
            setEditingSubscription(null);
            setSubscriptionData(initialNewSubState);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSubscription(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text dark:text-white">Filtros Automáticos</h1>
                <button onClick={() => openModal()} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors w-full md:w-auto">
                    Crear Suscripción
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                {loading ? <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />)}</div> : (
                    subscriptions.length > 0 ? (
                        <div className="space-y-4">
                            {subscriptions.map(sub => (
                                <div key={sub.id} className="border dark:border-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-brand-text dark:text-white">{sub.name}</h3>
                                        <p className="text-xs text-brand-gray-500 dark:text-gray-400">
                                            {Object.entries(sub.criteria).filter(([, val]) => val).map(([key, val]) => `${key}: ${val}`).join(' | ') || "Cualquier lead"}
                                        </p>
                                        <p className="text-xs text-brand-gray-500 dark:text-gray-400">Límite: {sub.daily_purchases}/{sub.max_daily_purchases} compras diarias</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button onClick={() => openModal(sub)} className="text-brand-primary hover:underline text-sm font-medium">Editar</button>
                                        <button onClick={() => handleDelete(sub.id)} className="text-brand-danger hover:underline text-sm font-medium">Eliminar</button>
                                        <label htmlFor={`toggle-${sub.id}`} className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input type="checkbox" id={`toggle-${sub.id}`} className="sr-only" checked={sub.active} onChange={() => handleToggleActive(sub)} />
                                                <div className={`block w-10 h-6 rounded-full ${sub.active ? 'bg-brand-secondary' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${sub.active ? 'transform translate-x-full' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            ))}
                             <PaginationControls
                                currentPage={currentPage}
                                totalPages={Math.ceil(totalSubscriptions / itemsPerPage)}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                                totalItems={totalSubscriptions}
                            />
                        </div>
                    ) : (
                       <EmptyState 
                          title="Crea tu primer filtro automático"
                          message="Las suscripciones comprarán leads por ti basados en los criterios que definas."
                          actionText="Crear Suscripción"
                          onAction={() => openModal()}
                       />
                    )
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSubscription ? 'Editar Suscripción' : 'Crear Suscripción'} size="lg">
                 <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="sub-name" className="block text-sm font-medium text-brand-text dark:text-white">Nombre del Filtro</label>
                        <input
                            id="sub-name"
                            type="text"
                            value={subscriptionData.name}
                            onChange={e => setSubscriptionData({ ...subscriptionData, name: e.target.value })}
                            required
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ej: Leads de bajo riesgo Colpensiones"
                        />
                    </div>
                    
                    <fieldset className="border dark:border-gray-600 p-4 rounded-md">
                        <legend className="text-sm font-medium text-brand-text dark:text-white px-1">Criterios de Compra</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-xs text-brand-gray-600 dark:text-gray-300">Vertical</label>
                                <select
                                    value={subscriptionData.criteria.vertical || ''}
                                    onChange={e => setSubscriptionData({ ...subscriptionData, criteria: { ...subscriptionData.criteria, vertical: e.target.value as LeadVertical | '' } })}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Cualquiera</option>
                                    <option value="Colpensiones">Colpensiones</option>
                                    <option value="Fopep">Fopep</option>
                                    <option value="Magisterio">Magisterio</option>
                                    <option value="Fuerzas Militares">Fuerzas Militares</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-brand-gray-600 dark:text-gray-300">Riesgo</label>
                                <select
                                    value={subscriptionData.criteria.riesgo || ''}
                                    onChange={e => setSubscriptionData({ ...subscriptionData, criteria: { ...subscriptionData.criteria, riesgo: e.target.value as LeadRiesgo | '' } })}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Cualquiera</option>
                                    <option value="bajo">Bajo</option>
                                    <option value="medio">Medio</option>
                                    <option value="alto">Alto</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-brand-gray-600 dark:text-gray-300">Score Mínimo</label>
                                <input
                                    type="number"
                                    value={subscriptionData.criteria.min_score || ''}
                                    onChange={e => setSubscriptionData({ ...subscriptionData, criteria: { ...subscriptionData.criteria, min_score: e.target.value } })}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej: 70"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-brand-gray-600 dark:text-gray-300">Precio Máximo ($)</label>
                                <input
                                    type="number"
                                    value={subscriptionData.criteria.max_price || ''}
                                    onChange={e => setSubscriptionData({ ...subscriptionData, criteria: { ...subscriptionData.criteria, max_price: e.target.value } })}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej: 15000"
                                />
                            </div>
                        </div>
                    </fieldset>

                    <div>
                        <label htmlFor="max-purchases" className="block text-sm font-medium text-brand-text dark:text-white">Máximo de Compras Diarias</label>
                        <input
                            id="max-purchases"
                            type="number"
                            min="1"
                            value={subscriptionData.max_daily_purchases}
                            onChange={e => setSubscriptionData({ ...subscriptionData, max_daily_purchases: Number(e.target.value) })}
                            required
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end pt-4 space-x-3 border-t dark:border-gray-600">
                        <button type="button" onClick={closeModal} className="bg-brand-gray-200 text-brand-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-brand-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark">
                            {editingSubscription ? 'Guardar Cambios' : 'Crear Filtro'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LeadSubscriptions;