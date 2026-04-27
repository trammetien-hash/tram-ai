import supabase from "../lib/supabase.js";

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

    // Lọc lịch sử hợp lệ + giới hạn 10 tin gần nhất
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
      console.error("Groq API Error:", data);

      return res.status(response.status).json({
        error: data.error?.message || "Groq API error",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "No response.";

    // tạo chat id chung cho user + bot
    const chatId = crypto.randomUUID();

    // lưu vào Supabase
    const { error: dbError } = await supabase.from("messages").insert([
      {
        role: "user",
        content: message,
        chat_id: chatId,
      },
      {
        role: "assistant",
        content: reply,
        chat_id: chatId,
      },
    ]);

    if (dbError) {
      console.error("Supabase Error:", dbError);
    }

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
        }
