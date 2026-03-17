const functions = require("firebase-functions");

const DotEnv = require("dotenv");
DotEnv.config();
const TelegramBot = require("node-telegram-bot-api");
const { onRequest } = require("firebase-functions/https");
console.log("start");
const bot = new TelegramBot(process.env.BOT_API_TOKEN);

exports.tgBot = onRequest(async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

function generateCodeVerification() {
  return Math.floor(Math.random() * 900_000 + 100_000);
}

bot.onText(/\/start/, (input) => {
  const chatId = input.chat.id;
  const userId = input.from.id;
  const username = input.from.username;
  const code = generateCodeVerification();
  bot.sendMessage(chatId, `Your Verification Code is: \`${code}\``, {
    parse_mode: "MarkdownV2",
  });
  // console.log({ chatId, username, userId });
});
bot.on("message", (message) => {
  const chatId = message.chat.id;
  const textMessage = message.text;
  // console.log({ chatId, textMessage, message });
  bot.sendMessage(chatId, "Hello Sir Dear BOSS");
});

setInterval(() => {}, 1000);
