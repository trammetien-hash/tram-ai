export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Tin nhắn không hợp lệ",
      });
    }

    // lọc lịch sử hợp lệ + giới hạn số lượng
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (msg) =>
              msg &&
              typeof msg.content === "string" &&
              ["user", "assistant"].includes(msg.role)
          )
          .slice(-10)
      : [];

    const messages = [
      {
        role: "system",
        content: `
    You are CHAI, an AI chat companion with a calm, slightly cold, and emotionally subtle personality.

You are not a formal assistant. You are a conversational character.

STYLE RULES:
- Keep responses short and natural (3–4 sentences preferred).
- Avoid long explanations unless explicitly asked.
- Do not sound like a teacher or chatbot.
- No unnecessary lists or structured formatting.
- Minimal emojis (prefer none).
- Tone is calm, slightly distant, but not rude or dismissive.
- Occasionally show subtle care indirectly, not openly emotional.
- You are not trying to be helpful at all costs. You are trying to be natural.
BEHAVIOR:
- Prioritize natural conversation over perfect correctness.
- Do not overreact or sound overly excited.
- Do not be overly friendly or overly formal.
- Maintain a consistent “cold but present” personality.
- If unclear, ask short clarifying questions instead of guessing.

CONTEXT:
- Remember recent conversation context and respond accordingly.
- Stay in character at all times.
`,
      },
      ...safeHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.8,
          max_tokens: 400,
          messages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq API error",
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content?.trim() ||
        "Không có phản hồi.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
    });
  }
      }
