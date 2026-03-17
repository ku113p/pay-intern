import { useTranslation } from 'react-i18next';
import { AnimatedSection } from './AnimatedSection';

function CellIcon({ value }: { value: string }) {
  if (value === 'yes')
    return (
      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  if (value === 'no')
    return (
      <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  return <span className="text-amber-500 text-xs font-medium">~</span>;
}

export function ComparisonSection() {
  const { t } = useTranslation('landing');

  const headers = t('comparison.headers', { returnObjects: true }) as string[];
  const rows = t('comparison.rows', { returnObjects: true }) as Array<{
    label: string;
    values: string[];
  }>;

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('comparison.title')}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 font-semibold ${
                        i === 0 ? 'text-left' : 'text-center'
                      } ${i === 1 ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3 px-4 font-medium text-gray-700">{row.label}</td>
                    {row.values.map((v, vi) => (
                      <td
                        key={vi}
                        className={`py-3 px-4 text-center ${vi === 0 ? 'bg-indigo-50/50' : ''}`}
                      >
                        <CellIcon value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
