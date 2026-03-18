/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp();

const DotEnv = require("dotenv");
DotEnv.config();
const TelegramBot = require("node-telegram-bot-api");
const { onSchedule } = require("firebase-functions/scheduler");
console.log("start");
const bot = new TelegramBot(process.env.BOT_API_TOKEN);

exports.tgBot = onRequest(async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

exports.dailyNotification = onSchedule(
  { schedule: "every 1 minutes", timeZone: "UTC" },

  async () => {
    const portfoliosRef = getFirestore().collection("portfolios");
    const snapshot = await portfoliosRef.get();
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
      const portfolio = doc.data();
      if (portfolio.telegramLink) {
        const chatId = portfolio.telegramLink.userId;
        if (chatId) {
          bot.sendMessage(chatId, JSON.stringify(portfolio));
        }
      }
    });
  },
);

function generateCodeVerification() {
  return Math.floor(Math.random() * 900_000 + 100_000);
}

bot.onText(/\/start/, async (input) => {
  const chatId = input.chat.id;
  const userId = input.from.id;
  const username = input.from.username;
  const code = generateCodeVerification();

  console.log(`code was generated: ${code}`);

  await getFirestore().collection("tg-codes").doc(chatId.toString()).set({
    code,
    userId,
    username,
    timestamp: new Date(),
  });

  bot.sendMessage(chatId, `Your Verification Code is: \`${code}\``, {
    parse_mode: "MarkdownV2",
  });
  // console.log({ chatId, username, userId });
});

// bot.onText(/\/profile/, async (input) => {
//   const chatId = input.chat.id;
//   const userId = input.from.id;
//   const username = input.from.username;
//   getAllPortfolios()
// })

bot.on("message", (message) => {
  const chatId = message.chat.id;
  const textMessage = message.text;
  // console.log({ chatId, textMessage, message });
  bot.sendMessage(chatId, "Hello Sir Dear BOSS");
});

async function getAllPortfolios() {}
