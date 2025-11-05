import React from 'react';

interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
    return (
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} scope="col" className="px-6 py-3">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <tr key={i} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                        {Array.from({ length: columns }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                               <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};