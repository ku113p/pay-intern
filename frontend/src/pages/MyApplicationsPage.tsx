import { ApplicationList } from '../components/applications/ApplicationList';

export function MyApplicationsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Applications</h1>
      <ApplicationList />
    </div>
  );
}
