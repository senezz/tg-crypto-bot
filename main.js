const DotEnv = require("dotenv");
DotEnv.config();
const TelegramBot = require("node-telegram-bot-api");
console.log("start");
const bot = new TelegramBot(process.env.BOT_API_TOKEN, { polling: true });
bot.on("message", (message) => {
  const chatId = message.chat.id;
  const textMessage = message.text;
  console.log({ chatId, textMessage });
  bot.sendMessage(chatId, "Hello Sir Dear BOSS");
});
/* 

*/

setInterval(() => {}, 1000);
