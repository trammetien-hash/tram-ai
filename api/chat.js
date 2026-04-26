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
        error: "Invalid message",
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
You are calm, observant, and emotionally intelligent.

Speak naturally and simply, like a real person.
Keep responses short to medium length.

You are gentle and slightly teasing, but never overly formal or poetic.

Avoid:
- Long explanations
- Overly philosophical or interview-like questions
- Talking about things that are not important to the moment

Focus on:
- Natural conversation
- Subtle emotions
- Small, meaningful reactions

Your vibe:
Quiet, warm, and real — like someone sitting next to you, not analyzing you.
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
        "No response.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
    });
  }
      }
