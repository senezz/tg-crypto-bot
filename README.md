# 🤖 tg-crypto-bot

A Telegram bot deployed as **Firebase Cloud Functions** that serves as the notification layer for the [crypto-app-react](https://github.com/senezz/crypto-app-react) portfolio tracker.

It handles two things:

1. **Account linking** — generates a one-time verification code so users can connect their Telegram account to the web app
2. **Daily notifications** — sends every linked user a message with their portfolio's 24-hour change in USD and percentage

---

## 🔗 Related project

This bot is part of the [crypto-app-react](https://github.com/senezz/crypto-app-react) ecosystem — a React-based cryptocurrency portfolio tracker. The web app lets users link their Telegram via this bot to receive daily portfolio updates.

---

## ✨ Features

- `/start` command — generates a 6-digit verification code and saves it to Firestore (`tg-codes` collection) along with the user's Telegram `chatId`, `userId`, and `username`
- **Daily scheduled notification** — a Firebase Cloud Function runs every 24 hours, fetches live prices from the CoinStats API, calculates each user's portfolio change, and sends a summary message via Telegram
- **Webhook handler** — an HTTP Cloud Function (`tgBot`) processes incoming Telegram updates

---

## 🛠️ Tech Stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Runtime     | Node.js 24                                   |
| Deployment  | Firebase Cloud Functions v2                  |
| Database    | Firebase Firestore (shared with the web app) |
| Scheduler   | Firebase Cloud Functions Scheduler           |
| Telegram    | node-telegram-bot-api                        |
| Crypto data | CoinStats API                                |

---

## 📁 Project Structure

```
tg-crypto-bot/
├── functions/
│   ├── index.js        # Main entry point: bot logic, Cloud Functions exports
│   ├── package.json
│   └── .env            # BOT_API_TOKEN (not committed)
├── firebase.json       # Firebase Functions config
├── .firebaserc         # Firebase project alias
├── main.js             # Local dev / standalone entry point
└── package.json
```

---

## ⚙️ How It Works

### Account linking (verification flow)

1. The user clicks **"Link Telegram"** in [crypto-app-react](https://github.com/senezz/crypto-app-react).
2. They are redirected to [@CryptoPortfolioNotificationsBot](https://t.me/CryptoPortfolioNotificationsBot) and send `/start`.
3. The bot generates a random 6-digit code, stores it in the Firestore `tg-codes/{chatId}` document alongside the user's Telegram `username`, `userId`, and `chatId`.
4. The user copies the code into the web app's verification modal.
5. The web app queries Firestore for a matching code, retrieves the Telegram identity, and saves `telegramLink: { username, chatId }` to the user's portfolio document.

### Daily notifications

A scheduled Cloud Function (`dailyNotification`) runs **every 24 hours (UTC)**:

1. Reads all documents in the `portfolios` collection.
2. For each portfolio that has a `telegramLink.chatId`, fetches current prices from the CoinStats API.
3. Computes the total monetary and percentage change across all assets.
4. Sends a Telegram message to the linked chat:

```
Your portfolio has grown: 42.30 USD (3.15%)
```

or

```
Your portfolio has fall: 18.00 USD (1.20%)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (shared with [crypto-app-react](https://github.com/senezz/crypto-app-react))
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A CoinStats API key

### Installation

```bash
git clone https://github.com/senezz/tg-crypto-bot.git
cd tg-crypto-bot/functions
npm install
```

### Environment variables

Create a `.env` file inside the `functions/` directory:

```env
BOT_API_TOKEN=your_telegram_bot_token
```

> The CoinStats API key is currently hardcoded in `index.js`. It is recommended to move it to `.env` as `COINSTATS_API_KEY` before deploying.

### Run locally with Firebase emulator

```bash
firebase emulators:start --only functions
```

### Deploy to Firebase

```bash
firebase deploy --only functions
```

---

## 🔥 Cloud Functions

| Function            | Trigger              | Description                                                            |
| ------------------- | -------------------- | ---------------------------------------------------------------------- |
| `tgBot`             | HTTP POST            | Telegram webhook — processes incoming bot updates                      |
| `dailyNotification` | Schedule (every 24h) | Fetches prices and sends portfolio change messages to all linked users |

---

## 🗄️ Firestore Collections

This bot shares a Firestore database with [crypto-app-react](https://github.com/senezz/crypto-app-react):

| Collection   | Document   | Description                                                           |
| ------------ | ---------- | --------------------------------------------------------------------- |
| `tg-codes`   | `{chatId}` | Temporary verification codes: `{ code, userId, username, timestamp }` |
| `portfolios` | `{uid}`    | User portfolio: `{ assets[], telegramLink: { chatId, username } }`    |

---

## 📜 Available Scripts

From the `functions/` directory:

| Script           | Description                               |
| ---------------- | ----------------------------------------- |
| `npm run serve`  | Start Firebase emulator (functions only)  |
| `npm run deploy` | Deploy functions to Firebase              |
| `npm run logs`   | Stream Firebase function logs             |
| `npm run shell`  | Open Firebase Functions interactive shell |
