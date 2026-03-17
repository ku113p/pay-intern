import { useTranslation } from 'react-i18next';

export type Perspective = 'company' | 'professional';

export function PerspectiveToggle({
  value,
  onChange,
  sticky = false,
}: {
  value: Perspective;
  onChange: (p: Perspective) => void;
  sticky?: boolean;
}) {
  const { t } = useTranslation('landing');

  return (
    <div
      className={`flex justify-center py-3 ${
        sticky ? 'sticky top-[57px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100' : ''
      }`}
    >
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => onChange('company')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            value === 'company'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('perspectiveToggle.forCompanies')}
        </button>
        <button
          onClick={() => onChange('professional')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            value === 'professional'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('perspectiveToggle.forProfessionals')}
        </button>
      </div>
    </div>
  );
}
