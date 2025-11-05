import React from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    totalItems: number;
    sortOptions?: { value: string; label: string }[];
    currentSort?: string;
    onSortChange?: (value: string) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems,
    sortOptions,
    currentSort,
    onSortChange,
}) => {
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            let startPage = currentPage - halfPagesToShow;
            let endPage = currentPage + halfPagesToShow;

            if (startPage < 1) {
                endPage += Math.abs(startPage) + 1;
                startPage = 1;
            }

            if (endPage > totalPages) {
                startPage -= endPage - totalPages;
                endPage = totalPages;
            }
            
            startPage = Math.max(startPage, 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
        }
        return pageNumbers;
    };
    
    if (totalItems === 0) return null;
    
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 text-sm px-4 py-2 border-t dark:border-gray-700 gap-4">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                <div className="flex items-center space-x-2">
                    <span className="text-brand-gray-600 dark:text-gray-400">Items por página:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="p-1 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value={10}>10</option>
                        <option value={12}>12</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {sortOptions && onSortChange && currentSort && (
                    <div className="flex items-center space-x-2">
                        <span className="text-brand-gray-600 dark:text-gray-400">Ordenar por:</span>
                        <select
                            value={currentSort}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="p-1 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <span className="text-brand-gray-500 dark:text-gray-400 md:pl-4">
                    Mostrando {startItem}-{endItem} de {totalItems}
                </span>
            </div>
            <nav className="flex items-center space-x-1">
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">«</button>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">‹</button>
                {getPageNumbers().map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-brand-primary text-white' : 'hover:bg-brand-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {page}
                    </button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">›</button>
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">»</button>
            </nav>
        </div>
    );
};

export default PaginationControls;