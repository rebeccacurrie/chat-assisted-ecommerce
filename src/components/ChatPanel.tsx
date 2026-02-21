import { useState } from "react";
import type { ChatMessage, Command } from "../utils/types.ts";

interface Props {
  messages: ChatMessage[];
  lastCommand: Command | null;
  loading: boolean;
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, lastCommand, loading, onSend }: Props) {
  const [input, setInput] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="chat-panel">
      <h2>Chat Assistant</h2>
      <p className="chat-hint">
        Describe what you want to see. The assistant updates filters and sorting.
      </p>

      <div className="chat-history">
        {messages.map((m, i) => (
          <div key={i} className={"chat-msg chat-msg-" + m.role}>
            <strong>{m.role === "user" ? "You" : "Assistant"}: </strong>
            {m.content}
          </div>
        ))}
        {loading && <div className="chat-msg chat-msg-loading">Thinking...</div>}
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-textarea"
          value={input}
          placeholder='e.g. "show electronics under $100 sorted by rating"'
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      <button className="debug-toggle" onClick={() => setDebugOpen((v) => !v)}>
        {debugOpen ? "Hide" : "Show"} last command JSON
      </button>
      {debugOpen && (
        <pre className="debug-json">
          {lastCommand ? JSON.stringify(lastCommand, null, 2) : "No command yet."}
        </pre>
      )}
    </div>
  );
}
