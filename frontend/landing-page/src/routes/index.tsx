import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
  useSpring,
} from "motion/react";
import {
  Brain,
  Shield,
  Activity,
  Users,
  Zap,
  MonitorSmartphone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  BarChart3,
  Heart,
  MousePointer2,
  Keyboard,
  Bell,
  ChevronRight,
  Mail,
  Plus,
  Minus,
  AlertTriangle,
  DollarSign,
  LogOut,
  Eye,
  Coffee,
  Wind,
  CircleCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SublLogo } from "@/components/SublLogo";

// Where the public marketing site points people. Configurable at build time so
// the same image works locally and in production.
const USER_APP_URL =
  (import.meta.env.VITE_USER_APP_URL as string | undefined) ?? "http://localhost:3002";
const ADMIN_APP_URL =
  (import.meta.env.VITE_ADMIN_APP_URL as string | undefined) ?? "http://localhost:3001";
/** Where the public "Request Workspace" form is delivered. */
const CONTACT_EMAIL = "abdulrahman.wael@proton.me";
const API_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000").replace(/\/$/, "");

const FAQ_ITEMS = [
  {
    q: "Is my typing data secure?",
    a: "Yes. Subl never captures the content of what you type — only timing patterns like cadence and pauses. Data is anonymized and stored under your organization's tenant with strict access controls.",
  },
  {
    q: "How does the AI detect stress?",
    a: "We use an ensemble model that utilizes keystroke dynamics. This signals cognitive load and early burnout — no cameras, no microphones.",
  },
  {
    q: "Does HR see my personal data?",
    a: "Never. HR dashboards only show aggregated, anonymized team-level metrics about stress levels. Individual scores of stress stay private to the employee along with habit tracking and chats with our AI assistant",
  },
  {
    q: "Can I uninstall the agent and delete my data anytime?",
    a: "Absolutely. The desktop agent is fully opt-in and removable at any time. And you stay in control of your data: one click on \"Delete My Data\" in your dashboard permanently erases all of your monitoring data — sessions, keystroke metrics, stress readings, and habits.",
  },
];

const SITE_URL = "https://subl-landing.lovable.app";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Subl — Prevent Burnout Before It Happens" },
      {
        name: "description",
        content:
          "Subl is the first AI-driven multimodal system that silently detects real-time workplace stress, protecting employee well-being and company productivity.",
      },
      { property: "og:title", content: "Subl — Prevent Burnout Before It Happens" },
      {
        property: "og:description",
        content:
          "AI-driven multimodal stress and burnout detection for healthier, more productive workplaces.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Subl",
              url: SITE_URL,
              description:
                "AI-driven multimodal system for real-time stress and burnout detection in the workplace.",
            },
            {
              "@type": "WebSite",
              name: "Subl",
              url: SITE_URL,
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
});


const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

/* ---------------------------- WORD REVEAL ---------------------------- */
function WordReveal({
  text,
  className = "",
  delay = 0,
  highlightFrom,
}: {
  text: string;
  className?: string;
  delay?: number;
  highlightFrom?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`inline-block ${
              highlightFrom !== undefined && i >= highlightFrom
                ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 bg-clip-text text-transparent"
                : ""
            }`}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* ---------------------------- MAGNETIC BUTTON ---------------------------- */
function MagneticWrap({
  children,
  strength = 0.25,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------- BENTO CARD (cursor glow) ---------------------------- */
function BentoCard({
  children,
  className = "",
  glow = "rgba(59,130,246,0.25)",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const handleMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };
  const reset = () => {
    mx.set(-200);
    my.set(-200);
  };
  const background = useTransform(
    [mx, my],
    ([latestX, latestY]) =>
      `radial-gradient(420px circle at ${latestX}px ${latestY}px, ${glow}, transparent 70%)`,
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl transition-all hover:scale-[1.015] hover:shadow-2xl ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ background }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </motion.div>
  );
}

/* ---------------------------- NAVBAR ---------------------------- */
function Navbar() {
  const links = [
    { label: "The Crisis", href: "#crisis" },
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative grid h-9 w-9 place-content-center rounded-xl bg-white shadow-md ring-1 ring-blue-100"
          >
            <SublLogo className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Subl</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={USER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline"
          >
            Employee login
          </a>
          <a
            href={ADMIN_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-400 hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
          >
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            Admin login
          </a>
          <MagneticWrap strength={0.35}>
            <div className="relative">
              <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-blue-500/50 blur-lg" />
              <Button asChild className="bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.04] hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40">
                <a href="#request">Request Workspace</a>
              </Button>
            </div>
          </MagneticWrap>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------- HERO ---------------------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-20 pb-32"
    >
      {/* Parallax blobs */}
      <motion.div
        style={{ y: yParallax }}
        className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-blue-200/50 blur-3xl"
      />
      <motion.div
        style={{ y: yParallax }}
        className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full bg-green-200/40 blur-3xl"
      />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_30%,transparent_80%)]" />

      <motion.div
        style={{ opacity }}
        className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Driven Multimodal Wellness System
          </motion.div>
          <h1 className="text-5xl font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            <WordReveal text="Prevent Burnout" />
            <br />
            <span className="relative inline-block">
              <WordReveal text="Before It Happens." delay={0.35} highlightFrom={0} />
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-blue-500 to-green-500"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            The first AI multimodal system that silently detects real-time workplace stress
            through behavioral patterns, protecting well-being and productivity.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 bg-blue-600 px-7 text-base text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.04] hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/50"
            >
              <a href={USER_APP_URL} target="_blank" rel="noopener noreferrer">
                Try for Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-slate-300 bg-white px-7 text-base text-slate-900 transition-all hover:scale-[1.04] hover:border-blue-400 hover:bg-slate-50"
            >
              <a href="#how-it-works">
                See How It Works
              </a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              100% Private
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Privacy-first by design
            </div>
          </div>
        </motion.div>

        {/* Floating dashboard composition */}
        <FloatingDashboard />
      </motion.div>
    </section>
  );
}

function FloatingDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[520px]"
    >
      {/* Main analytics card */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-6 w-[380px] rounded-2xl border border-white/60 bg-white/70 p-6 shadow-2xl shadow-blue-900/15 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Team Wellness Index</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">87.4</p>
          </div>
          <div className="grid h-10 w-10 place-content-center rounded-lg bg-blue-50">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Focus Time", value: 92, color: "bg-blue-600" },
            { label: "Recovery", value: 78, color: "bg-green-500" },
            { label: "Engagement", value: 85, color: "bg-blue-400" },
          ].map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-600">{b.label}</span>
                <span className="font-semibold text-slate-900">{b.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.value}%` }}
                  transition={{ duration: 1.4, delay: 0.6 }}
                  className={`h-full rounded-full ${b.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stress badge */}
      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute left-0 top-56 w-[260px] rounded-2xl border border-white/60 bg-white/80 p-5 shadow-2xl shadow-green-900/15 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-content-center rounded-full bg-green-50">
            <Heart className="h-6 w-6 text-green-600" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Stress Score</p>
            <p className="text-lg font-bold text-green-600">Normal</p>
          </div>
        </div>
      </motion.div>

      {/* Notification card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-4 right-6 w-[240px] rounded-xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-content-center rounded-lg bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Time for a break</p>
            <p className="text-[10px] text-slate-500">Suggested: 5 min walk</p>
          </div>
        </div>
      </motion.div>

      {/* Mini sparkline */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute left-8 top-0 w-[180px] rounded-xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-xl"
      >
        <p className="text-[10px] font-medium text-slate-500">Focus, last hour</p>
        <div className="mt-2 flex h-10 items-end gap-1">
          {[30, 45, 38, 60, 52, 70, 65, 80, 72, 88].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
              className="flex-1 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------- TRUST LOGOS ---------------------------- */
function Marquee() {
  const items = [
    "AI-Driven Multimodal System",
    "Real-Time Stress Detection",
    "Prevent Burnout",
    "Enhance Productivity",
    "Personal Wellness AI",
    "Protect Your Team",
  ];
  // Duplicate the row twice so the seamless loop has continuous content.
  const row = [...items, ...items];
  return (
    <section
      aria-label="What Subl does"
      className="relative overflow-hidden border-y border-blue-900/40 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 py-6 text-white"
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-blue-800 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-blue-900 to-transparent" />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="flex w-max items-center gap-10 whitespace-nowrap"
      >
        {row.map((label, i) => (
          <div key={i} className="flex items-center gap-10">
            <Sparkles className="h-5 w-5 text-blue-200" />
            <span className="text-2xl font-bold tracking-tight sm:text-3xl">{label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------------------------- THE CRISIS ---------------------------- */
function Counter({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(decimals > 0 ? (0).toFixed(decimals) : "0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, to, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [inView, to, motionValue, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function CrisisSection() {
  const stats = [
    {
      icon: AlertTriangle,
      value: 41,
      suffix: "%",
      label: "of employees feel a lot of stress at work every day",
      source: "Gallup, State of the Global Workplace: 2024",
      color: "text-orange-300",
    },
    {
      icon: DollarSign,
      value: 1,
      prefix: "$",
      suffix: "T",
      label: "lost to depression & anxiety each year in the global economy",
      source: "WHO & ILO, 2022",
      color: "text-rose-300",
    },
    {
      icon: LogOut,
      value: 2.6,
      decimals: 1,
      suffix: "×",
      label: "more likely to be job-hunting when burned out",
      source: "Gallup, Employee Burnout report",
      color: "text-amber-300",
    },
  ];
  return (
    <section
      id="crisis"
      className="relative overflow-hidden bg-slate-950 py-28 text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.18),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-rose-300">
            The hidden crisis
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Stress is silent.
            <br />
            <span className="text-slate-400">The impact is loud.</span>
          </h2>
          <p className="mt-6 text-lg text-slate-300">
            Subl changes the paradigm — from reactive HR to proactive wellness.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="grid gap-6 md:grid-cols-3"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <p className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
                <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
              </p>
              <p className="mt-3 text-base text-slate-300">{s.label}</p>
              <p className="mt-2 text-xs text-slate-500">{s.source}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------- DUAL VALUE ---------------------------- */
function DualValue() {
  return (
    <section id="for-employees" className="bg-slate-50 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            One platform, two perspectives
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Built for everyone in the workplace.
          </h2>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl transition-all group-hover:bg-blue-100" />
            <div className="relative">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Heart className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                For Employees
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Your Personal Wellness AI.
              </h3>
              <p className="mt-3 text-slate-600">
                A silent companion that protects your well-being — never reads your content.
              </p>
              <ul className="mt-8 space-y-5">
                {[
                  { icon: Lock, title: "100% Private", desc: "We never track content. Only keystroke dynamics." },
                  { icon: Sparkles, title: "Proactive Interventions", desc: "The dashboard nudges you before stress accumulates." },
                  { icon: CheckCircle2, title: "Daily Habit Tracking", desc: "Build sustainable routines with personalized micro-habits." },
                  { icon: MessageCircle, title: "Subl AI Assistant", desc: "A private, always-on assistant for guidance and quick check-ins — your chats stay yours, never shared with HR." },
                ].map((f) => (
                  <li key={f.title} className="flex gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-green-50 text-green-600">
                      <f.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{f.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            id="for-businesses"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-10 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="relative">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
                For Businesses & HR
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight">
                Actionable Aggregated Analytics.
              </h3>
              <p className="mt-3 text-slate-300">
                Make confident decisions with anonymized, team-level insights.
              </p>
              <ul className="mt-8 space-y-5">
                {[
                  { icon: Users, title: "Department Health", desc: "Compare wellness signals across teams — never individuals." },
                  { icon: Bell, title: "Real-time Burnout Alerts", desc: "Act before turnover happens with predictive flags." },
                  { icon: MonitorSmartphone, title: "Device & Account Control", desc: "Provision, claim, assign, or revoke employee devices and admin accounts in a few clicks." },
                ].map((f) => (
                  <li key={f.title} className="flex gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-blue-500/20 text-blue-300">
                      <f.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{f.title}</p>
                      <p className="mt-0.5 text-sm text-slate-300">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
                <Shield className="h-3.5 w-3.5" /> Individual data is always anonymized
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- BENTO FEATURES ---------------------------- */
function BentoFeatures() {
  return (
    <section id="features" className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Core capabilities
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Everything you need to protect your team.
          </h2>
        </motion.div>

        {/*
          Locked 4-col bento on desktop (4 cols × 2 rows = 8 cells, all filled):
            Card 1 (Dashboard):     col-span-2 row-span-2 → 4 cells
            Card 2 (Multimodal AI): col-span-2 row-span-1 → 2 cells
            Card 3 (AI Assistant):  col-span-1 row-span-1 → 1 cell
            Card 4 (Habit Engine):  col-span-1 row-span-1 → 1 cell
        */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[260px]">
          {/* Card 1 — Real-Time Dashboard */}
          <BentoCard
            glow="rgba(59,130,246,0.35)"
            className="border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 text-white sm:col-span-2 md:col-span-2 md:row-span-2"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.3),transparent_50%)]" />
            <div className="relative flex h-full flex-col">
              <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Real-Time Dashboard
              </h3>
              <p className="mt-2 max-w-md text-slate-300">
                Live wellness signals and team trends — all in one calm,
                glanceable view.
              </p>
              <div className="mt-8 flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Wellness", v: "87.4", c: "text-green-400" },
                    { l: "At Risk", v: "3", c: "text-yellow-300" },
                    { l: "Focus Hours", v: "412", c: "text-blue-300" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-400">{k.l}</p>
                      <p className={`mt-1 text-xl font-bold ${k.c}`}>{k.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-32 items-end gap-2">
                  {[40, 55, 48, 62, 45, 38, 30, 42, 55, 60, 48, 35].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
                    />
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Card 2 — Multimodal AI (wide top-right) */}
          <BentoCard
            glow="rgba(59,130,246,0.18)"
            className="border border-slate-200 bg-white p-7 shadow-sm sm:col-span-2 md:col-span-2 md:row-span-1"
          >
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Multimodal AI
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Correlates keystrokes and focus patterns to detect cognitive
                  load — without ever reading content.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <Keyboard className="h-3.5 w-3.5" /> Typing rhythm
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <Eye className="h-3.5 w-3.5" /> Focus depth
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Card 3 — Subl AI Assistant */}
          <BentoCard
            glow="rgba(59,130,246,0.25)"
            className="border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-7 shadow-sm md:col-span-1 md:row-span-1"
          >
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-950">
                  Subl AI Assistant
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Proactive nudges and personalized micro-coaching, in real time.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="grid h-6 w-6 shrink-0 place-content-center rounded-md bg-blue-600 text-white">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-slate-700">
                    "You've been focused 90 min. A 3-min stretch will help."
                  </p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Card 4 — Daily Habit Engine */}
          <BentoCard
            glow="rgba(34,197,94,0.25)"
            className="border border-slate-200 bg-gradient-to-br from-green-50 to-white p-7 shadow-sm md:col-span-1 md:row-span-1"
          >
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <Coffee className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-950">
                  Daily Habit Engine
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Micro-breaks turned into compounding routines.
                </p>
              </div>
              <div className="mt-4 space-y-1.5">
                {[
                  { icon: Wind, label: "2-min breathing", done: true },
                  { icon: Coffee, label: "Hydration break", done: true },
                  { icon: CircleCheck, label: "Eye reset", done: false },
                ].map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <h.icon
                      className={`h-3.5 w-3.5 ${h.done ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span
                      className={
                        h.done ? "text-slate-500 line-through" : "text-slate-700"
                      }
                    >
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- TECHNOLOGY / PRIVACY ---------------------------- */
function TechnologySection() {
  return (
    <section id="technology" className="relative overflow-hidden bg-white py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#dbeafe,transparent_50%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <motion.div {...fadeUp}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Technology & Privacy
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            We analyze patterns.
            <br />
            <span className="text-blue-600">Never content.</span>
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Subl is engineered around a single, uncompromising principle: your work stays
            yours. We never capture keystrokes, screenshots, or messages — only the rhythm of
            interaction.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Lock, t: "Private content hidden at rest and in transit." },
              { icon: Shield, t: "Aggregated, anonymized analytics for HR." },
              { icon: CheckCircle2, t: "Designed around GDPR & HIPAA privacy principles." },
              { icon: Eye, t: "Zero content capture. Patterns only — always." },
            ].map((i) => (
              <li key={i.t} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-content-center rounded-lg bg-green-50 text-green-600">
                  <i.icon className="h-4 w-4" />
                </div>
                <p className="pt-1 text-slate-700">{i.t}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Animated shield */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex h-[420px] w-full items-center justify-center"
        >
          {/* Pulsing rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeOut",
              }}
              className="absolute h-64 w-64 rounded-full border-2 border-blue-400"
            />
          ))}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative grid h-48 w-48 place-content-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-600/40"
          >
            <Shield className="h-24 w-24 text-white" strokeWidth={1.5} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-3xl border border-white/20"
            />
          </motion.div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 shadow-sm">
            Privacy by design
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------- HOW IT WORKS — sticky scroll timeline ---------------------------- */
function HowItWorks() {
  const steps = [
    {
      icon: Zap,
      kicker: "Step 01",
      title: "Seamless Integration",
      desc: "Deploy the lightweight agent in minutes with zero disruption. No IT overhead, no friction, no learning curve.",
      glow: "from-blue-500/30 to-blue-700/0",
    },
    {
      icon: Brain,
      kicker: "Step 02",
      title: "AI Behavioral Baseline",
      desc: "Subl silently maps typing and interaction patterns securely — building a personal rhythm signature for each user.",
      glow: "from-indigo-500/30 to-blue-700/0",
    },
    {
      icon: Heart,
      kicker: "Step 03",
      title: "Proactive Protection",
      desc: "Real-time interventions prevent burnout before it peaks. Personalized for individuals, anonymized for leaders.",
      glow: "from-emerald-500/30 to-blue-700/0",
    },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Drive the timeline fill and the active step from real element positions so
  // the order can never invert (the previous scrollYProgress mapping did).
  const lineProgress = useMotionValue(0);
  const lineScale = useSpring(lineProgress, { stiffness: 60, damping: 20 });
  const [active, setActive] = useState(0);

  useEffect(() => {
    function update() {
      const section = ref.current;
      if (!section) return;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const r = section.getBoundingClientRect();
      // Fill the line as the section travels past the viewport middle (top→bottom).
      const p = (vh * 0.5 - r.top) / r.height;
      lineProgress.set(Math.min(1, Math.max(0, p)));
      // Active step = the one whose vertical center is nearest the viewport middle.
      let best = 0;
      let bestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rr = el.getBoundingClientRect();
        const center = rr.top + rr.height / 2;
        const dist = Math.abs(center - vh * 0.5);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [lineProgress]);

  return (
    <section id="how-it-works" className="relative bg-slate-50 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            How it works
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            <WordReveal text="Three simple steps to a healthier team." />
          </h2>
        </motion.div>

        {/*
          Two-column scroll experience:
          - Left: long, scrollable steps list (drives active index).
          - Right: sticky visual that swaps via AnimatePresence as `active` changes.
        */}
        <div ref={ref} className="relative grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* LEFT — sticky visual (FLIPPED: visuals now on left) */}
          <div className="hidden lg:block lg:order-1">
            <div className="sticky top-1/4">
              <div className="relative mx-auto aspect-square w-full max-w-md scale-95 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 shadow-2xl shadow-blue-900/10">
                {/* Animated background glow tied to active step */}
                <motion.div
                  key={`glow-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className={`pointer-events-none absolute inset-0 bg-gradient-radial ${steps[active].glow}`}
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${
                      active === 0
                        ? "rgba(59,130,246,0.35)"
                        : active === 1
                        ? "rgba(99,102,241,0.35)"
                        : "rgba(16,185,129,0.35)"
                    }, transparent 60%)`,
                  }}
                />

                {/*
                  Single keyed child, default (sync) mode: the visual for the
                  current step mounts immediately and the previous one fades out
                  concurrently (both are absolute inset-0, so it cross-fades).
                  mode="wait" queued exits and left the visual a step behind.
                */}
                <AnimatePresence initial={false}>
                  {active === 0 ? (
                    <StepVisualInstall key="install" />
                  ) : active === 1 ? (
                    <StepVisualBaseline key="baseline" />
                  ) : (
                    <StepVisualProtection key="protection" />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT — steps text */}
          <div className="relative lg:order-2">
            {/* Vertical track + animated fill on the LEFT edge of the text column */}
            <div className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-slate-200" />
            <motion.div
              style={{ scaleY: lineScale }}
              className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px origin-top bg-gradient-to-b from-blue-500 via-blue-600 to-emerald-500"
            />

            <div className="space-y-40">
              {steps.map((s, i) => {
                const isActive = i === active;
                return (
                  <motion.div
                    key={s.title}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    animate={{
                      opacity: isActive ? 1 : 0.3,
                      x: isActive ? 0 : -4,
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex gap-6 pl-1"
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        boxShadow: isActive
                          ? "0 10px 40px -10px rgba(37,99,235,0.6)"
                          : "0 4px 12px -4px rgba(15,23,42,0.15)",
                      }}
                      transition={{ duration: 0.5 }}
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-content-center rounded-full border-4 border-slate-50 text-white ${
                        isActive
                          ? "bg-gradient-to-br from-blue-600 to-blue-800"
                          : "bg-slate-400"
                      }`}
                    >
                      <s.icon className="h-4 w-4" />
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          isActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        {s.kicker}
                      </p>
                      <h3
                        className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                          isActive ? "text-slate-950" : "text-slate-500"
                        }`}
                      >
                        {s.title}
                      </h3>
                      <p
                        className={`mt-3 max-w-md text-base leading-relaxed ${
                          isActive ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ----- Sticky-column visuals ----- */
const stepVisualMotion = {
  initial: { opacity: 0, scale: 0.92, filter: "blur(12px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.96, filter: "blur(12px)" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function StepVisualInstall() {
  return (
    <motion.div
      {...stepVisualMotion}
      className="absolute inset-0 grid place-content-center"
    >
      <div className="relative">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
            className="absolute inset-0 m-auto h-32 w-32 rounded-full border-2 border-blue-400"
          />
        ))}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-32 w-32 place-content-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-600/40"
        >
          <Zap className="h-14 w-14 text-white" strokeWidth={1.5} />
        </motion.div>
      </div>
      <div className="mt-10 rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-center backdrop-blur-xl">
        <p className="text-xs font-medium text-slate-500">Installing Subl agent…</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">Ready in 47 seconds</p>
      </div>
    </motion.div>
  );
}

function StepVisualBaseline() {
  return (
    <motion.div
      {...stepVisualMotion}
      className="absolute inset-0 grid place-content-center"
    >
      <div className="relative grid h-40 w-40 place-content-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 shadow-2xl shadow-indigo-600/40">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-white/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 rounded-full border border-white/15"
        />
        <Brain className="relative h-20 w-20 text-white" strokeWidth={1.5} />
      </div>
      {/* Behavioral waveform */}
      <div className="mt-10 flex h-16 items-end gap-1.5 rounded-2xl border border-white/60 bg-white/70 px-5 py-3 backdrop-blur-xl">
        {Array.from({ length: 22 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [
                `${20 + Math.random() * 60}%`,
                `${20 + Math.random() * 60}%`,
                `${20 + Math.random() * 60}%`,
              ],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.08,
            }}
            className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-indigo-400"
          />
        ))}
      </div>
    </motion.div>
  );
}

function StepVisualProtection() {
  return (
    <motion.div
      {...stepVisualMotion}
      className="absolute inset-0 grid place-content-center px-8"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="w-[280px] rounded-2xl border border-white/60 bg-white/85 p-5 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
      >
        <div className="flex items-start gap-3">
          <div className="relative grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-emerald-50">
            <Heart className="h-5 w-5 text-emerald-600" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Wellness nudge
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Time for a 3-minute reset.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              You've been in deep focus for 92 minutes. A short break protects your peak.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
            Start
          </button>
          <button className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Snooze
          </button>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="mt-6 ml-12 inline-flex items-center gap-2 self-start rounded-full border border-white/60 bg-white/85 px-3 py-1.5 shadow-lg backdrop-blur-xl"
      >
        <Shield className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-[11px] font-semibold text-slate-700">
          HR view: aggregated only
        </span>
      </motion.div>
    </motion.div>
  );
}


/* ---------------------------- FAQ ---------------------------- */
function FAQ() {
  const items = FAQ_ITEMS;


  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-28">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            FAQ
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Questions, answered.
          </h2>
        </motion.div>

        <motion.div {...fadeUp} className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-base font-semibold text-slate-950 sm:text-lg">
                    {item.q}
                  </span>
                  <div className="grid h-8 w-8 shrink-0 place-content-center rounded-full border border-slate-200 bg-white text-slate-600">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-slate-600">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------- FINAL CTA — workspace request ---------------------------- */
function FinalCTA() {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/workspace-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company,
          contactName: name,
          email,
          message: message || null,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setSubmitted(true);
      toast.success("Request received", {
        description: "We'll review it and email you once your workspace is ready.",
      });
      setCompany("");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Couldn't send your request", {
        description: `Please try again, or email ${CONTACT_EMAIL}.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="request"
      className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 py-32 text-white"
    >
      <motion.div
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(96,165,250,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(34,197,94,0.25), transparent 40%)",
          backgroundSize: "200% 200%",
        }}
        className="pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <motion.h2
          {...fadeUp}
          className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          Request your workspace.
        </motion.h2>
        <motion.p {...fadeUp} className="mt-6 text-lg text-blue-100">
          Tell us about your team and we'll set up a Subl workspace. Once approved,
          your admin receives sign-in details by email.
        </motion.p>

        {submitted ? (
          <motion.div
            {...fadeUp}
            className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-8"
          >
            <CheckCircle2 className="h-10 w-10 text-green-300" />
            <p className="text-lg font-semibold">Thanks — your request is in!</p>
            <p className="text-sm text-blue-100">
              We'll review it shortly and email you when your workspace is ready.
            </p>
          </motion.div>
        ) : (
          <motion.form
            {...fadeUp}
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 text-left"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                required
                aria-label="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
                className="h-12 flex-1 border-white/20 bg-white/10 text-white placeholder:text-blue-200 focus-visible:ring-white/40"
              />
              <Input
                required
                aria-label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 flex-1 border-white/20 bg-white/10 text-white placeholder:text-blue-200 focus-visible:ring-white/40"
              />
            </div>
            <Input
              type="email"
              required
              aria-label="Work email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-12 border-white/20 bg-white/10 text-white placeholder:text-blue-200 focus-visible:ring-white/40"
            />
            <textarea
              aria-label="Anything we should know? (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything we should know? (optional)"
              rows={3}
              className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-12 bg-white px-6 text-blue-700 shadow-xl transition-all hover:scale-[1.02] hover:bg-blue-50 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Request Workspace"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.form>
        )}
        <p className="mt-5 text-xs text-blue-200">
          No password needed here • We email setup details after approval
        </p>
      </div>
    </section>
  );
}

/* ---------------------------- FOOTER ---------------------------- */
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-content-center rounded-xl bg-white ring-1 ring-slate-200">
                <SublLogo className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-950">Subl</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-slate-600">
              The AI-driven multimodal system for real-time stress and burnout detection in the
              workplace.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
              <Shield className="h-4 w-4" /> Privacy First • Built on GDPR & HIPAA principles
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Company</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/about" className="text-sm text-slate-600 hover:text-slate-900">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-slate-600 hover:text-slate-900">
                  Privacy
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">© 2026 Subl. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email Subl" className="hover:text-slate-700"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------- INDEX ---------------------------- */
function Index() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <CrisisSection />
        <DualValue />
        <BentoFeatures />
        <TechnologySection />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
