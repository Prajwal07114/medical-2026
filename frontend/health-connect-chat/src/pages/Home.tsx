import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  Activity,
  MessageCircle,
  ShieldCheck,
  Clock,
  Stethoscope,
  Heart,
  Brain,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: <MessageCircle className="h-6 w-6 text-primary" />,
    title: "Instant Medical Q&A",
    description: "Get answers to health questions in real-time with AI-powered streaming responses.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-medical-teal" />,
    title: "Private & Secure",
    description: "Your conversations are confidential. We prioritize your data privacy.",
  },
  {
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: "Available 24/7",
    description: "Access medical information anytime, anywhere — no waiting rooms.",
  },
  {
    icon: <Brain className="h-6 w-6 text-medical-teal" />,
    title: "Evidence-Based",
    description: "Responses grounded in medical literature and clinical guidelines.",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 medical-gradient-subtle" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl medical-gradient elevated-shadow">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your Trusted{" "}
              <span className="bg-gradient-to-r from-primary to-medical-teal bg-clip-text text-transparent">
                Medical Assistant
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Get instant, reliable answers to your health questions. Powered by
              advanced AI trained on medical knowledge.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-xl medical-gradient px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 elevated-shadow"
              >
                Start a Consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-6 chat-shadow transition-all hover:elevated-shadow"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Stethoscope className="h-5 w-5 text-primary" />
            <Heart className="h-5 w-5 text-medical-teal" />
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Our AI medical assistant is here to help. Ask your first question today.
          </p>
          <Link
            to="/chat"
            className="mt-6 inline-flex items-center gap-2 rounded-xl medical-gradient px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Open MediChat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediChat. For informational purposes only — not a substitute for professional medical advice.
      </footer>
    </div>
  );
}
