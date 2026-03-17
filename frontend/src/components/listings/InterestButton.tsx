import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { interestsApi } from '../../api/interests';

interface InterestButtonProps {
  listingId: string;
  listingAuthorId: string;
  userId?: string;
  initialInterested?: boolean;
  variant?: 'icon' | 'full';
}

export function InterestButton({
  listingId,
  listingAuthorId,
  userId,
  initialInterested = false,
  variant = 'icon',
}: InterestButtonProps) {
  const [interested, setInterested] = useState(initialInterested);
  const hidden = !userId || userId === listingAuthorId;

  const toggleMutation = useMutation({
    mutationFn: () =>
      interested ? interestsApi.removeInterest(listingId) : interestsApi.addInterest(listingId),
    onMutate: () => {
      setInterested(!interested);
    },
    onSuccess: (res) => {
      if (res.data.matched) {
        toast.success("It's a match! Both parties signaled interest.");
      }
    },
    onError: () => {
      setInterested(interested);
      toast.error('Failed to update interest');
    },
  });

  // Don't render for own listing or not authenticated
  if (hidden) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMutation.mutate();
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border ${
          interested
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill={interested ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {interested ? 'Interested' : "I'm interested"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${interested ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
      title={interested ? 'Remove interest' : "Signal interest"}
    >
      <svg className="h-5 w-5" fill={interested ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
