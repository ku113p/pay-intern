import { useTranslation } from 'react-i18next';
import { AnimatedSection } from './AnimatedSection';

export function SocialProofSection() {
  const { t } = useTranslation('landing');

  const stats = t('socialProof.stats', { returnObjects: true }) as Array<{
    value: string;
    label: string;
  }>;
  const testimonials = t('socialProof.testimonials', { returnObjects: true }) as Array<{
    quote: string;
    name: string;
    title: string;
  }>;

  return (
    <section className="py-20 px-4 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t('socialProof.title')}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <AnimatedSection key={i} delay={i * 100} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </AnimatedSection>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, i) => (
            <AnimatedSection
              key={i}
              delay={i * 200}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <svg className="w-8 h-8 text-indigo-500 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">{testimonial.quote}</p>
              <div>
                <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.title}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
