import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Perspective } from './PerspectiveToggle';

export function HeroSection({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');
  const p = perspective;

  const gradientClass =
    p === 'company'
      ? 'from-blue-50 via-white to-white'
      : 'from-green-50 via-white to-white';

  const accentColor = p === 'company' ? 'text-blue-600' : 'text-green-600';
  const btnClass =
    p === 'company'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-green-600 hover:bg-green-700';
  const btnOutlineClass =
    p === 'company'
      ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
      : 'border-green-600 text-green-600 hover:bg-green-50';

  return (
    <section className={`bg-gradient-to-b ${gradientClass} pt-28 pb-16 px-4`}>
      <div className="max-w-4xl mx-auto text-center">
        <span
          className={`inline-block text-xs font-semibold tracking-widest uppercase ${accentColor} mb-6`}
        >
          {t(`hero.${p}.badge`)}
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
          {t(`hero.${p}.headline1`)}
          <br />
          <span className={accentColor}>{t(`hero.${p}.headline2`)}</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
          {t(`hero.${p}.sub`)}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-10">
          <Link
            to="/login"
            className={`${btnClass} text-white px-8 py-3.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all text-center`}
          >
            {t(`hero.${p}.cta`)}
          </Link>
          <Link
            to={p === 'company' ? '/companies' : '/developers'}
            className={`border-2 ${btnOutlineClass} px-8 py-3.5 rounded-lg text-sm font-semibold transition text-center`}
          >
            {t(`hero.${p}.ctaSecondary`)}
          </Link>
        </div>
      </div>
    </section>
  );
}
