import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Perspective } from './PerspectiveToggle';
import { AnimatedSection } from './AnimatedSection';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-center justify-between gap-4 hover:text-primary-600 transition-colors"
      >
        <span className="font-medium text-gray-900">{q}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '500px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="text-sm text-gray-600 leading-relaxed pb-4">{a}</p>
      </div>
    </div>
  );
}

export function FAQSection({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');

  const shared = t('faq.shared', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const perspectiveItems = t(`faq.${perspective}`, { returnObjects: true }) as Array<{
    q: string;
    a: string;
  }>;
  const items = [...shared, ...perspectiveItems];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('faq.title')}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="bg-white rounded-xl border border-gray-200 px-6 divide-y-0">
            {items.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
