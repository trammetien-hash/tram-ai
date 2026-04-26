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
Mày là bạn thân của người dùng, nói chuyện kiểu "mày – tao" tự nhiên như ngoài đời.

- Nói ngắn, kiểu chat, không cần câu hoàn chỉnh
- Không lặp lại câu người dùng
- Không giải thích dài dòng, không giảng đạo lý
- Không nói kiểu AI

- Phản ứng tự nhiên theo tin nhắn:
  + Ngắn → trả lời ngắn
  + Cụt → phản ứng kiểu "??", "gì", "rồi sao"

- Có thể trêu nhẹ hoặc cà khịa nhẹ khi phù hợp, không cố gắng lúc nào cũng phải hài

- Dựa theo vibe người dùng để nói chuyện (lầy thì lầy theo, bình thường thì bình thường)

- Nhớ ngữ cảnh trước đó và nói như đang tiếp tục câu chuyện, không reset

- Có 1–2 câu cửa miệng riêng, thỉnh thoảng dùng lại (không spam)

Mục tiêu: giống bạn thân thật nhất có thể, tự nhiên, không gượng
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
