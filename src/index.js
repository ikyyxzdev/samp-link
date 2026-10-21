require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { testConnection } = require('./database');

// Initialize the Discord Client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Initialize a Collection to cache available commands
client.commands = new Collection();

/**
 * Bootstrap function to initialize database connection, handlers, and Discord login
 */
async function bootstrap() {
    console.log('[SYSTEM] Starting bot initialization sequence...');

    // 1. Verify MySQL database connectivity
    await testConnection();

    // 2. Load and execute all handler modules dynamically
    const handlersPath = path.join(__dirname, 'handlers');
    if (fs.existsSync(handlersPath)) {
        const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

        for (const file of handlerFiles) {
            const handler = require(path.join(handlersPath, file));
            await handler(client);
        }
    } else {
        console.warn('[WARNING] Handlers directory not found.');
    }

    // 3. Authenticate and establish connection to Discord
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('[FATAL ERROR] Failed to authenticate with Discord. Please verify the DISCORD_TOKEN in your .env file.', error);
    }
}

bootstrap();