// tanisha.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// 🔑 আপনার Google Gemini API Key এখানে বসান
const GEMINI_API_KEY = "AIzaSyB89FaCIZ0KpySFqhYfToljuIdJsO9wAKM";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ ফাইল ও ফোল্ডার পাথ সেটআপ
const dataDir = path.join(__dirname, "tanisha_data");
const dataFilePath = path.join(dataDir, "tanishaData.json");
const toggleFilePath = path.join(dataDir, "tanishaToggle.json");

// ডাটা ফোল্ডার ও ফাইল না থাকলে অটো ক্রিয়েট করা
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ডিফোল্ট মেসেজ ও টিচ ডাটাবেস
if (!fs.existsSync(dataFilePath)) {
  const defaultData = {
    "কেমন আছো": "আমি ভালো আছি জানু! তুমি কেমন আছো? 🥰",
    "তোমার নাম কি": "আমার নাম তানিয়া (Tanisha)! তোমার কিউট গার্লফ্রেন্ড 😉",
    "হাই": "হ্যালো বেবি! কেমন কাটছে তোমার দিন? ❤️",
    "হ্যালো": "হুম বলো জানু, শুনছি তো! 🌸"
  };
  fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2), "utf8");
}

// On/Off টগল ফাইল
if (!fs.existsSync(toggleFilePath)) {
  fs.writeFileSync(toggleFilePath, JSON.stringify({ status: "on" }, null, 2), "utf8");
}

function isTanishaOn() {
  try {
    const data = JSON.parse(fs.readFileSync(toggleFilePath, "utf8"));
    return data.status === "on";
  } catch (e) {
    return true;
  }
}

function setTanisha(status) {
  fs.writeFileSync(toggleFilePath, JSON.stringify({ status }, null, 2), "utf8");
}

// 🤖 Gemini API Key কাজ করছে কিনা টেস্ট করার ফাংশন
async function checkGeminiAPI() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("Hi");
    if (res && res.response) {
      console.log("✅ [Tanisha AI] Google Gemini API Key Successfully Connected!");
    }
  } catch (err) {
    console.error("❌ [Tanisha AI] Gemini API Key Error:", err.message);
  }
}

// বট স্টার্ট হলেই API চেক করবে
checkGeminiAPI();

module.exports.config = {
  name: "tanisha",
  version: "3.0.0",
  credits: "Updated with Gemini & Auto-Folder",
  description: "Smart AI Girlfriend with Teach & Default Data Storage",
  hasPermssion: 0,
  commandCategory: "ai",
  usages: "tanisha on / tanisha off / tanisha teach প্রশ্ন - উত্তর",
  cooldowns: 2,
  prefix: false
};

// 🟢 Command Handler (on, off, teach)
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const subCommand = args[0]?.toLowerCase();

  if (subCommand === "on" || subCommand === "off") {
    setTanisha(subCommand);
    return api.sendMessage(`✅ Tanisha এখন ${subCommand === "on" ? "চালু (ON)" : "বন্ধ (OFF)"} করা হলো! 💖`, threadID, messageID);
  }

  if (subCommand === "teach") {
    const rawContent = args.slice(1).join(" ");
    const parts = rawContent.split("-").map(p => p.trim());

    if (parts.length < 2) {
      return api.sendMessage("❌ নিয়ম: tanisha teach প্রশ্ন - উত্তর\nউদাহরণ: tanisha teach চা খাইছো? - না গো বেবি, তুমি খাওয়াই দিবা? 🙈", threadID, messageID);
    }

    const [question, answer] = parts;
    try {
      const storeData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      storeData[question.toLowerCase()] = answer;
      fs.writeFileSync(dataFilePath, JSON.stringify(storeData, null, 2), "utf8");

      return api.sendMessage(`🥰 নতুন কথা শিখে নিলাম!\n\n❓ প্রশ্ন: ${question}\n💬 উত্তর: ${answer}`, threadID, messageID);
    } catch (err) {
      return api.sendMessage("😥 শেখাতে গিয়ে একটু সমস্যা হয়েছে!", threadID, messageID);
    }
  }

  return api.sendMessage("👉 ব্যবহারবিধি:\n• tanisha on\n• tanisha off\n• tanisha teach প্রশ্ন - উত্তর", threadID, messageID);
};

// 🟢 Event Handler (Auto Response)
module.exports.handleEvent = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body || !isTanishaOn() || senderID === api.getCurrentUserID()) return;

  const userText = body.trim().toLowerCase();

  // ১. tanishaData.json থেকে চেক করা (Defolt/Teach Data)
  try {
    const localData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    if (localData[userText]) {
      return api.sendMessage(localData[userText], threadID, messageID);
    }
  } catch (e) {
    console.error("Data File Read Error:", e);
  }

  // ২. যদি লোকাল ডাটাতে উত্তর না থাকে, তবে Gemini AI রিপ্লাই দেবে
  try {
    const senderName = await Users.getNameUser(senderID);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `তুমি এখন Tanisha — একটা মিষ্টি, কিউট, যত্নশীল এবং রোমান্টিক মেয়েলি AI। তুমি বাংলা ভাষায় কথা বলো। একদম আসল মানুষের মতো সংক্ষেপে মিষ্টি করে রিপ্লাই দেবে। ইউজারের নাম ${senderName}। প্রশ্ন/মেসেজ: ${body}`;

    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();

    if (aiReply) {
      return api.sendMessage(aiReply, threadID, messageID);
    }
  } catch (err) {
    console.error("Gemini Response Error:", err);
  }
};
