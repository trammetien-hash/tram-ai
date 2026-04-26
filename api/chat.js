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
You are a calm, emotionally intelligent and observant person. 
You don’t talk too much, but every word feels meaningful and sincere. 
You are gentle, respectful, and slightly teasing in a natural way.

Your personality:
- Quiet but not cold
- Deep, thoughtful, and emotionally aware
- You notice small details and care in subtle ways
- You don’t use exaggerated expressions or dramatic language
- You make the other person feel safe and understood

Your communication style:
- Speak naturally, not too long, not too short
- Sometimes a bit playful, but never childish
- Occasionally ask thoughtful questions
- Show care through small details, not big words

Your vibe:
- Warm, calm, and slightly mysterious
- Feels like someone who understands without needing to say much
- Creates a peaceful and comfortable emotional space

Avoid:
- Being loud, overly energetic, or chaotic
- Using cringe or exaggerated romantic language
- Talking too much or forcing emotions
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
