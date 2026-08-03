import { useState, FormEvent } from "react";
import { Send, Trash2, Mic } from "lucide-react";

interface Props {
  onSend: (msg: string) => void;
  onClear: () => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, onClear, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-card px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask a medical question…"
            disabled={disabled}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-xl p-2.5 medical-gradient text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
