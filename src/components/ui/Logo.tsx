import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <div className="bg-brand-primary p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <span className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">CREBIT</span>
        </div>
    );
};

export default Logo;
