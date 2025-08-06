import { useContextData } from "../hooks/useContext";

export function useConversation() {
  const { setActiveContext } = useContextData();

  async function* sendConversationMessage(character, message, token, signal) {
    let res;
    try {
      res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ character, message }),
        signal
      });
    } catch (networkError) {
      yield { done: false, error: "Network error. Please try again." };
      yield { done: true };
      return;
    }

    if (!res.ok) {
      let errMsg = `Error ${res.status}`;
      try {
        const errData = await res.json();
        errMsg = errData.error || errData.message || errMsg;
      } catch {}
      yield { done: false, error: errMsg };
      yield { done: true };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isFirst = true;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (isFirst && data.context) {
            setActiveContext(data.context);
            isFirst = false;
          }
          if (data.error) {
            yield { done: false, error: data.error };
          } else {
            yield { chunk: data.response, done: false };
          }
        } catch {
          // Non-JSON chunk, treat as text
          yield { chunk: line, done: false };
        }
      }
    }

    yield { done: true };
  }

  return { sendConversationMessage };
}
