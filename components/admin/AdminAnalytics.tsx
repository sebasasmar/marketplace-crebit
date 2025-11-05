import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiService } from '@/services/api';
import type { LeadRiesgo, LeadVertical } from '@/types';

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

interface AdminAnalyticsProps {
    onFilterLeads: (filters: { riesgo?: LeadRiesgo, vertical?: LeadVertical }) => void;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onFilterLeads }) => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [adminStats, adminChartData] = await Promise.all([
                apiService.getAdminStats(),
                apiService.getAdminChartData()
            ]);
            setStats(adminStats);
            setChartData(adminChartData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const LeadsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    const MoneyIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
    const BuildingIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;

    const mockRiskData = [
        { name: 'Bajo', count: 45, riesgo: 'bajo' as LeadRiesgo },
        { name: 'Medio', count: 30, riesgo: 'medio' as LeadRiesgo },
        { name: 'Alto', count: 15, riesgo: 'alto' as LeadRiesgo },
    ];
    
    if (loading || !stats || !chartData) return <div className="text-center p-10 dark:text-white">Cargando analíticas...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-text dark:text-white">Dashboard Administrativo</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Leads Vendidos" value={`${stats.leadsVendidos} / ${stats.totalLeads}`} icon={LeadsIcon} color="bg-brand-primary" trend={stats.leadsVendidosTrend} />
                <StatCard title="Ingresos Totales" value={`$${stats.ingresosTotales.toLocaleString('es-CO')}`} icon={MoneyIcon} color="bg-brand-accent" trend={stats.ingresosTotalesTrend} />
                <StatCard title="Empresas Activas" value={stats.empresasActivas} icon={BuildingIcon} color="bg-brand-secondary"/>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-brand-text dark:text-white mb-4">Ingresos Mensuales</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: 'rgb(107 114 128)' }} />
                            <YAxis tick={{ fill: 'rgb(107 114 128)' }} tickFormatter={(value) => `$${(Number(value)/1000)}k`}/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', color: 'white', borderRadius: '0.5rem', border: '1px solid rgb(55 65 81)' }} formatter={(value) => `$${Number(value).toLocaleString()}`}/>
                            <Legend />
                            <Line type="monotone" dataKey="Ingresos" stroke="#FF8C42" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-brand-text dark:text-white mb-4">Leads por Nivel de Riesgo</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mockRiskData} onClick={(data) => data?.activePayload?.[0] && onFilterLeads({ riesgo: data.activePayload[0].payload.riesgo })}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: 'rgb(107 114 128)' }} />
                            <YAxis tick={{ fill: 'rgb(107 114 128)' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', color: 'white', borderRadius: '0.5rem', border: '1px solid rgb(55 65 81)' }} cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} />
                            <Legend />
                            <Bar dataKey="count" name="Cantidad" fill="#FF8C42" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;