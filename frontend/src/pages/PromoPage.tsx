import { useState } from 'react';
import { Link } from 'react-router-dom';

type Perspective = 'company' | 'developer';

/* ─── Floating Toggle ─────────────────────────────────────────────── */

function FloatingToggle({
  perspective,
  onChange,
}: {
  perspective: Perspective;
  onChange: (p: Perspective) => void;
}) {
  return (
    <div className="sticky top-0 z-40 flex justify-center py-3 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="inline-flex bg-gray-100 rounded-full p-1">
        <button
          onClick={() => onChange('company')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            perspective === 'company'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          For Companies
        </button>
        <button
          onClick={() => onChange('developer')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            perspective === 'developer'
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          For Developers
        </button>
      </div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */

const heroContent = {
  company: {
    badge: 'The try-before-you-hire marketplace',
    headline: <>Stop Guessing.<br />Start Evaluating.</>,
    sub: 'Post real work. Set measurable criteria. See how candidates actually perform — before you make a single hire.',
    cta: 'Post Your First Listing',
    gradient: 'from-blue-900 via-blue-800 to-indigo-900',
    badgeColor: 'text-blue-300',
    subColor: 'text-blue-200',
    btnClass: 'bg-blue-500 hover:bg-blue-400',
  },
  developer: {
    badge: 'The prove-your-skills marketplace',
    headline: <>Prove Your Skills<br />With Real Work</>,
    sub: 'Skip the resume black hole. Work on real projects with real companies and get verified proof of your abilities.',
    cta: 'Find a Project',
    gradient: 'from-green-900 via-green-800 to-emerald-900',
    badgeColor: 'text-green-300',
    subColor: 'text-green-200',
    btnClass: 'bg-green-500 hover:bg-green-400',
  },
};

function Hero({ perspective }: { perspective: Perspective }) {
  const c = heroContent[perspective];
  return (
    <section className={`relative bg-gradient-to-br ${c.gradient} text-white transition-all duration-500`}>
      <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-xl">
          DevStage
        </Link>
        <Link
          to="/login"
          className="text-white/70 hover:text-white text-sm border border-white/20 rounded-lg px-4 py-1.5 hover:border-white/40 transition"
        >
          Sign in
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 text-center">
        <p className={`${c.badgeColor} text-sm font-medium tracking-widest uppercase mb-4`}>
          {c.badge}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
          {c.headline}
        </h1>
        <p className={`mt-6 text-lg sm:text-xl ${c.subColor} max-w-2xl mx-auto`}>
          {c.sub}
        </p>
        <div className="mt-10">
          <Link
            to="/login"
            className={`inline-block ${c.btnClass} text-white px-10 py-4 rounded-xl text-lg font-semibold transition shadow-lg hover:shadow-xl`}
          >
            {c.cta}
          </Link>
        </div>
      </div>

      {/* Decorative gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ─── Pain Points ─────────────────────────────────────────────────── */

const painContent = {
  company: {
    title: 'Hiring Is Broken',
    stats: [
      { value: '$36,000', label: 'Average cost of one bad hire through an agency' },
      { value: '55%', label: 'IT employees who admit to lying on their resume' },
      { value: '57%', label: 'Interview accuracy — barely better than a coin flip' },
    ],
    body: 'You spend thousands on recruiting agencies, run weeks of interviews, and still end up with bad hires. 74% of employers have been there.',
    cta: 'Try a Different Approach',
    accent: 'text-blue-600',
    btnClass: 'border-blue-600 text-blue-600 hover:bg-blue-50',
  },
  developer: {
    title: 'The Vicious Circle',
    stats: [
      { value: '73%', label: 'Decline in entry-level tech hiring since 2023' },
      { value: '35%', label: '"Entry-level" jobs that require 3+ years of experience' },
      { value: '6 months', label: 'Average junior job search — 200+ applications' },
    ],
    body: "You can't get a job without experience, and you can't get experience without a job. Sound familiar?",
    cta: 'Break the Loop',
    accent: 'text-green-600',
    btnClass: 'border-green-600 text-green-600 hover:bg-green-50',
  },
};

function PainPoints({ perspective }: { perspective: Perspective }) {
  const c = painContent[perspective];
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          {c.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          {c.stats.map((s) => (
            <div key={s.value} className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
              <p className={`text-4xl sm:text-5xl font-bold ${c.accent}`}>{s.value}</p>
              <p className="mt-3 text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-gray-600 max-w-2xl mx-auto">
          {c.body}
        </p>
        <div className="text-center mt-8">
          <Link
            to="/login"
            className={`inline-block border-2 ${c.btnClass} px-8 py-3 rounded-lg font-semibold transition`}
          >
            {c.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Solution ────────────────────────────────────────────────────── */

function Solution() {
  const pillars = [
    {
      icon: '\u{1F4BB}',
      title: 'Real Projects',
      desc: 'Work on actual codebases with real companies. Not simulations, not puzzles — production code.',
    },
    {
      icon: '\u{1F3AF}',
      title: 'Measurable Criteria',
      desc: 'Every listing has clear outcome criteria. You know exactly what success looks like before you start.',
    },
    {
      icon: '\u2705',
      title: 'Verified Results',
      desc: 'Structured outcome reviews — pass, partial, or fail per criterion. Real proof you can show anyone.',
    },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Not a Job Board. Not a Bootcamp.
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Real work with real teams. Measurable outcomes. Verified proof.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow">
              <span className="text-3xl">{p.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────────────────────────────────── */

const howContent = {
  company: {
    title: 'Three Steps to Better Hiring',
    label: 'For Companies',
    labelColor: 'text-blue-600',
    steps: [
      { num: '1', title: 'Post a Listing', desc: 'Define what you need. Set measurable outcome criteria (at least 3). Choose duration, tech stack, and format.' },
      { num: '2', title: 'Review Applications', desc: 'Motivated developers apply with a message. Accept the ones who fit.' },
      { num: '3', title: 'Evaluate Real Work', desc: 'Review their actual output against your criteria. Rate each one: pass, partial, or fail. Hire with confidence.' },
    ],
    borderColor: 'border-blue-100',
    numBg: 'bg-blue-100 text-blue-700',
    cta: 'Post a Listing',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
  },
  developer: {
    title: 'Three Steps to Real Experience',
    label: 'For Developers',
    labelColor: 'text-green-600',
    steps: [
      { num: '1', title: 'Find a Project', desc: 'Browse company listings. Filter by tech stack, format, duration, and experience level.' },
      { num: '2', title: 'Work with a Real Team', desc: 'Get accepted and start working. Real codebase, real deadlines, real mentorship.' },
      { num: '3', title: 'Get Verified Proof', desc: 'Receive a structured outcome review. Pass criteria become verified proof of your skills.' },
    ],
    borderColor: 'border-green-100',
    numBg: 'bg-green-100 text-green-700',
    cta: 'Find a Project',
    btnClass: 'bg-green-600 hover:bg-green-700',
  },
};

function HowItWorks({ perspective }: { perspective: Perspective }) {
  const c = howContent[perspective];
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          {c.title}
        </h2>
        <p className={`text-center ${c.labelColor} text-sm font-medium mt-2`}>{c.label}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {c.steps.map((s) => (
            <div key={s.num} className={`border ${c.borderColor} rounded-xl p-6 hover:shadow-sm transition-shadow`}>
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${c.numBg} font-bold text-lg`}>
                {s.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/login"
            className={`inline-block ${c.btnClass} text-white px-8 py-3 rounded-lg font-semibold transition`}
          >
            {c.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Outcome Criteria Showcase ───────────────────────────────────── */

function OutcomeShowcase() {
  const criteria = [
    { criterion: 'Deploy to production', result: 'pass' as const },
    { criterion: 'Write 5+ pull requests', result: 'pass' as const },
    { criterion: 'Unit test coverage > 80%', result: 'partial' as const },
    { criterion: 'Participate in code reviews', result: 'pass' as const },
  ];

  const resultStyles = {
    pass: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    fail: 'bg-red-100 text-red-800',
  };

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Not Stars. Not Reviews.<br />Structured Proof.
        </h2>

        <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Outcome Review</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">Acme Corp</p>

          <div className="mt-4 space-y-2">
            {criteria.map((c) => (
              <div key={c.criterion} className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${resultStyles[c.result]}`}>
                  {c.result}
                </span>
                <span className="text-sm text-gray-700">{c.criterion}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Overall Recommendation</p>
            <p className="text-sm font-semibold text-green-700 mt-0.5">Ready to Hire</p>
          </div>

          <p className="mt-4 text-sm text-gray-600 italic">
            "Alex delivered consistently and showed strong growth
            in testing practices over the 4-week engagement."
          </p>
        </div>

        <p className="mt-8 text-center text-gray-600 max-w-xl mx-auto">
          Every company listing has at least 3 measurable outcome criteria.
          After the engagement, each criterion is rated pass, partial, or fail.
          This is real, structured evidence — not a 5-star rating.
        </p>
      </div>
    </section>
  );
}

/* ─── Numbers ─────────────────────────────────────────────────────── */

function Numbers() {
  const stats = [
    { value: '$600B', label: 'Annual cost of resume fraud to U.S. businesses' },
    { value: '85%', label: 'Companies that want skills-based hiring' },
    { value: '0.14%', label: 'Companies that actually practice it' },
    { value: '1.2M', label: 'Projected U.S. software engineer shortage by 2026' },
    { value: '48%', label: 'Interview candidates using unauthorized AI tools' },
    { value: '42%', label: 'Better prediction: work samples vs interviews' },
  ];

  return (
    <section className="bg-gradient-to-br from-indigo-900 to-indigo-950 py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="text-4xl sm:text-5xl font-bold text-white">{s.value}</p>
              <p className="mt-2 text-sm text-indigo-300">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison Table ────────────────────────────────────────────── */

function Comparison() {
  const rows = [
    { feature: 'Real work', trad: 'No', freelance: 'Sometimes', tests: 'No', devstage: 'Yes' },
    { feature: 'Skill verification', trad: 'Resume / interview', freelance: 'Star ratings', tests: 'Simulated', devstage: 'Structured outcomes' },
    { feature: 'Two-way evaluation', trad: 'No', freelance: 'Partial', tests: 'No', devstage: 'Yes' },
    { feature: 'Junior-friendly', trad: 'Rarely', freelance: 'No', tests: 'Irrelevant', devstage: 'Yes' },
    { feature: 'Cost', trad: '$18K-$36K', freelance: '20-55% markup', tests: 'Per-test fees', devstage: 'Listing-based' },
    { feature: 'Mentorship', trad: 'No', freelance: 'No', tests: 'No', devstage: 'Built-in' },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          How DevStage Compares
        </h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 pr-4 font-medium text-gray-500">Feature</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500">Traditional</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500">Freelance</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500">Coding Tests</th>
                <th className="text-center py-3 px-3 font-semibold text-indigo-700">DevStage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{r.feature}</td>
                  <td className="text-center py-3 px-3 text-gray-500">{r.trad}</td>
                  <td className="text-center py-3 px-3 text-gray-500">{r.freelance}</td>
                  <td className="text-center py-3 px-3 text-gray-500">{r.tests}</td>
                  <td className="text-center py-3 px-3 font-semibold text-indigo-700">{r.devstage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────── */

function FAQ({ perspective }: { perspective: Perspective }) {
  const [open, setOpen] = useState<number | null>(null);

  const sharedFaqs = [
    {
      q: 'Is DevStage free?',
      a: 'Browsing listings and signing in is free. Pricing for posting listings varies by engagement type.',
    },
    {
      q: 'Who pays whom?',
      a: 'Each listing specifies its payment direction. Companies can pay developers for their work, or developers can pay for a learning opportunity. The direction and amount are always clearly displayed.',
    },
    {
      q: 'How are results verified?',
      a: 'Company teams evaluate your work against pre-defined outcome criteria. Each criterion is rated pass, partial, or fail.',
    },
  ];

  const perspectiveFaqs = {
    company: [
      { q: 'How do I get started as a company?', a: 'Sign in, set up your company profile, and post your first listing with at least 3 outcome criteria.' },
      { q: 'What kind of projects work best?', a: 'Well-scoped tasks with clear deliverables — feature builds, bug fixes, infrastructure tasks, API development, etc.' },
    ],
    developer: [
      { q: 'Can I use DevStage alongside my current job?', a: 'Yes. Many listings offer flexible schedules and remote formats. Duration ranges from 1 to 52 weeks.' },
      { q: 'What kind of projects are available?', a: 'Real software projects across all major tech stacks — from web apps to APIs to infrastructure.' },
    ],
  };

  const faqs = [...sharedFaqs, ...perspectiveFaqs[perspective]];

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              >
                <span className="font-medium text-gray-900">{faq.q}</span>
                <span className={`text-gray-400 text-xl shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${open === i ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                <div className="px-5">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ───────────────────────────────────────────────────── */

const ctaContent = {
  company: {
    title: 'Ready to Hire Smarter?',
    sub: 'Post your first listing and see real work from real candidates.',
    cta: 'Get Started',
    btnClass: 'bg-blue-500 hover:bg-blue-400',
  },
  developer: {
    title: 'Ready to Prove Yourself?',
    sub: 'Find a real project and build verified proof of your skills.',
    cta: 'Get Started',
    btnClass: 'bg-green-500 hover:bg-green-400',
  },
};

function FinalCTA({ perspective }: { perspective: Perspective }) {
  const c = ctaContent[perspective];
  return (
    <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 py-16 sm:py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          {c.title}
        </h2>
        <p className="mt-4 text-lg text-indigo-200">
          {c.sub}
        </p>
        <div className="mt-10">
          <Link
            to="/login"
            className={`inline-block ${c.btnClass} text-white px-10 py-4 rounded-xl text-lg font-semibold transition shadow-lg hover:shadow-xl`}
          >
            {c.cta}
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-indigo-600/50">
          <Link to="/" className="text-indigo-300 hover:text-white text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Sticky Mobile CTA ──────────────────────────────────────────── */

const mobileCta = {
  company: {
    label: 'Post a Listing',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
  },
  developer: {
    label: 'Browse Listings',
    btnClass: 'bg-green-600 hover:bg-green-700',
  },
};

function StickyMobileCTA({ perspective }: { perspective: Perspective }) {
  const c = mobileCta[perspective];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
      <Link
        to="/login"
        className={`flex-1 ${c.btnClass} text-white text-center py-2.5 rounded-lg text-sm font-semibold transition`}
      >
        {c.label}
      </Link>
      <Link
        to="/login"
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
      >
        Sign In
      </Link>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export function PromoPage() {
  const [perspective, setPerspective] = useState<Perspective>('company');

  return (
    <div className="min-h-screen">
      <Hero perspective={perspective} />
      <FloatingToggle perspective={perspective} onChange={setPerspective} />
      <PainPoints perspective={perspective} />
      <Solution />
      <HowItWorks perspective={perspective} />
      <OutcomeShowcase />
      <Numbers />
      <Comparison />
      <FAQ perspective={perspective} />
      <FinalCTA perspective={perspective} />
      <StickyMobileCTA perspective={perspective} />
    </div>
  );
}
