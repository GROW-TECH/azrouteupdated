import React from 'react';

/**
 * Pagination Component
 * @param {Object} props - Component props
 * @param {number} props.currentPage - The current active page
 * @param {number} props.totalPages - The total number of pages
 * @param {Function} props.onPageChange - Callback function to handle page changes
 */
export function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center space-x-2 mt-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 border rounded-md ${
              currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
}

/**
 * Pagination Content Wrapper
 * @param {Object} props - Wrapper props
 * @param {React.ReactNode} props.children - Content to display inside pagination
 */
export function PaginationContent({ children }) {
  return <div className="pagination-content mt-6">{children}</div>;
}

/**
 * Pagination Item Wrapper
 * @param {Object} props - Wrapper props
 * @param {React.ReactNode} props.children - Content to display inside the pagination item
 */
export function PaginationItem({ children }) {
  return <span className="pagination-item">{children}</span>;
}

/**
 * Pagination Link Component
 * @param {Object} props - Link props
 * @param {boolean} props.isActive - Whether the link is active
 * @param {Function} props.onClick - Callback function for click events
 * @param {React.ReactNode} props.children - Link content
 */
export function PaginationLink({ isActive, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 border rounded-md ${
        isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Previous Button Component
 * @param {Object} props - Button props
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onClick - Callback function for click events
 */
export function PaginationPrev({ disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      Previous
    </button>
  );
}

/**
 * Next Button Component
 * @param {Object} props - Button props
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onClick - Callback function for click events
 */
export function PaginationNext({ disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      Next
    </button>
  );
}
