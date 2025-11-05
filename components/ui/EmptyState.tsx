import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

const DefaultIcon = () => (
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionText, onAction, icon = <DefaultIcon /> }) => {
    return (
        <div className="text-center py-16 px-6">
            {icon}
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            {actionText && onAction && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onAction}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                    >
                        {actionText}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;