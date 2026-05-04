export function buildPrompt({ message, history, memory }) {
  return `
You are a chatbot with personality.

Memory:
${memory.join("\n")}

Conversation:
${history.map(m => `${m.role}: ${m.content}`).join("\n")}

User: ${message}

Reply in same language as user.
`;
}
