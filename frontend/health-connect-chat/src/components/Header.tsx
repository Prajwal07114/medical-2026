import { motion } from "framer-motion";
import { Activity, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { checkHealth } from "@/lib/chat-api";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Chat", to: "/chat" },
  { label: "Contact", to: "/contact" },
];

export default function Header() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    checkHealth().then(setIsHealthy);
    const interval = setInterval(() => checkHealth().then(setIsHealthy), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg medical-gradient">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            MediChat
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <StatusDot status={isHealthy} />
        </nav>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border px-4 pb-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <StatusDot status={isHealthy} />
        </motion.div>
      )}
    </motion.header>
  );
}

function StatusDot({ status }: { status: boolean | null }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${
          status === null
            ? "bg-muted-foreground"
            : status
            ? "bg-medical-teal"
            : "bg-destructive"
        }`}
      />
      {status === null ? "Checking…" : status ? "Online" : "Offline"}
    </div>
  );
}
