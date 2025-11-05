import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

type AppConfig = {
  lead_prices: {
    bajo: number;
    medio: number;
    alto: number;
  };
  commission_rates: {
    freemium: number;
    basico: number;
    profesional: number;
    empresarial: number;
  };
};

const SystemConfig: React.FC = () => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const data = await apiService.getAppConfig();
            setConfig(data);
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!config) return;
        setConfig({
            ...config,
            lead_prices: { ...config.lead_prices, [name]: Number(value) }
        });
    };
    
    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!config) return;
        setConfig({
            ...config,
            commission_rates: { ...config.commission_rates, [name]: Number(value) }
        });
    };

    const handleSave = async () => {
        if (!config) return;
        setLoading(true);
        await apiService.updateAppConfig(config);
        setLoading(false);
        addToast('Configuración guardada exitosamente.', 'success');
    };

    if (loading && !config) {
        return <div className="text-center p-10 dark:text-white">Cargando configuración...</div>;
    }
    
    if (!config) {
         return <div className="text-center p-10 dark:text-white">No se pudo cargar la configuración.</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Configuración del Sistema</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-4">Precios de Leads por Riesgo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Bajo ($)</label>
                        <input type="number" name="bajo" value={config.lead_prices.bajo} onChange={handlePriceChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Medio ($)</label>
                        <input type="number" name="medio" value={config.lead_prices.medio} onChange={handlePriceChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Alto ($)</label>
                        <input type="number" name="alto" value={config.lead_prices.alto} onChange={handlePriceChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-brand-text dark:text-white mb-4">Tasas de Comisión por Plan</h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Freemium (%)</label>
                        <input type="number" name="freemium" value={config.commission_rates.freemium} onChange={handleCommissionChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Básico (%)</label>
                        <input type="number" name="basico" value={config.commission_rates.basico} onChange={handleCommissionChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Profesional (%)</label>
                        <input type="number" name="profesional" value={config.commission_rates.profesional} onChange={handleCommissionChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-gray-600 dark:text-gray-300">Empresarial (%)</label>
                        <input type="number" name="empresarial" value={config.commission_rates.empresarial} onChange={handleCommissionChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-brand-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors disabled:bg-opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};

export default SystemConfig;