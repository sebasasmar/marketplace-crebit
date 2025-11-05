import React, { useState, useMemo, useCallback } from 'react';
import type { UserProfile, Empresa } from '@/types';
import Header from '../layout/Header';
import Layout from '../layout/Layout';
import EmpresaAnalytics from './EmpresaAnalytics';
import MarketplaceLeads from './MarketplaceLeads';
import MisCompras from './MisCompras';
import LeadSubscriptions from './LeadSubscriptions';
import GestionPlan from './GestionPlan';
import APIAccess from './APIAccess';
import { apiService } from '@/services/api';


interface EmpresaDashboardProps {
    user: UserProfile & { empresa: Empresa };
    onLogout: () => void;
}

const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ShoppingBagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;


const EmpresaDashboard: React.FC<EmpresaDashboardProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState('analytics');
    const [empresaData, setEmpresaData] = useState<Empresa>(user.empresa);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = useMemo(() => {
        const items = [
            { key: 'analytics', label: 'Mi Rendimiento', icon: <ChartBarIcon /> },
            { key: 'marketplace', label: 'Marketplace', icon: <ShoppingBagIcon /> },
            { key: 'compras', label: 'Mis Compras', icon: <BriefcaseIcon /> },
            { key: 'subscriptions', label: 'Filtros Automáticos', icon: <FilterIcon /> },
            { key: 'plan', label: 'Plan y Saldo', icon: <CreditCardIcon /> },
        ];
        if (empresaData.plan === 'empresarial') {
            items.push({ key: 'api', label: 'Acceso API', icon: <CodeIcon /> });
        }
        return items;
    }, [empresaData.plan]);
    
    const handlePurchaseSuccess = (leadPrice: number) => {
        setEmpresaData(prevEmpresa => ({
            ...prevEmpresa,
            saldo: prevEmpresa.saldo - leadPrice,
            leads_comprados: prevEmpresa.leads_comprados + 1,
        }));
    };
    
    const refreshEmpresaData = useCallback(async () => {
        const freshData = await apiService.getEmpresaForUser(user.id);
        if (freshData) {
            setEmpresaData(freshData);
        }
    }, [user.id]);


    const renderContent = () => {
        switch (activeView) {
            case 'analytics': return <EmpresaAnalytics empresa={empresaData} />;
            case 'marketplace': return <MarketplaceLeads empresa={empresaData} onPurchaseSuccess={handlePurchaseSuccess}/>;
            case 'compras': return <MisCompras empresa={empresaData} />;
            case 'subscriptions': return <LeadSubscriptions empresa={empresaData} />;
            case 'plan': return <GestionPlan empresa={empresaData} onRechargeComplete={refreshEmpresaData} />;
            case 'api': return empresaData.plan === 'empresarial' ? <APIAccess /> : null;
            default: return <EmpresaAnalytics empresa={empresaData} />;
        }
    };

    const userWithUpdatedEmpresa = { ...user, empresa: empresaData };

    return (
        <div className="flex flex-col h-screen">
            <Header user={userWithUpdatedEmpresa} onLogout={onLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}/>
            <Layout
                menuItems={menuItems}
                activeView={activeView}
                onViewChange={setActiveView}
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

export default EmpresaDashboard;
