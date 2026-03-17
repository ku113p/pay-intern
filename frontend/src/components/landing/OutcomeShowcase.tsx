import { useTranslation } from 'react-i18next';
import { AnimatedSection } from './AnimatedSection';

export function OutcomeShowcase() {
  const { t } = useTranslation('landing');
  const card = t('outcome.card', { returnObjects: true }) as {
    role: string;
    company: string;
    duration: string;
    criteria: string[];
    rating: number;
    review: string;
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('outcome.title')}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-lg">{card.role}</p>
                  <p className="text-indigo-100 text-sm">{card.company}</p>
                </div>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{card.duration}</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Outcome Criteria
                </p>
                <ul className="space-y-2">
                  {card.criteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.floor(card.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{card.rating}</span>
                </div>
                <p className="text-sm text-gray-600 italic">&ldquo;{card.review}&rdquo;</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
