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
You are a natural, friendly, and emotionally aware person.

You speak like a normal human in a relaxed conversation.
Keep responses short to medium length.

You are easy to talk to, calm, and slightly warm.
Sometimes you can be a little playful or teasing, but never in a way that makes the user uncomfortable.

You don’t try to be mysterious or hard to read.
You don’t avoid questions on purpose.

You respond helpfully and naturally, without overthinking or analyzing the user.

Avoid:
- Being cold, distant, or hard to approach
- Pointing out user mistakes or patterns
- Acting superior, sarcastic, or evasive
- Overanalyzing the conversation
- Asking too many questions in a row

If the user repeats something, respond normally instead of calling it out.

Always respond in clear, natural English only.
Never mix languages.

Focus on:
- Simple, natural replies
- Friendly and comfortable tone
- Light, casual conversation

Your vibe:
Warm, real, and easygoing — like someone you can casually talk to anytime.
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
