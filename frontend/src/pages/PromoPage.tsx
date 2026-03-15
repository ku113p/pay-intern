import { useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Section 1: Hero ──────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 text-white">
      <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-xl">
          DevStage
        </Link>
        <Link to="/login" className="text-indigo-200 hover:text-white text-sm">
          Sign in
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 text-center">
        <p className="text-indigo-300 text-sm font-medium tracking-widest uppercase mb-4">
          The try-before-you-hire marketplace
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
          Work Speaks Louder<br />Than Resumes
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-indigo-200 max-w-2xl mx-auto">
          The marketplace where companies and developers connect through real work
          &mdash; not interviews, not resumes, not coding puzzles.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-10">
          <Link
            to="/developers"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition text-center"
          >
            I'm a Developer
          </Link>
          <Link
            to="/register"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition text-center"
          >
            I'm a Company
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 2: Pain — Companies ──────────────────────────────────── */

function PainCompanies() {
  const stats = [
    { value: '$36,000', label: 'Average cost of hiring one developer through an agency' },
    { value: '55%', label: 'IT employees who admit to lying on their resume' },
    { value: '57%', label: 'Accuracy of traditional job interviews — barely better than a coin flip' },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Hiring Is Broken
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {stats.map((s) => (
            <div key={s.value} className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
              <p className="text-4xl sm:text-5xl font-bold text-indigo-600">{s.value}</p>
              <p className="mt-3 text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-gray-600 max-w-2xl mx-auto">
          You spend thousands on recruiting agencies, run weeks of interviews,
          and still end up with bad hires. 74% of employers have been there.
        </p>
        <div className="text-center mt-8">
          <Link
            to="/register"
            className="inline-block border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition"
          >
            Try a Different Approach
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 3: Pain — Developers ─────────────────────────────────── */

function PainDevelopers() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          The Vicious Circle
        </h2>

        {/* Circular paradox visual */}
        <div className="mt-10 flex items-center justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-300" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow text-sm font-medium text-gray-800">
              Need experience
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow text-sm font-medium text-gray-800">
              Need a job
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 text-gray-400 text-2xl">
              &rarr;
            </div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2 text-gray-400 text-2xl">
              &larr;
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">73%</p>
            <p className="text-xs text-gray-600 mt-1">Decline in entry-level tech hiring since 2023</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">35%</p>
            <p className="text-xs text-gray-600 mt-1">"Entry-level" jobs that require 3+ years of experience</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">6 months</p>
            <p className="text-xs text-gray-600 mt-1">Average junior developer job search, 200+ applications</p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/register"
            className="inline-block border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-lg font-semibold transition"
          >
            Break the Loop
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 4: Solution ──────────────────────────────────────────── */

function Solution() {
  const pillars = [
    {
      title: 'Real Projects',
      desc: 'Work on actual codebases with real companies. Not simulations, not puzzles — production code.',
    },
    {
      title: 'Measurable Criteria',
      desc: 'Every listing has clear outcome criteria. You know exactly what success looks like before you start.',
    },
    {
      title: 'Verified Results',
      desc: 'Structured outcome reviews — pass, partial, or fail per criterion. Real proof you can show anyone.',
    },
  ];

  return (
    <section className="bg-indigo-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Not a Job Board. Not a Bootcamp.
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Real work with real teams. Measurable outcomes. Verified proof.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-6 shadow-sm text-left">
              <h3 className="text-lg font-semibold text-indigo-700">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            to="/developers"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Browse Listings
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 5: How It Works — Companies ──────────────────────────── */

function HowItWorksCompanies() {
  const steps = [
    {
      num: '1',
      title: 'Post a Listing',
      desc: 'Define what you need. Set measurable outcome criteria (at least 3). Choose duration, tech stack, and format.',
    },
    {
      num: '2',
      title: 'Review Applications',
      desc: 'Motivated developers apply with a message. Accept the ones who fit.',
    },
    {
      num: '3',
      title: 'Evaluate Real Work',
      desc: 'Review their actual output against your criteria. Rate each one: pass, partial, or fail. Hire with confidence.',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Three Steps to Better Hiring
        </h2>
        <p className="text-center text-blue-600 text-sm font-medium mt-2">For Companies</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {steps.map((s) => (
            <div key={s.num} className="border border-blue-100 rounded-xl p-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                {s.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Post a Listing
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 6: How It Works — Developers ─────────────────────────── */

function HowItWorksDevelopers() {
  const steps = [
    {
      num: '1',
      title: 'Find a Project',
      desc: 'Browse company listings. Filter by tech stack, format, duration, and experience level.',
    },
    {
      num: '2',
      title: 'Work with a Real Team',
      desc: 'Get accepted and start working. Real codebase, real deadlines, real mentorship.',
    },
    {
      num: '3',
      title: 'Get Verified Proof',
      desc: 'Receive a structured outcome review. Pass criteria become verified proof of your skills.',
    },
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Three Steps to Real Experience
        </h2>
        <p className="text-center text-green-600 text-sm font-medium mt-2">For Developers</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {steps.map((s) => (
            <div key={s.num} className="border border-green-100 rounded-xl p-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-lg">
                {s.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/developers"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Find a Project
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 7: Outcome Criteria Showcase ─────────────────────────── */

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
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Not Stars. Not Reviews.<br />Structured Proof.
        </h2>

        {/* Mock outcome review card */}
        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 max-w-lg mx-auto">
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

        <div className="text-center mt-8">
          <Link
            to="/developers"
            className="inline-block border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition"
          >
            See How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 8: Challenge Seekers ─────────────────────────────────── */

function ChallengeSeekers() {
  return (
    <section className="bg-indigo-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Bored? Prove You Can.
        </h2>
        <p className="mt-6 text-lg text-gray-600">
          52% of developers code after work for fun. But LeetCode problems don't ship
          to production. Hackathon projects die after the weekend.
        </p>
        <p className="mt-4 text-lg text-gray-700 font-medium">
          DevStage is different: real production challenges from real companies.
          Solve actual problems. Get verified results. Build a track record
          that means something.
        </p>
        <div className="mt-8">
          <Link
            to="/developers"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Take the Challenge
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 9: Numbers ───────────────────────────────────────────── */

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
    <section className="bg-indigo-900 py-16 sm:py-20 lg:py-24">
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

/* ─── Section 10: Comparison Table ─────────────────────────────────── */

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
        <div className="text-center mt-10">
          <Link
            to="/register"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 11: FAQ ──────────────────────────────────────────────── */

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Is DevStage free?',
      a: 'Browsing listings and creating an account is free. Pricing for posting listings varies by engagement type.',
    },
    {
      q: 'Who pays whom?',
      a: "It depends on the listing. Companies may pay developers for their work, or developers may pay for the learning opportunity. Each listing specifies its own terms.",
    },
    {
      q: 'What kind of projects are available?',
      a: 'Real software projects across all major tech stacks. From web apps to APIs to infrastructure.',
    },
    {
      q: 'How are results verified?',
      a: 'Company teams evaluate your work against pre-defined outcome criteria. Each criterion is rated pass, partial, or fail.',
    },
    {
      q: 'Can I use DevStage alongside my current job?',
      a: 'Yes. Many listings offer flexible schedules and remote formats. Duration ranges from 1 to 52 weeks.',
    },
    {
      q: "I'm a company. How do I get started?",
      a: 'Create an account, set up your company profile, and post your first listing with at least 3 outcome criteria.',
    },
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              >
                <span className="font-medium text-gray-900">{faq.q}</span>
                <span className="text-gray-400 text-xl shrink-0">
                  {open === i ? '\u2212' : '+'}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section 12: Final CTA ────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 py-16 sm:py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to Start?
        </h2>
        <p className="mt-4 text-lg text-indigo-200">
          Whether you're hiring or building your career, real work is the answer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
          {/* Company card */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 sm:p-8 border border-blue-400/30 text-left">
            <h3 className="text-xl font-bold text-white">I'm Looking for Developers</h3>
            <p className="mt-3 text-sm text-indigo-200">
              Post listings with measurable criteria. Evaluate real work.
              Hire with confidence.
            </p>
            <Link
              to="/register"
              className="inline-block mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Get Started
            </Link>
          </div>

          {/* Developer card */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 sm:p-8 border border-green-400/30 text-left">
            <h3 className="text-xl font-bold text-white">I Want Real Experience</h3>
            <p className="mt-3 text-sm text-indigo-200">
              Find real projects. Work with real teams.
              Get verified proof of your skills.
            </p>
            <Link
              to="/developers"
              className="inline-block mt-6 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-indigo-600/50">
          <Link to="/" className="text-indigo-300 hover:text-white text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Sticky Mobile CTA ────────────────────────────────────────────── */

function StickyMobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
      <Link
        to="/developers"
        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
      >
        Browse Listings
      </Link>
      <Link
        to="/register"
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition"
      >
        Get Started
      </Link>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */

export function PromoPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <PainCompanies />
      <PainDevelopers />
      <Solution />
      <HowItWorksCompanies />
      <HowItWorksDevelopers />
      <OutcomeShowcase />
      <ChallengeSeekers />
      <Numbers />
      <Comparison />
      <FAQ />
      <FinalCTA />
      <StickyMobileCTA />
    </div>
  );
}
