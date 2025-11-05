import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-transparent flex-shrink-0">
                <img src="/logo-crebit.png" alt="Crebit logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">MarketLeads</span>
        </div>
    );
};

export default Logo;