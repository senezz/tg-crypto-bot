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

const COINSTATS_API_KEY = "b31jjX0fM+WeEqGcUTKHKRd3H5RwzYuaHzyhv9EgCM8=";
const COINSTATS_API_URL = "https://openapiv1.coinstats.app/coins";

async function fetchCurrentPrices() {
  try {
    const options = {
      method: "GET",
      headers: { "X-API-KEY": COINSTATS_API_KEY },
    };

    const response = await fetch(COINSTATS_API_URL, options);
    const data = await response.json();
    const pricesMap = new Map();

    if (data && data.result) {
      for (const coin of data.result) {
        pricesMap.set(coin.id.toLowerCase(), {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
          priceChange1d: coin.priceChange1d || 0,
        });
      }
    }

    return pricesMap;
  } catch (error) {
    console.error("Error fetching coin prices:", error);
    return new Map();
  }
}

async function sendDailyNotification(chatId, assets) {
  try {
    const currentPrices = await fetchCurrentPrices();
    if (currentPrices.size === 0) {
      console.error("Failed to fetch current prices");
      return;
    }

    let totalMonetaryChange = 0;
    let totalPreviousValue = 0;
    let totalCurrentValue = 0;

    for (const asset of assets) {
      const coinId = asset.id.toLowerCase();
      const currentPriceData = currentPrices.get(coinId);

      if (currentPriceData) {
        const previousPrice = asset.price;
        const currentPrice = currentPriceData.price;
        const monetaryChange = (currentPrice - previousPrice) * asset.amount;
        const previousValue = previousPrice * asset.amount;
        const currentValue = currentPrice * asset.amount;

        totalMonetaryChange += monetaryChange;
        totalPreviousValue += previousValue;
        totalCurrentValue += currentValue;
      }
    }

    const totalPercentChange =
      totalPreviousValue > 0
        ? ((totalCurrentValue - totalPreviousValue) / totalPreviousValue) * 100
        : 0;

    let message = "";
    if (totalMonetaryChange > 0) {
      message = `Your portfolio has grown: ${totalMonetaryChange.toFixed(2)} USD (${totalPercentChange.toFixed(2)}%)`;
    } else if (totalMonetaryChange < 0) {
      message = `Your portfolio has fall: ${Math.abs(totalMonetaryChange).toFixed(2)} USD (${Math.abs(totalPercentChange).toFixed(2)}%)`;
    } else {
      message = `Your portfolio didn't change: 0.00 USD (0.00%)`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
  }
}

exports.tgBot = onRequest(async (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

exports.dailyNotification = onSchedule(
  { schedule: "every 24 hours", timeZone: "UTC" },
  async () => {
    const portfoliosRef = getFirestore().collection("portfolios");
    const snapshot = await portfoliosRef.get();

    for (const doc of snapshot.docs) {
      const portfolio = doc.data();
      if (portfolio.telegramLink && portfolio.assets) {
        const chatId = portfolio.telegramLink.chatId;

        if (chatId) {
          try {
            await sendDailyNotification(chatId, portfolio.assets);
          } catch (e) {
            console.error(
              `Failed to send notification to chatId ${chatId}:`,
              e,
            );
          }
        }
      }
    }
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
});

bot.on("message", (message) => {
  const chatId = message.chat.id;
  const textMessage = message.text;
  bot.sendMessage(chatId, "Hello Sir Dear BOSS");
});
