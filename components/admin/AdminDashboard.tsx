import React, { useState } from 'react';
import type { UserProfile } from '@/types';
import Header from '../layout/Header';
import Layout from '../layout/Layout';
import AdminAnalytics from './AdminAnalytics';
import LeadsManager from './LeadsManager';
import EmpresasManager from './EmpresasManager';
import ComprasManager from './ComprasManager';
import LeadReportsManager from './LeadReportsManager';
import SystemConfig from './SystemConfig';

interface AdminDashboardProps {
    user: UserProfile;
    onLogout: () => void;
}

const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const OfficeBuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const FlagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState('analytics');
    const [initialLeadFilters, setInitialLeadFilters] = useState<any>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { key: 'analytics', label: 'Analytics', icon: <ChartBarIcon /> },
        { key: 'leads', label: 'Gestionar Leads', icon: <DocumentTextIcon /> },
        { key: 'empresas', label: 'Gestionar Empresas', icon: <OfficeBuildingIcon /> },
        { key: 'compras', label: 'Todas las Compras', icon: <ShoppingCartIcon /> },
        { key: 'reports', label: 'Reportes de Calidad', icon: <FlagIcon /> },
        { key: 'config', label: 'Configuración', icon: <CogIcon /> },
    ];

    const handleFilterFromAnalytics = (filters: any) => {
        setInitialLeadFilters(filters);
        setActiveView('leads');
    };

    const renderContent = () => {
        switch (activeView) {
            case 'analytics': return <AdminAnalytics onFilterLeads={handleFilterFromAnalytics} />;
            case 'leads': return <LeadsManager initialFilters={initialLeadFilters} />;
            case 'empresas': return <EmpresasManager />;
            case 'compras': return <ComprasManager />;
            case 'reports': return <LeadReportsManager />;
            case 'config': return <SystemConfig />;
            default: return <AdminAnalytics onFilterLeads={handleFilterFromAnalytics} />;
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <Header user={user} onLogout={onLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <Layout
                menuItems={menuItems}
                activeView={activeView}
                onViewChange={(view) => {
                    setInitialLeadFilters({}); // Reset filters when changing views manually
                    setActiveView(view);
                }}
                isSidebarOpen={isSidebarOpen}
                onCloseSidebar={() => setIsSidebarOpen(false)}
            >
                {/* Fix: Add wrapper div to apply fade-in animation on view change. */}
                <div className="animate-fade-in">
                    {renderContent()}
                </div>
            </Layout>
        </div>
    );
};

export default AdminDashboard;
