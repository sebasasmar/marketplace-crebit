import React, { useState, useEffect } from 'react';
import type { Empresa } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '@/services/api';

const TrendIndicator: React.FC<{ trend: number }> = ({ trend }) => {
    const isPositive = trend >= 0;
    return (
        <span className={`flex items-center text-xs font-medium ml-2 ${isPositive ? 'text-brand-secondary' : 'text-brand-danger'}`}>
            {isPositive ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            )}
            {Math.abs(trend)}%
        </span>
    );
};

const StatCard = ({ title, value, icon, color, trend }: { title: string, value: string | number, icon: React.ReactNode, color: string, trend?: number }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-brand-gray-500 dark:text-gray-400">{title}</p>
             <div className="flex items-center">
                <p className="text-2xl font-bold text-brand-text dark:text-white">{value}</p>
                {trend !== undefined && <TrendIndicator trend={trend} />}
            </div>
        </div>
    </div>
);

interface EmpresaAnalyticsProps {
    empresa: Empresa;
}

const EmpresaAnalytics: React.FC<EmpresaAnalyticsProps> = ({ empresa }) => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [empresaStats, empresaChartData] = await Promise.all([
                apiService.getEmpresaStats(empresa.id),
                apiService.getEmpresaChartData()
            ]);
            setStats(empresaStats);
            setChartData(empresaChartData);
            setLoading(false);
        };
        fetchData();
    }, [empresa.id]);

    const LeadsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    const ConversionIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    const WalletIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;

    
    if (loading || !stats || !chartData) return <div className="text-center p-10 dark:text-white">Cargando tu rendimiento...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Mi Rendimiento</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Leads Comprados" value={stats.leadsComprados} icon={LeadsIcon} color="bg-brand-primary" trend={stats.leadsCompradosTrend}/>
                <StatCard title="Tasa de Conversión" value={`${stats.tasaConversion?.toFixed(1) || 0}%`} icon={ConversionIcon} color="bg-brand-secondary" trend={stats.tasaConversionTrend}/>
                <StatCard title="Saldo Disponible" value={`$${stats.saldoDisponible?.toLocaleString('es-CO') || 0}`} icon={WalletIcon} color="bg-brand-accent"/>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-brand-text dark:text-white mb-4">Rendimiento Semanal</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.performanceData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: 'rgb(107 114 128)' }} />
                            <YAxis tick={{ fill: 'rgb(107 114 128)' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', color: 'white', borderRadius: '0.5rem', border: '1px solid rgb(55 65 81)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Comprados" stroke="#FF8C42" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Convertidos" stroke="#4CAF50" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default EmpresaAnalytics;