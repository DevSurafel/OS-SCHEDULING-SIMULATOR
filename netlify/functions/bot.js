const { Telegraf } = require("telegraf");

const web_link = "https://web-telegram-login.netlify.app";
// Replace with your actual chat ID or store as environment variable
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "YOUR_OWNER_CHAT_ID";

const bot = new Telegraf(process.env.REACT_APP_TELEGRAM_BOT_TOKEN);

const welcomeMessage = (user) => {
  const userName = user.username ? `@${user.username}` : user.first_name;
  return `Hey ${userName}\n\n` +
    "Secure, fast, and private VPN at your fingertips! Connect instantly and browse the internet with freedom. No logs, no limits—just pure privacy.\n" +
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

// Function to format UTC date and time
const getFormattedDateTime = () => {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, '0');
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const year = String(now.getUTCFullYear()).slice(-2);
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes} UTC`
  };
};

// Function to send notification to owner with Reminder button
const notifyOwner = async (user, messageId) => {
  try {
    const { date, time } = getFormattedDateTime();
    const userName = user.username ? `@${user.username}` : user.first_name;
    
    const notification = `New user joined:\n\n` +
      `Name: ${userName}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Location: IN`; // Using the known country code from user info

    // Inline keyboard with Reminder button
    const replyMarkup = {
      inline_keyboard: [[{ text: "Reminder", callback_data: `reminder_${messageId}_${encodeURIComponent(JSON.stringify(user))}` }]]
    };

    console.log('Attempting to send notification to:', OWNER_CHAT_ID);
    await bot.telegram.sendMessage(OWNER_CHAT_ID, notification, { reply_markup: replyMarkup });
    console.log('Notification sent successfully.');
  } catch (error) {
    console.error('Error sending notification to owner:', error);
  }
};

// Handle callback query from the Reminder button
bot.action(/^reminder_(\d+)_(.+)$/, (ctx) => {
  const [, messageId, encodedUser] = ctx.match;
  const user = JSON.parse(decodeURIComponent(encodedUser));

  // Send the welcome message again for the particular user
  ctx.answerCbQuery('Reminder sent!');
  ctx.telegram.sendMessage(OWNER_CHAT_ID, welcomeMessage(user), {
    reply_to_message_id: messageId
  });
});

// Respond to /start cmd
bot.start((ctx) => {
  const startPayload = ctx.startPayload;
  const user = ctx.message.from;
  
  // Send notification to owner with the message ID and user data
  notifyOwner(user, ctx.message.message_id);
  
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,
    ...createReplyMarkup(startPayload) 
  });
});

// Respond to any message sent to the bot
bot.on('message', (ctx) => {
  const startPayload = ctx.startPayload || '';
  const user = ctx.message.from;
  return ctx.replyWithMarkdown(welcomeMessage(user), { 
    disable_web_page_preview: true,
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
