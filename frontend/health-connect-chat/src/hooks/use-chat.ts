import { useState, useRef, useCallback } from "react";
import { ChatMessage, askStream } from "@/lib/chat-api";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Hello! I'm your medical assistant. I can help answer health-related questions, explain medical terms, and provide general health information.\n\n**Please note:** I provide general information only and am not a substitute for professional medical advice.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const botId = (Date.now() + 1).toString();
    const botMsg: ChatMessage = {
      id: botId,
      role: "bot",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsLoading(true);
    abortRef.current = false;

    await askStream(
      content.trim(),
      (chunk) => {
        if (abortRef.current) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, isStreaming: false } : m
          )
        );
        setIsLoading(false);
      },
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  content:
                    "I'm sorry, I couldn't process your request. Please check that the medical service is running and try again.",
                  isStreaming: false,
                }
              : m
          )
        );
        setIsLoading(false);
        console.error("Chat error:", err);
      }
    );
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "bot",
        content: "Conversation cleared. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
