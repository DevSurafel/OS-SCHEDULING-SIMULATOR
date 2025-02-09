const { Telegraf } = require("telegraf");

const web_link = "https://web-telegram-login.netlify.app";

const bot = new Telegraf(process.env.REACT_APP_TELEGRAM_BOT_TOKEN);

const welcomeMessage = (user) => {
  const userName = user.username ? `@${user.username}` : user.first_name;
  return `Hey ${userName}\n\n` +
    "Secure, fast, and private VPN at your fingertips! Connect instantly and browse the internet with freedom. No logs, no limits—just pure privacy.\n";
    "Tap to connect!";
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

// Respond to /start cmd
bot.start((ctx) => {
  const startPayload = ctx.startPayload;
  const user = ctx.message.from;
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,  // Disable link preview
    ...createReplyMarkup(startPayload) 
  });
});

// Respond to any message sent to the bot
bot.on('message', (ctx) => {
  const startPayload = ctx.startPayload || ''; // You can customize this if needed
  const user = ctx.message.from;
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,  // Disable link preview
    ...createReplyMarkup(startPayload) 
  });
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Error in handler:', e);
    return { statusCode: 400, body: `Bad Request: ${e.message}` };
  }
};
