import React, { useState, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
        } else {
            // Delay unmounting for the animation to complete
            const timer = setTimeout(() => setShowModal(false), 300); // Should match duration-300
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!showModal) return null;

    const sizeClasses: Record<string, string> = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
    };

    return (
        <div 
            className={`fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div 
                className={`bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full ${sizeClasses[size]} transform transition-all duration-300 flex flex-col max-h-[90vh] ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark flex-shrink-0">
                    <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary-light hover:text-text-primary-light dark:text-text-secondary-dark dark:hover:text-text-primary-dark transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="flex justify-end p-4 border-t border-border-light dark:border-border-dark flex-shrink-0 bg-background-light dark:bg-background-dark/50 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
