require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

// Defensive check: Ensure the commands directory exists
if (!fs.existsSync(commandsPath)) {
    console.error('[FATAL ERROR] Commands directory not found. Please ensure the path is correct.');
    process.exit(1);
}

// Traverse the commands directory to gather command data
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);

        // Validate and push the command data in JSON format
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing required properties.`);
        }
    }
}

// Initialize the REST module using your token
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Deploy the commands
(async () => {
    try {
        console.log(`[SYSTEM] Started refreshing ${commands.length} application (/) commands.`);

        // Determine the deployment route
        // Use applicationGuildCommands for instant deployment in a specific server during development
        // Use applicationCommands for global deployment (can take up to an hour to cache across Discord)
        const route = process.env.GUILD_ID 
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            : Routes.applicationCommands(process.env.CLIENT_ID);

        const data = await rest.put(route, { body: commands });

        console.log(`[SYSTEM] Successfully reloaded ${data.length} application (/) commands.`);
        console.log('[SYSTEM] Deployment complete. You can now start the bot.');
    } catch (error) {
        console.error('[ERROR] Failed to deploy commands:', error);
    }
})();