import React, { useState } from 'react';

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
}

interface LayoutProps {
    menuItems: MenuItem[];
    activeView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
    isSidebarOpen: boolean;
    onCloseSidebar: () => void;
}

const SidebarContent: React.FC<{
    isExpanded: boolean;
    menuItems: MenuItem[];
    activeView: string;
    onViewChange: (view: string) => void;
}> = ({ isExpanded, menuItems, activeView, onViewChange }) => (
    <div className="flex flex-col h-full">
        <div className="flex-grow p-4 pt-8">
            <nav className="space-y-2">
                {menuItems.map(item => (
                    <div key={item.key} className="relative group">
                        <button
                            onClick={() => onViewChange(item.key)}
                            className={`w-full flex items-center space-x-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 overflow-hidden relative ${
                                isExpanded ? 'px-4' : 'justify-center'
                            } ${
                                activeView === item.key
                                    ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light'
                                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            {activeView === item.key && <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary rounded-r-full"></div>}
                            {item.icon}
                            {(isExpanded) && <span className="whitespace-nowrap transition-opacity duration-300">{item.label}</span>}
                        </button>
                        {!isExpanded && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none hidden md:block">
                                {item.label}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    </div>
);

const Layout: React.FC<LayoutProps> = ({ menuItems, activeView, onViewChange, children, isSidebarOpen, onCloseSidebar }) => {
    const [isHoverExpanded, setIsHoverExpanded] = useState(false);

    return (
        <div className="h-[calc(100vh-64px)] flex">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60" onClick={onCloseSidebar}></div>
                <div className={`relative w-64 bg-card-light dark:bg-card-dark h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent isExpanded={true} menuItems={menuItems} activeView={activeView} onViewChange={(view) => { onViewChange(view); onCloseSidebar(); }} />
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside 
                className={`hidden md:flex flex-col bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark transition-all duration-300 ease-in-out ${isHoverExpanded ? 'w-64' : 'w-20'}`}
                onMouseEnter={() => setIsHoverExpanded(true)}
                onMouseLeave={() => setIsHoverExpanded(false)}
            >
                <SidebarContent isExpanded={isHoverExpanded} menuItems={menuItems} activeView={activeView} onViewChange={onViewChange} />
            </aside>

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
                  {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;