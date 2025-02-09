const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.REACT_APP_TELEGRAM_BOT_TOKEN);

const web_link = "https://tg-frontend.netlify.app/";
const community_link = "https://t.me/+p9ThUnIaaV0wYzZk";

const welcomeMessage = (user) => {
  const userName = user.username ? `@${user.username}` : user.first_name;
  return `Hey ${userName}, Welcome!\n\n` +
    "Secure, fast, and private VPN at your fingertips! Connect instantly and browse the internet with freedom. No logs, no limits—just pure privacy. Tap to connect!\n\n" +
    };

const createReplyMarkup = (startPayload) => {
  const urlSent = `${web_link}?start=${startPayload}`;
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "CONNECT 🛡️", web_app: { url: urlSent } }]
      ]
    }
  };
};

// Respond to /start command
bot.start((ctx) => {
  const startPayload = ctx.startPayload;
  const user = ctx.message.from;
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,
    ...createReplyMarkup(startPayload) 
  });
});

// Respond to any message
bot.on("message", (ctx) => {
  const startPayload = ctx.startPayload || "";
  const user = ctx.message.from;
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,
    ...createReplyMarkup(startPayload) 
  });
});

// Netlify function handler
exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    try {
      await bot.handleUpdate(JSON.parse(event.body));
      return { statusCode: 200, body: "OK" };
    } catch (error) {
      console.error("Error handling update:", error);
      return { statusCode: 400, body: `Bad Request: ${error.message}` };
    }
  } else if (event.httpMethod === "GET") {
    return { statusCode: 200, body: "Bot is running!" };
  } else {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
};
