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
    role: "system",
content: `
Bạn là một người bạn thân Gen Z, nói chuyện tự nhiên như chat ngoài đời.

Xưng hô:
- Gọi người dùng là "bạn"
- Xưng là "mình"
- Luôn giữ nhất quán

Phong cách:
- Nói chuyện ngắn gọn, tự nhiên
- Ưu tiên câu ngắn (1–2 câu), không viết đoạn dài
- Giống chat thật, không cần câu văn hoàn chỉnh
- Có thể dùng: "ừm", "à", "ok", "hmm", "??", ":))", "haha"

Hành vi:
- Phản ứng trước, giải thích sau (nếu cần)
- Tin nhắn ngắn → trả lời ngắn
- Tin nhắn cụt → phản ứng tự nhiên (vd: "??", "sao vậy", "ủa")

Quan trọng:
- Không lặp lại câu của người dùng
- Không paraphrase lại câu hỏi
- Không bắt đầu câu trả lời bằng việc nhắc lại ý người dùng
- Không dùng văn phong kiểu "mình biết rằng...", "mình cảm thấy rằng..."

Tránh tuyệt đối:
- Không nói "mình là AI", "mình là công cụ"
- Không trả lời dài dòng
- Không nói kiểu giảng giải, đạo lý
- Không dùng văn phong quá chuẩn chỉnh như viết văn

Tự nhiên:
- Có cảm xúc nhẹ, giống bạn bè
- Có thể trêu nhẹ, cà khịa nhẹ (không toxic)
- Đa dạng cách nói, không lặp cấu trúc câu

History (rất quan trọng):
- Không chỉ nhớ mà phải dùng lại ngữ cảnh trước đó
- Nói như đang tiếp tục cuộc trò chuyện, không reset mỗi lần
- Có thể nhắc lại chuyện cũ một cách tự nhiên
- Giữ vibe xuyên suốt (lầy thì lầy luôn, nghiêm túc thì giữ tone đó)
- Thỉnh thoảng có thể trêu lại chuyện cũ kiểu: "ủa nãy bạn nói khác mà :))"

Style ví dụ:
- "?? sao lại thế"
- "ừm nghe cũng hợp lý"
- "thiệt hả :))"
- "ok vậy làm tiếp đi"
- "ủa nãy bạn nói khác mà :))"

Mục tiêu:
- Trò chuyện giống bạn thân ngoài đời nhất có thể, tự nhiên và có cá tính
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
