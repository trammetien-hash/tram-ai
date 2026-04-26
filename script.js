const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// lưu lịch sử chat ngắn hạn
let chatHistory = [];

function shouldAutoScroll() {
const threshold = 100;
return (
chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight <
threshold
);
}

function scrollToBottom(force = false) {
if (force || shouldAutoScroll()) {
chatArea.scrollTop = chatArea.scrollHeight;
}
}

function addMessage(text, sender) {
const msg = document.createElement("div");
msg.classList.add("message", sender);

const p = document.createElement("p");
p.textContent = text;

msg.appendChild(p);
chatArea.appendChild(msg);

scrollToBottom();
}

function typeMessage(text, sender) {
const msg = document.createElement("div");
msg.classList.add("message", sender);

const p = document.createElement("p");
msg.appendChild(p);
chatArea.appendChild(msg);

let i = 0;
let counter = 0;

function typeWriter() {
if (i < text.length) {
p.textContent += text.charAt(i);
i++;
counter++;

if (counter % 8 === 0) {  
    scrollToBottom();  
  }  

  const speed = Math.floor(Math.random() * 25) + 35;  
  setTimeout(typeWriter, speed);  
} else {  
  scrollToBottom();  
}

}

typeWriter();
}

function showTyping() {
const typing = document.createElement("div");
typing.classList.add("message", "bot");
typing.setAttribute("id", "typingMsg");

typing.innerHTML =   <div class="typing-bubble">   <span></span>   <span></span>   <span></span>   </div>  ;

chatArea.appendChild(typing);
scrollToBottom();
}

function hideTyping() {
const typingMsg = document.getElementById("typingMsg");
if (typingMsg) typingMsg.remove();
}

// 🔥 detect tiếng Việt
function containsVietnamese(text) {
return /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(text);
}

// 🔥 gọi API (đã ép English)
async function getAIReply(message) {
const response = await fetch("/api/chat", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
message: message + "\n(Reply in English only. Do not use Vietnamese.)",
history: chatHistory,
}),
});

const data = await response.json();
return data.reply;
}

async function sendMessage() {
const text = userInput.value.trim();
if (text === "") return;

addMessage(text, "user");

// lưu user
chatHistory.push({
role: "user",
content: text,
});

if (chatHistory.length > 12) {
chatHistory = chatHistory.slice(-12);
}

userInput.value = "";
showTyping();

try {
let aiReply = await getAIReply(text);

// 🔥 nếu bị lạc tiếng → gọi lại  
if (containsVietnamese(aiReply)) {  
  aiReply = await getAIReply(  
    text + "\nRewrite your previous answer in English only."  
  );  
}  

hideTyping();  

// lưu bot  
chatHistory.push({  
  role: "assistant",  
  content: aiReply,  
});  

if (chatHistory.length > 12) {  
  chatHistory = chatHistory.slice(-12);  
}  

if (aiReply.length > 180) {  
  addMessage(aiReply, "bot");  
} else {  
  typeMessage(aiReply, "bot");  
}

} catch (error) {
hideTyping();
addMessage("Something went wrong. Please try again.", "bot");
}
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
if (e.key === "Enter") {
sendMessage();
}
});

Này hẻ
