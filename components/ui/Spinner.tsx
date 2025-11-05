import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
    };
    return (
        <div className={`animate-spin rounded-full border-solid border-brand-primary border-t-transparent ${sizeClasses[size]} ${className}`} role="status">
            <span className="sr-only">Cargando...</span>
        </div>
    );
};

export default Spinner;
