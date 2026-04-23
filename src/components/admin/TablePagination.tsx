import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push('...');
      }
    }
    return Array.from(new Set(pages));
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-surface-container-lowest/50 border-t border-outline-variant/10 gap-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-primary/40">
        Showing <span className="text-secondary">{startItem}-{endItem}</span> of <span className="text-primary">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-[10px] font-black text-primary/20">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === page
                      ? 'bg-primary text-secondary shadow-lg shadow-primary/10'
                      : 'text-primary/40 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
