const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const botReplies = [
  "Tôi đang lắng nghe đây.",
  "Nghe thú vị đấy.",
  "Bạn muốn kể thêm không?",
  "Tôi hiểu rồi.",
  "Hôm nay bạn thế nào?"
];

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  p.textContent = text;

  msg.appendChild(p);
  chatArea.appendChild(msg);

  chatArea.scrollTop = chatArea.scrollHeight;
}

function botTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.setAttribute("id", "typingMsg");

  const p = document.createElement("p");
  p.textContent = "Typing...";

  typing.appendChild(p);
  chatArea.appendChild(typing);

  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  userInput.value = "";

  botTyping();

  setTimeout(() => {
    const typingMsg = document.getElementById("typingMsg");
    if (typingMsg) typingMsg.remove();

    const randomReply =
      botReplies[Math.floor(Math.random() * botReplies.length)];

    addMessage(randomReply, "bot");
  }, 1200);
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});