import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsApi, type CreateListingRequest } from '../../api/listings';
import { useAuthStore } from '../../stores/auth';

export function ListingForm() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isCompany = user?.role === 'company';

  const [form, setForm] = useState<CreateListingRequest>({
    title: '',
    description: '',
    tech_stack: [],
    duration_weeks: 4,
    format: 'remote',
    experience_level: 'any',
    outcome_criteria: isCompany ? ['', '', ''] : undefined,
  });
  const [techInput, setTechInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.tech_stack.includes(t)) {
      setForm({ ...form, tech_stack: [...form.tech_stack, t] });
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setForm({ ...form, tech_stack: form.tech_stack.filter((t) => t !== tech) });
  };

  const updateCriteria = (index: number, value: string) => {
    const criteria = [...(form.outcome_criteria || [])];
    criteria[index] = value;
    setForm({ ...form, outcome_criteria: criteria });
  };

  const addCriteria = () => {
    setForm({ ...form, outcome_criteria: [...(form.outcome_criteria || []), ''] });
  };

  const removeCriteria = (index: number) => {
    const criteria = (form.outcome_criteria || []).filter((_, i) => i !== index);
    setForm({ ...form, outcome_criteria: criteria });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        outcome_criteria: form.outcome_criteria?.filter((c) => c.trim()),
      };
      const res = await listingsApi.createListing(payload);
      navigate(`/listings/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          required
          minLength={3}
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          minLength={10}
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
        <div className="flex gap-2 mt-1">
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
            placeholder="Add technology"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <button type="button" onClick={addTech} className="bg-gray-200 px-4 py-2 rounded-md text-sm">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {form.tech_stack.map((tech) => (
            <span key={tech} className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1">
              {tech}
              <button type="button" onClick={() => removeTech(tech)} className="text-indigo-400 hover:text-indigo-600">&times;</button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (weeks)</label>
          <input
            type="number"
            required
            min={1}
            max={52}
            value={form.duration_weeks}
            onChange={(e) => setForm({ ...form, duration_weeks: +e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
          <input
            type="number"
            min={0}
            value={form.price_usd ?? ''}
            onChange={(e) => setForm({ ...form, price_usd: e.target.value ? +e.target.value : undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Format</label>
        <select
          value={form.format}
          onChange={(e) => setForm({ ...form, format: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Experience Level</label>
        <select
          value={form.experience_level || 'any'}
          onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="any">Any level</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
        </select>
      </div>

      {isCompany && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Outcome Criteria (min 3)
          </label>
          <div className="space-y-2 mt-1">
            {(form.outcome_criteria || []).map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={c}
                  onChange={(e) => updateCriteria(i, e.target.value)}
                  placeholder={`Criterion ${i + 1}`}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {(form.outcome_criteria?.length || 0) > 3 && (
                  <button type="button" onClick={() => removeCriteria(i)} className="text-red-400 hover:text-red-600 text-sm">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addCriteria} className="text-sm text-indigo-600 hover:text-indigo-800 mt-2">
            + Add criterion
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  );
}
