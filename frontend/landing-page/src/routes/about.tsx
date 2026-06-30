import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Heart, Brain, Lock } from "lucide-react";
import { SublLogo } from "@/components/SublLogo";

const CONTACT_EMAIL = "abdulrahman.wael@proton.me";
const SITE_URL = "https://subl-landing.lovable.app";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Subl" },
      {
        name: "description",
        content:
          "Subl is an AI-driven wellness system that detects workplace stress from behavioral patterns — never content — to prevent burnout before it happens.",
      },
      { property: "og:title", content: "About — Subl" },
      { property: "og:url", content: `${SITE_URL}/about` },
    ],
  }),
});

/** Lightweight header used on the static content pages. */
function PageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-content-center rounded-xl bg-white shadow-md ring-1 ring-blue-100">
            <SublLogo className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Subl</span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          ← Back to home
        </Link>
      </div>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
        <p>© 2026 Subl. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-900">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

function AboutPage() {
  const values = [
    {
      icon: Lock,
      title: "Privacy is the product",
      desc: "We analyze the rhythm of interaction — typing cadence and pauses — never the content of what you type. No screenshots, no messages, no cameras, no microphones.",
    },
    {
      icon: Brain,
      title: "Behavioral, not invasive",
      desc: "An ensemble model turns keystroke dynamics into an early signal of cognitive load, so support can arrive before stress becomes burnout.",
    },
    {
      icon: Heart,
      title: "For the person first",
      desc: "Individual stress scores, habits, and AI chats stay private to the employee. Leaders only ever see aggregated, anonymized team-level trends.",
    },
    {
      icon: Shield,
      title: "You stay in control",
      desc: "The desktop agent is opt-in and removable anytime, and one click in your dashboard permanently erases all of your monitoring data.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <PageHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
          About Subl
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Prevent burnout before it happens.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          Subl is an AI-driven wellness system that detects real-time workplace stress from
          behavioral patterns — silently, and without ever reading your content. Our goal is to
          shift organizations from reactive HR to proactive wellbeing: protecting people and the
          productivity that follows when people feel well.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <v.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{v.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            How it works, in three steps
          </h2>
          <ol className="mt-4 space-y-3 text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">1. Seamless integration.</span>{" "}
              A lightweight desktop agent deploys in minutes.
            </li>
            <li>
              <span className="font-semibold text-slate-900">2. Behavioral baseline.</span>{" "}
              Subl learns each person's typing rhythm — the signature of focus and strain.
            </li>
            <li>
              <span className="font-semibold text-slate-900">3. Proactive protection.</span>{" "}
              Timely, private nudges help individuals recover before stress peaks.
            </li>
          </ol>
        </div>

        <p className="mt-12 text-slate-600">
          Questions or partnership inquiries? Reach us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>
      <PageFooter />
    </div>
  );
}
