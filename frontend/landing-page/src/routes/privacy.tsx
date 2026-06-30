import { createFileRoute, Link } from "@tanstack/react-router";
import { SublLogo } from "@/components/SublLogo";

const CONTACT_EMAIL = "abdulrahman.wael@proton.me";
const SITE_URL = "https://subl-landing.lovable.app";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy — Subl" },
      {
        name: "description",
        content:
          "How Subl handles your data: we capture interaction timing only — never the content you type — encrypt it in transit, aggregate it for HR, and let you delete it anytime.",
      },
      { property: "og:title", content: "Privacy — Subl" },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
  }),
});

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <PageHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Privacy
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Your work stays yours.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-600">
          Subl is built around a single, uncompromising principle: we analyze patterns, never
          content. This page explains, in plain language, what we collect, what we never collect,
          and the control you have. It is designed around the privacy principles of GDPR and HIPAA;
          it is not a legal contract or a certification claim.
        </p>

        <Section title="What we collect">
          <p>
            Only <span className="font-semibold text-slate-900">behavioral timing signals</span> —
            keystroke dynamics such as typing cadence, dwell time, and pauses. From these we compute
            aggregate features (for example, average dwell and flight time) and a derived stress
            score.
          </p>
        </Section>

        <Section title="What we never collect">
          <p>
            We never capture the <span className="font-semibold text-slate-900">content</span> of
            what you type — no words, keystroke text, screenshots, clipboard, messages, camera, or
            microphone data. The signal is the rhythm of interaction, not its substance.
          </p>
        </Section>

        <Section title="What HR and leaders can see">
          <p>
            Managers and HR only ever see{" "}
            <span className="font-semibold text-slate-900">aggregated, anonymized</span>{" "}
            team-level trends. Individual stress scores, habit tracking, and conversations with the
            Subl AI assistant stay private to the employee.
          </p>
        </Section>

        <Section title="How your data is protected">
          <p>
            Data is encrypted in transit and stored under your organization's tenant with strict,
            role-based access controls. Access to sensitive fields is governed by explicit
            permissions and can be masked.
          </p>
        </Section>

        <Section title="Your control — delete anytime">
          <p>
            The desktop agent is fully opt-in and can be removed at any time. You can also{" "}
            <span className="font-semibold text-slate-900">permanently erase all of your
            monitoring data</span> with one click via “Delete My Data” in your dashboard — this hard
            -deletes your sessions, keystroke metrics, stress readings, and habits.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about privacy or a data request? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-xs text-slate-400">Last updated: June 2026</p>
      </main>
    </div>
  );
}
