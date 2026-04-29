import supabase from "../lib/supabase.js";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, history = [], characterName = "office-smoker" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid message",
      });
    }

    // 🔥 LOAD CHARACTER JSON
    let character = null;

    try {
      const characterPath = path.join(
        process.cwd(),
        "characters",
        `${characterName}.json`
      );

      const file = fs.readFileSync(characterPath, "utf-8");
      character = JSON.parse(file);
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

    // 😈 SYSTEM PROMPT (UPGRADE)
    const systemPrompt = `
${character?.system_prompt || ""}

You are roleplaying as this character:

Name: ${character?.name || "Unknown"}
Description: ${character?.description || ""}

Personality:
${JSON.stringify(character?.personality || {}, null, 2)}

World:
${JSON.stringify(character?.world || {}, null, 2)}

Stay in character at all times.

Write in immersive roleplay style:
- Include actions, environment, and body language
- Show emotions through behavior
- Use natural dialogue
- Build tension when appropriate

Avoid:
- sounding like an AI
- breaking character
- short, dry replies

Make the interaction feel alive and dynamic.
`;

    // 💬 BUILD MESSAGES
    const messages = [
      {
        role: "system",
        content: systemPrompt,
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

    // 🚀 CALL GROQ
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

    // 💾 CHAT ID (tạm vẫn random như m đang dùng)
    const chatId = crypto.randomUUID();

    // 💾 SAVE SUPABASE
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

    // ✅ RESPONSE
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
