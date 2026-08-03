import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useChat } from "@/hooks/use-chat";
import Header from "@/components/Header";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import { Stethoscope, ShieldCheck, Clock } from "lucide-react";

export default function Index() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showWelcomeCards = messages.length <= 1;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
            {showWelcomeCards && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid gap-3 sm:grid-cols-3 mb-4"
              >
                <WelcomeCard
                  icon={<Stethoscope className="h-5 w-5 text-primary" />}
                  title="Medical Q&A"
                  description="Ask about symptoms, conditions, or treatments"
                />
                <WelcomeCard
                  icon={<ShieldCheck className="h-5 w-5 text-medical-teal" />}
                  title="Private & Secure"
                  description="Your conversations stay confidential"
                />
                <WelcomeCard
                  icon={<Clock className="h-5 w-5 text-primary" />}
                  title="Instant Answers"
                  description="Get real-time streaming responses"
                />
              </motion.div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && messages[messages.length - 1]?.content === "" && (
              <TypingIndicator />
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput
          onSend={sendMessage}
          onClear={clearMessages}
          disabled={isLoading}
        />
      </main>
    </div>
  );
}

function WelcomeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 chat-shadow transition-all hover:elevated-shadow">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
