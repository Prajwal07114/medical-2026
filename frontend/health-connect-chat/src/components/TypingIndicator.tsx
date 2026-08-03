export default function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
        <div className="h-4 w-4 rounded-full medical-gradient" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-chat-bot px-4 py-3 chat-shadow">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
