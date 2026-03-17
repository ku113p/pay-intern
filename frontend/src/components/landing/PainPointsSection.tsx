import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { useEffect, useState } from 'react';
import type { Perspective } from './PerspectiveToggle';
import { AnimatedSection } from './AnimatedSection';

function CountUp({ target }: { target: string }) {
  const { ref, isInView } = useInView(0.3);
  const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
  const isNumeric = !isNaN(numeric);
  const prefix = target.match(/^[^0-9]*/)?.[0] ?? '';
  const [display, setDisplay] = useState(isNumeric ? `${prefix}0` : target);

  useEffect(() => {
    if (!isInView || !isNumeric) return;
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      if (progress >= 1) {
        setDisplay(target);
      } else {
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * numeric);
        setDisplay(`${prefix}${current.toLocaleString()}`);
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, isNumeric, numeric, prefix, target]);

  return <span ref={ref}>{display}</span>;
}

export function PainPointsSection({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');
  const p = perspective;

  const stats = t(`painPoints.${p}.stats`, { returnObjects: true }) as Array<{
    value: string;
    label: string;
    source: string;
  }>;

  const accentColor = p === 'company' ? 'text-blue-600' : 'text-green-600';

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t(`painPoints.${p}.title`)}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <AnimatedSection
              key={i}
              delay={i * 150}
              className="bg-white rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`text-4xl sm:text-5xl font-extrabold ${accentColor} mb-3`}>
                <CountUp target={stat.value} />
              </div>
              <p className="text-gray-700 font-medium">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-2">{t('sourceLabel')}: {stat.source}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
