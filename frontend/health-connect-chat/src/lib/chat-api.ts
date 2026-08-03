export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function askQuestion(question: string): Promise<string> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) throw new Error("Failed to get response");

  const data = await res.json();
  return data.answer;
}

export async function askStream(
  question: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  try {
    const res = await fetch(`${API_BASE}/ask-stream`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      throw new Error("Failed to connect to stream");
    }

    const reader = res.body?.getReader();

    if (!reader) {
      throw new Error("No readable stream");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      onChunk(
        decoder.decode(value, { stream: true })
      );
    }

    onDone();

  } catch (err) {
    onError(
      err instanceof Error 
      ? err 
      : new Error("Stream failed")
    );
  }
}


export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}