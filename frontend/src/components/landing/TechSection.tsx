import { useTranslation } from 'react-i18next';
import { AnimatedSection } from './AnimatedSection';

export function TechSection() {
  const { t } = useTranslation('landing');

  const points = t('tech.points', { returnObjects: true }) as Array<{
    title: string;
    desc: string;
  }>;

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('tech.title')}
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            {t('tech.sub')}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {points.map((point, i) => (
            <AnimatedSection
              key={i}
              delay={i * 150}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />}
                  {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
                  {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />}
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{point.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{point.desc}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
