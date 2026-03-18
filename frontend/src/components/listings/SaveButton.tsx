import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { interestsApi } from '../../api/interests';

interface SaveButtonProps {
  listingId: string;
  initialSaved?: boolean;
  variant?: 'icon' | 'full';
}

export function SaveButton({ listingId, initialSaved = false, variant = 'icon' }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (action: 'save' | 'unsave') =>
      action === 'unsave' ? interestsApi.unsaveListing(listingId) : interestsApi.saveListing(listingId),
    onMutate: () => {
      setSaved((prev) => !prev);
    },
    onError: () => {
      setSaved((prev) => !prev);
      toast.error('Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-listings'] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMutation.mutate(saved ? 'unsave' : 'save');
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        disabled={toggleMutation.isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border ${
          saved
            ? 'bg-primary-50 border-primary-200 text-primary-700'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className="text-gray-400 hover:text-primary-600"
      title={saved ? 'Remove bookmark' : 'Save for later'}
    >
      <svg className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
