interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        disabled={page === 1}
        onClick={onPrev}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={onNext}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
