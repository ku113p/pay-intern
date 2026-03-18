import { useState } from 'react';
import { LandingNav } from './LandingNav';
import { PerspectiveToggle, type Perspective } from './PerspectiveToggle';
import { HeroSection } from './HeroSection';
import { PainPointsSection } from './PainPointsSection';
import { SolutionSection } from './SolutionSection';
import { HowItWorksSection } from './HowItWorksSection';
import { OutcomeShowcase } from './OutcomeShowcase';
import { SocialProofSection } from './SocialProofSection';
import { DirectAccessSection } from './DirectAccessSection';
import { ComparisonSection } from './ComparisonSection';
import { TechSection } from './TechSection';
import { FAQSection } from './FAQSection';
import { FinalCTASection } from './FinalCTASection';
import { StickyMobileCTA } from './StickyMobileCTA';
import { Footer } from '../layout/Footer';

export function LandingPage() {
  const [perspective, setPerspective] = useState<Perspective>('company');

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <LandingNav />
      <HeroSection perspective={perspective} />
      <PerspectiveToggle value={perspective} onChange={setPerspective} sticky />
      <PainPointsSection perspective={perspective} />
      <SolutionSection />
      <HowItWorksSection perspective={perspective} />
      <OutcomeShowcase />
      <SocialProofSection />
      <DirectAccessSection />
      <ComparisonSection />
      <TechSection />
      <FAQSection perspective={perspective} />
      <FinalCTASection perspective={perspective} />
      <Footer />
      <StickyMobileCTA perspective={perspective} />
    </div>
  );
}
