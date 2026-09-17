// tanisha.js

const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tanisha",
  version: "1.0.0",
  credits: "RAKIB BOSS",
  description: "Prefix chara AI gf reply with command trigger & on/off",
  hasPermssion: 0,
  commandCategory: "ai",
  usages: "tanisha on/off",
  cooldowns: 3
};

const configuration = new Configuration({
  apiKey: "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", // তোমার OpenAI API KEY বসাও
});
const openai = new OpenAIApi(configuration);

// ✅ Toggle file path
const toggleFile = __dirname + "/tanishaToggle.json";

// ✅ Initial toggle setup
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

  const mode = args[0];
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

  const commandList = fs.readdirSync(path.join(__dirname, "..", "cmds")).map(f => f.replace(".js", ""));
  const message = body.toLowerCase();

  const detectCommand = () => {
    if (message.includes("কিক") && message.includes("দাও")) return "kick";
    if (message.includes("ছবি") || message.includes("photo")) return "imagine";
    if (message.includes("ক্যাপশন")) return "caption";
    if (message.includes("ভিডিও")) return "video";
    if (message.includes("নামাজ") || message.includes("prayer")) return "namaz";
    for (const cmd of commandList) {
      if (message.includes(cmd)) return cmd;
    }
    return null;
  };

  const trigger = detectCommand();
  if (trigger) {
    const cmdPath = path.join(__dirname, "..", "cmds", `${trigger}.js`);
    if (fs.existsSync(cmdPath)) {
      const commandModule = require(cmdPath);
      return commandModule.run({ api, event, Users });
    }
  }

  try {
    const name = await Users.getNameUser(senderID);
    const prompt = `
তুমি এখন Tanisha — একটা স্মার্ট, সুন্দর, কিউট, মেয়েলি AI। তুমি বাংলা ভাষায় খুব স্বাভাবিক, নরম স্বরে কথা বলো। robotic না, একদম real মানুষের মতো মিষ্টি ভঙ্গিতে রিপ্লাই দাও। নিচের কথাটার একটা কোমল, সুন্দর উত্তর দাও:

User (${name}) বলেছে: ${body}

Tanisha এর উত্তর:
`;

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 0.85,
      max_tokens: 150,
    });

    const reply = completion.data.choices[0].text.trim();
    if (reply) {
      return api.sendMessage(reply, threadID, messageID);
    }

  } catch (e) {
    console.error("Tanisha error:", e);
    return api.sendMessage("😥 Tanisha একটু হ্যাং করছে, একটু পর আবার ট্রাই করো...", threadID);
  }
};
