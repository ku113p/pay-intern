import { useTranslation } from 'react-i18next';
import type { Perspective } from './PerspectiveToggle';
import { AnimatedSection } from './AnimatedSection';

export function HowItWorksSection({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');
  const p = perspective;

  const steps = t(`howItWorks.${p}.steps`, { returnObjects: true }) as Array<{
    title: string;
    desc: string;
  }>;

  const accentColor = p === 'company' ? 'text-blue-600' : 'text-green-600';
  const bgAccent = p === 'company' ? 'bg-blue-600' : 'bg-green-600';

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t(`howItWorks.${p}.title`)}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16.7%] right-[16.7%] h-0.5 bg-gray-200" />

          {steps.map((step, i) => (
            <AnimatedSection key={i} delay={i * 200} className="relative text-center">
              <div
                className={`w-10 h-10 ${bgAccent} text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 relative z-10`}
              >
                {i + 1}
              </div>
              <h3 className={`text-lg font-semibold ${accentColor} mb-2`}>{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
