const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
    console.log('[SYSTEM] Initializing Command Handler & Auto-Deploy...');
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    // Array to collect command data for deployment
    const commandsArray = []; 

    if (!fs.existsSync(commandsPath)) {
        console.warn('[WARNING] Commands directory not found. Skipping command initialization.');
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);
    let commandCount = 0;

    // 1. Load commands into memory and collect their data
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                // Set command in Discord Collection for execution
                client.commands.set(command.data.name, command);
                // Push JSON data to array for deployment
                commandsArray.push(command.data.toJSON());
                commandCount++;
            } else {
                console.warn(`[WARNING] The command at ${filePath} is missing the required "data" or "execute" property.`);
            }
        }
    }
    
    console.log(`[SYSTEM] Successfully loaded ${commandCount} commands into memory.`);

    // 2. Auto-Deploy commands to Discord API
    if (commandsArray.length > 0) {
        if (!process.env.CLIENT_ID || !process.env.DISCORD_TOKEN) {
            console.warn('[WARNING] Missing CLIENT_ID or DISCORD_TOKEN in .env. Auto-deployment skipped.');
            return;
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            console.log(`[SYSTEM] Started auto-deploying ${commandsArray.length} application (/) commands...`);

            // Use Guild deployment for testing (instant), or Global deployment for production
            const route = process.env.GUILD_ID 
                ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(process.env.CLIENT_ID);

            const data = await rest.put(route, { body: commandsArray });

            console.log(`[SYSTEM] Successfully deployed ${data.length} application (/) commands.`);
        } catch (error) {
            console.error('[ERROR] Failed to auto-deploy commands:', error);
        }
    }
};