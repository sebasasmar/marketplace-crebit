import React, { useState, useEffect } from 'react';
import type { UserProfile, Empresa, Notification } from '@/types';
import Logo from '@components/ui/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';

interface HeaderProps {
    user: UserProfile & { empresa?: Empresa };
    onLogout: () => void;
    onToggleSidebar?: () => void;
}

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 hover:text-brand-primary dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
            {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
        </button>
    );
};

const NotificationBell: React.FC<{ userId: string }> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        // FIX: Implement a robust polling mechanism using recursive setTimeout
        // to prevent overlapping requests and handle network errors gracefully.
        let isMounted = true;
        const pollingTimeout = 20000; // Poll every 20 seconds

        const poll = async () => {
            if (!isMounted) return;

            try {
                // Only update state if the API call is successful.
                const data = await apiService.getNotifications(userId);
                if (isMounted) {
                    setNotifications(data);
                }
            } catch (error) {
                // If the fetch fails (e.g., due to a temporary network issue),
                // log the error but do not clear the existing notifications.
                // The polling will automatically retry after the timeout.
                console.warn('Failed to fetch notifications:', (error as Error).message);
            } finally {
                // Schedule the next poll only after the current one has finished.
                if (isMounted) {
                    setTimeout(poll, pollingTimeout);
                }
            }
        };

        // Start the initial poll.
        poll();

        // Cleanup function to stop polling when the component unmounts.
        return () => {
            isMounted = false;
        };
    }, [userId]);

    const handleMarkAsRead = async () => {
        await apiService.markNotificationsAsRead(userId);
        setNotifications(notifications.map(n => ({...n, is_read: true})));
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 hover:text-brand-primary dark:hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 justify-center items-center text-white text-[8px] font-bold">{unreadCount}</span></span>}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark z-50">
                    <div className="p-3 flex justify-between items-center border-b border-border-light dark:border-border-dark">
                        <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">Notificaciones</h4>
                        {unreadCount > 0 && <button onClick={handleMarkAsRead} className="text-xs text-brand-primary hover:underline">Marcar todas como leídas</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} className={`p-3 border-b border-border-light dark:border-border-dark ${!n.is_read ? 'bg-orange-50 dark:bg-gray-900/50' : ''}`}>
                                <p className="text-sm text-text-primary-light dark:text-text-primary-dark">{n.message}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                        )) : <p className="p-4 text-sm text-center text-text-secondary-light dark:text-text-secondary-dark">No hay notificaciones.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar }) => {
    return (
        <header className="bg-card-light dark:bg-card-dark sticky top-0 z-40 border-b border-border-light dark:border-border-dark">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <button onClick={onToggleSidebar} className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark mr-2 md:hidden">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="hidden md:block">
                            <Logo />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {user.rol === 'empresa' && user.empresa && (
                             <div className="hidden sm:flex items-center space-x-2 bg-background-light dark:bg-background-dark px-3 py-1.5 rounded-full">
                                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Saldo:</span>
                                <span className="font-bold text-brand-secondary">${user.empresa.saldo.toLocaleString('es-CO')}</span>
                            </div>
                        )}
                        <ThemeToggle />
                        <NotificationBell userId={user.id} />
                        <div className="w-px h-6 bg-border-light dark:bg-border-dark hidden sm:block"></div>
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
                                {user.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{user.nombre}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{user.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onLogout} 
                            className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 hover:text-brand-danger dark:hover:bg-gray-700 transition-colors"
                            title="Cerrar sesión"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;