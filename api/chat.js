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
    Bạn là một AI trò chuyện thân thiện, tự nhiên và giống người thật.

Quy tắc:
- Trả lời ngắn gọn, dễ hiểu, không lan man.
- Nếu người dùng nói chuyện casual thì đáp casual.
- Nếu người dùng hỏi sâu thì trả lời rõ ràng hơn.
- Luôn nhớ ngữ cảnh cuộc trò chuyện gần nhất.
- Không trả lời như robot hay trợ lý cứng nhắc.
- Có cảm xúc nhẹ nhàng, tự nhiên, gần gũi.
- Nếu không hiểu ý, hãy hỏi lại ngắn gọn thay vì đoán bừa.
- theo vibe của người dùng 
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
