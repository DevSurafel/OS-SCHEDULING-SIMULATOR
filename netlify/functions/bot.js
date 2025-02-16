const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

// Environment variables
const API_ID = process.env.API_ID; // Not used in this context, but keeping for consistency
const API_HASH = process.env.API_HASH; // Not used, but keeping for consistency
const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = "https://tg-back-m8e0.onrender.com";  // Replace with your backend URL
const WEB_LINK = "https://checkingera.netlify.app";  // Your web app URL
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || 'YOUR_OWNER_CHAT_ID';

const bot = new Telegraf(BOT_TOKEN);

// Helper function to create welcome message
const welcomeMessage = (user) => {
    const userName = user.username ? `@${user.username}` : user.first_name;
    return `Hey ${userName}\n\n` +
        "Secure, fast, and private VPN at your fingertips! Connect instantly and browse the internet with freedom. No logs, no limits—just pure privacy.\n" +
        "Tap to connect!";
};

// Helper function to create inline keyboard markup
const createReplyMarkup = (startPayload) => {
    const urlSent = `${WEB_LINK}?start=${startPayload || ''}`;
    return {
        inline_keyboard: [
            [{ text: "START", web_app: { url: urlSent } }]
        ]
    };
};

// Function to notify owner (simplified for this example)
const notifyOwner = async (user) => {
    try {
        const userName = user.username ? `@${user.username}` : user.first_name;
        const notification = `New user joined:\n\n` +
                             `Name: ${userName}\n` +
                             `Location: IN`;
        await bot.telegram.sendMessage(OWNER_CHAT_ID, notification);
    } catch (error) {
        console.error('Error notifying owner:', error);
    }
};

// Handle /start command
bot.start(async (ctx) => {
    console.log('Received /start command from:', ctx.from.id);
    const startPayload = ctx.startPayload || '';
    const inviterId = startPayload || '';
    const inviteeId = ctx.from.id;

    console.log('Inviter ID:', inviterId);
    console.log('Invitee ID:', inviteeId);

    // Prevent inviter from clicking their own invite link
    if (inviterId && inviterId !== inviteeId.toString()) {
        console.info(`New user ${inviteeId} started the bot using invite link from ${inviterId}`);
        try {
            const response = await fetch(`${BACKEND_URL}/handle_invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inviter_id: inviterId, invitee_id: inviteeId }),
            });
            if (response.ok) {
                console.info(`Updated stats for inviter ${inviterId} with new invitee ${inviteeId}`);
            } else {
                const text = await response.text();
                console.error(`Failed to update stats for inviter ${inviterId}: ${text}`);
            }
        } catch (e) {
            console.error(`Error updating stats for inviter ${inviterId}:`, e);
        }
    } else if (inviterId === inviteeId.toString()) {
        console.info(`Inviter ${inviterId} tried to use their own invite link. Ignoring.`);
    }

    // Send welcome message with inline button
    const welcomeMsg = welcomeMessage(ctx.from);
    const replyMarkup = createReplyMarkup(startPayload);

    try {
        await ctx.replyWithMarkdown(welcomeMsg, {
            disable_web_page_preview: true,
            reply_markup: replyMarkup
        });
        console.log('Welcome message sent successfully');
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }

    try {
        await notifyOwner(ctx.from);
        console.log('Owner notified successfully');
    } catch (error) {
        console.error('Error notifying owner:', error);
    }
});

// Respond to any message sent to the bot
bot.on('message', async (ctx) => {
    const startPayload = ctx.startPayload || '';
    const user = ctx.from;

    // Send welcome message with inline button
    const welcomeMsg = welcomeMessage(user);
    const replyMarkup = createReplyMarkup(startPayload);

    try {
        await ctx.replyWithMarkdown(welcomeMsg, {
            disable_web_page_preview: true,
            reply_markup: replyMarkup
        });
        console.log('Welcome message sent successfully');
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

// Start the bot
bot.launch()
    .then(() => console.log('Bot started successfully!'))
    .catch((err) => console.error('Error starting bot:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
