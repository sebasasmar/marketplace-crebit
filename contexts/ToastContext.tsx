import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

// Fix: Add 'warning' to ToastType to support warning notifications.
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const Toast: React.FC<ToastMessage & { onDismiss: (id: number) => void }> = ({ id, message, type, onDismiss }) => {
    // Fix: Add styles for the new 'warning' toast type for appropriate visual feedback.
    const typeClasses: Record<ToastType, string> = {
        success: 'bg-brand-secondary',
        error: 'bg-brand-danger',
        info: 'bg-blue-500',
        warning: 'bg-brand-accent'
    };
    
    // Fix: Add an icon for the new 'warning' toast type.
    const Icon: Record<ToastType, React.ReactNode> = {
        success: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        error: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        info: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        warning: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    return (
        // Fix: Use the correct Tailwind animation class `animate-fade-in-up` instead of `fade-in-up`.
        <div className="flex items-start w-full max-w-sm p-4 my-2 bg-card-light dark:bg-card-dark rounded-xl shadow-lg animate-fade-in-up" role="alert">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white ${typeClasses[type]}`}>
                 {Icon[type]}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{message}</p>
            </div>
             <button
                type="button"
                className="ml-4 flex-shrink-0 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                onClick={() => onDismiss(id)}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        setToasts(currentToasts => [
            ...currentToasts,
            { id: Date.now(), message, type },
        ]);
    }, []);
    
    const removeToast = useCallback((id: number) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);


    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100]">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
