import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applicationsApi } from '../../api/applications';

export function ContactInfoCard({ applicationId }: { applicationId: string }) {
  const [revealed, setRevealed] = useState(false);

  const { data: contact, isLoading, refetch } = useQuery({
    queryKey: ['contact', applicationId],
    queryFn: () => applicationsApi.getContact(applicationId).then((r) => r.data),
    enabled: false,
  });

  const handleReveal = () => {
    setRevealed(true);
    refetch();
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => toast.success('Email copied!'));
  };

  if (!revealed) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-green-800">Contact info available</span>
        <button
          onClick={handleReveal}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Reveal Contact Details
        </button>
      </div>
    );
  }

  if (isLoading || !contact) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-gray-500">Loading contact info...</p>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
      <p className="text-sm font-medium text-green-900">
        Contact Details for {contact.display_name}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Email:</span>
          <span className="text-gray-900">{contact.email}</span>
          <button
            onClick={() => copyEmail(contact.email)}
            className="text-xs text-indigo-600 hover:text-indigo-500 border border-indigo-200 px-1.5 py-0.5 rounded"
          >
            Copy
          </button>
        </div>
        {contact.links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{link.label || link.link_type}:</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
              {link.url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
