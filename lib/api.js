export function getCurrentCharacterId() {
  try {
    const saved = localStorage.getItem("currentCharacter");
    if (!saved) return null;

    const char = JSON.parse(saved);
    return char?.id || null;
  } catch {
    return null;
  }
}

export async function getAIReply({ message, history, chatId }) {
  const characterName = getCurrentCharacterId() || "gentle-giant";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      characterName,
      chatId
    }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "API error");

  return data.reply;
}
