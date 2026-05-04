let chatHistory = [];

export function addMessage(role, content) {
  chatHistory.push({ role, content });

  if (chatHistory.length > 30) {
    chatHistory = chatHistory.slice(-30);
  }
}

export function getHistory() {
  return chatHistory;
}

export function clearHistory() {
  chatHistory = [];
}
