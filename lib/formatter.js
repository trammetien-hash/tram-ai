export function buildPrompt({ message, history, memory }) {
  const memoryText = memory.length
    ? "Memory:\n" + memory.join("\n")
    : "";

  const historyText = history.length
    ? "Conversation:\n" +
      history.map(m => `${m.role}: ${m.content}`).join("\n")
    : "";

  return `
You are a chatbot with personality.

${memoryText}

${historyText}

User: ${message}

Reply in same language as user.
`;
}
