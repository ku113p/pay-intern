import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Perspective } from './PerspectiveToggle';
import { AnimatedSection } from './AnimatedSection';

export function FinalCTASection({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');
  const p = perspective;

  const gradientClass =
    p === 'company'
      ? 'from-blue-600 to-blue-700'
      : 'from-green-600 to-green-700';

  return (
    <section className={`py-20 px-4 bg-gradient-to-br ${gradientClass}`}>
      <AnimatedSection className="max-w-3xl mx-auto text-center text-white">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          {t(`finalCta.${p}.title`)}
        </h2>
        <p className="text-lg text-white/80 mt-4 max-w-xl mx-auto">
          {t(`finalCta.${p}.sub`)}
        </p>
        <Link
          to="/login"
          className="inline-block mt-8 bg-white text-gray-900 px-8 py-3.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          {t(`finalCta.${p}.cta`)}
        </Link>
      </AnimatedSection>
    </section>
  );
}
