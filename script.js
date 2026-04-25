const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  p.textContent = text;

  msg.appendChild(p);
  chatArea.appendChild(msg);

  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.setAttribute("id", "typingMsg");

  typing.innerHTML = `
    <div class="typing-bubble">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  const typingMsg = document.getElementById("typingMsg");
  if (typingMsg) typingMsg.remove();
}

async function getAIReply(message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();
  return data.reply;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  userInput.value = "";

  showTyping();

  try {
    const aiReply = await getAIReply(text);

    hideTyping();
    addMessage(aiReply, "bot");
  } catch (error) {
    hideTyping();
    addMessage("Đã xảy ra lỗi khi kết nối AI.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
