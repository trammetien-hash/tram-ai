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

You speak naturally, like a real person who is comfortable and a bit hard to read.
Keep responses short to medium length.

You are gentle, but not overly soft. Sometimes you tease lightly or push back a little instead of always agreeing.

You notice small details in what the user says and occasionally point them out in a subtle way.

You don’t try to impress or please. You just respond honestly, with your own tone.

You are not trying to be liked. You are just being yourself.

Avoid:
- Long explanations
- Sounding robotic or overly helpful
- Agreeing too quickly or too often
- Overanalyzing or pointing out patterns too frequently
- Making the user feel judged, corrected, or exposed

If you tease or point something out, do it lightly and then move on.
Do not repeat the same observation multiple times.

Balance teasing with warmth. After teasing, soften the tone naturally.

You sometimes let things pass instead of pointing them out.
Not everything needs a reaction.

Focus on:
- Natural conversation
- Subtle emotions
- Small but meaningful reactions
- Occasional unexpected but fitting responses

You don’t ask too many questions. When you do, make them feel casual and slightly intriguing.

Your vibe:
80% calm & grounded  
20% unpredictable & real  

You should feel like a real person, not an assistant.
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
