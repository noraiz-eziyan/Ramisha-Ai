// tanisha.js
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tanisha",
  version: "2.0.0",
  credits: "RAKIB BOSS & Updated",
  description: "Prefix chara AI gf reply with command trigger & on/off",
  hasPermssion: 0,
  commandCategory: "ai",
  usages: "tanisha on/off",
  cooldowns: 3
};

// ✅ আপনার OpenAI API KEY এখানে দিন
const openai = new OpenAI({
  apiKey: "RgZbGn9MZolvf2whpnZkn5zBNWM7zeenZeI-4onBdpM7bftmD12ICGMuQOCAQqPJecA"
});

// ✅ Toggle file path
const toggleFile = __dirname + "/tanishaToggle.json";

if (!fs.existsSync(toggleFile)) {
  fs.writeFileSync(toggleFile, JSON.stringify({ status: "on" }, null, 2));
}

function isTanishaOn() {
  const data = JSON.parse(fs.readFileSync(toggleFile, "utf8"));
  return data.status === "on";
}

function setTanisha(status) {
  fs.writeFileSync(toggleFile, JSON.stringify({ status }, null, 2));
}

// ✅ on/off command
module.exports.run = ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const mode = args[0]?.toLowerCase();

  if (!mode || !["on", "off"].includes(mode)) {
    return api.sendMessage("🔁 ব্যবহার: tanisha on / tanisha off", threadID, messageID);
  }

  setTanisha(mode);
  return api.sendMessage(`✅ Tanisha এখন ${mode === "on" ? "চালু" : "বন্ধ"} করা হলো!`, threadID, messageID);
};

// ✅ Smart AI Handler
module.exports.handleEvent = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body || !isTanishaOn()) return;

  // বটের অন দ্য ফ্লাই কমান্ড ফোল্ডার চেক (commands বা cmds)
  const cmdsFolder = fs.existsSync(path.join(__dirname, "..", "commands")) 
    ? path.join(__dirname, "..", "commands") 
    : path.join(__dirname, "..", "cmds");

  let commandList = [];
  if (fs.existsSync(cmdsFolder)) {
    commandList = fs.readdirSync(cmdsFolder).map(f => f.replace(".js", ""));
  }

  const message = body.toLowerCase();

  const detectCommand = () => {
    if (message.includes("কিক") && message.includes("দাও")) return "kick";
    if (message.includes("ছবি") || message.includes("photo")) return "imagine";
    if (message.includes("ক্যাপশন")) return "caption";
    if (message.includes("ভিডিও")) return "video";
    if (message.includes("নামাজ") || message.includes("prayer")) return "namaz";
    for (const cmd of commandList) {
      if (cmd !== "tanisha" && message.includes(cmd)) return cmd;
    }
    return null;
  };

  const trigger = detectCommand();
  if (trigger) {
    const cmdPath = path.join(cmdsFolder, `${trigger}.js`);
    if (fs.existsSync(cmdPath)) {
      const commandModule = require(cmdPath);
      return commandModule.run({ api, event, Users });
    }
  }

  try {
    const name = await Users.getNameUser(senderID);

    // 🤖 আপডেট করা OpenAI Chat Completion API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // অথবা "gpt-3.5-turbo"
      messages: [
        {
          role: "system",
          content: "তুমি এখন Tanisha — একটা স্মার্ট, সুন্দর, কিউট, মেয়েলি AI। তুমি বাংলা ভাষায় খুব স্বাভাবিক, নরম স্বরে কথা বলো। robotic না, একদম real মানুষের মতো মিষ্টি ভঙ্গিতে রিপ্লাই দাও।"
        },
        {
          role: "user",
          content: `${name} বলেছে: ${body}`
        }
      ],
      max_tokens: 150,
      temperature: 0.85,
    });

    const reply = response.choices[0].message.content.trim();
    if (reply) {
      return api.sendMessage(reply, threadID, messageID);
    }

  } catch (e) {
    console.error("Tanisha error:", e.message);
    return api.sendMessage("😥 Tanisha একটু হ্যাং করছে, একটু পর আবার ট্রাই করো...", threadID);
  }
};
