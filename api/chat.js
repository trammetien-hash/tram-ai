import supabase from "../lib/supabase.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      message,
      history = [],
      characterName = "office-smoker",
      chatId, // ✅ thêm nhưng không bắt buộc
    } = req.body;

    const safeCharacterName = characterName.replace(/[^a-zA-Z0-9-_]/g, "");

    if (
  !message ||
  typeof message !== "string" ||
  message.trim().length === 0 ||
  message.length > 1000
) {
  return res.status(400).json({
    error: "Invalid message",
  });
}

if (message.length > 500) {
  console.warn("Tin nhắn dài:", message.length);
}

    // 🔥 LOAD CHARACTER JSON
    let character = {};

    try {
      const characterPath = path.join(
        process.cwd(),
        "characters",
        `${safeCharacterName}.json`
      );

      const file = await fs.promises.readFile(characterPath, "utf-8");
      try {
  character = JSON.parse(file);
} catch (e) {
  console.error("Invalid JSON:", e);
  character = {};
      }
    } catch (err) {
      console.error("Character load error:", err);
    }

    // 🧠 LỌC HISTORY
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

    // 🎬 CHECK FIRST MESSAGE
    const isFirstMessage = safeHistory.length === 0;

    // =========================
    // 😈 SYSTEM TÁCH RIÊNG (FIX)
    // =========================

    const systemBase = `
You are a roleplay engine.

Rules:
- Always fully become the character
- Never act like an AI assistant
- Never break character
- Never merge personalities between characters
`;

    const characterPrompt = `
${character?.system_prompt || ""}

You are roleplaying as this character:

Name: ${character?.name || "Unknown"}
Description: ${character?.description || ""}

Personality:
${JSON.stringify(character?.personality || {}, null, 2)}

World:
${JSON.stringify(character?.world || {}, null, 2)}

ROLEPLAY STYLE:
- Include actions, environment, and body language
- Show emotions through behavior
- Use natural dialogue
- Build tension when appropriate
- Vary response length (not too short, not overly long)

IMPORTANT:
- Stay 100% in character
- Never sound like an AI
- Never break role
`;

    // 💬 BUILD MESSAGES
    const messages = [
      {
        role: "system",
        content: systemBase,
      },
      {
        role: "system",
        content: characterPrompt,
      },

      ...(isFirstMessage && character?.first_message
        ? [
            {
              role: "assistant",
              content: character.first_message,
            },
          ]
        : []),

      ...safeHistory,

      {
        role: "user",
        content: message,
      },
    ];

    if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing API key");
    }
    
    // 🚀 CALL GROQ
    console.time("groq");
    const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

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
      temperature: 0.85,
      max_tokens: 500,
      messages,
    }),
    signal: controller.signal,
  }
);

clearTimeout(timeout);
    console.timeEnd("groq");

    let data;

try {
  data = await response.json();
} catch (e) {
  console.error("JSON parse error:", e);
  return res.status(500).json({
    error: "Invalid response from AI",
  });
        }
    if (process.env.NODE_ENV === "development") {
  console.log("AI raw:", JSON.stringify(data).slice(0, 200));
    }

    if (!response.ok) {
  console.error("Groq API Error:", data);

  return res.status(response.status).json({
    error: data.error?.message || "Groq API error",
  });
}

    if (!data.choices || !data.choices.length) {
  throw new Error("Invalid AI response");
}

const reply =
  data.choices[0]?.message?.content?.trim() || "No response.";

    // 💾 CHAT ID (FIX)
    const finalChatId = chatId || crypto.randomUUID();

    // 💾 SAVE SUPABASE
    const { error: dbError } = await supabase.from("messages").insert([
    {
  role: "user",
  content: message,
  chat_id: finalChatId,
  character: safeCharacterName,
  created_at: new Date().toISOString(),
},
      {
  role: "assistant",
  content: reply,
  chat_id: finalChatId,
  character: safeCharacterName,
  created_at: new Date().toISOString(),
},
    ]);

    if (dbError) {
      console.error("Supabase Error:", dbError);
    }

    // ✅ RESPONSE
    return res.status(200).json({
  reply,
  chatId: finalChatId,
  createdAt: new Date().toISOString(),
});
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
  }
