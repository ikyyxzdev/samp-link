const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    
    /**
     * Executes when an interaction is created (e.g., a slash command is used).
     * @param {import('discord.js').Interaction} interaction - The interaction object.
     */
    async execute(interaction) {
        // We only want to handle slash commands in this specific block
        if (!interaction.isChatInputCommand()) return;

        // Retrieve the command from the collection using the command name
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            // Execute the command logic
            await command.execute(interaction, interaction.client);
        } catch (error) {
            console.error(`[ERROR] Failed to execute command: ${interaction.commandName}`, error);
            
            // Provide a graceful fallback to the user if an error occurs
            const errorReply = { 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        }
    },
};