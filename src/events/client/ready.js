const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    
    /**
     * Executes when the client becomes ready to start working.
     * @param {import('discord.js').Client} client - The instantiated Discord client.
     */
    execute(client) {
        console.log(`[SYSTEM] Client authenticated successfully.`);
        console.log(`[SYSTEM] Logged in as: ${client.user.tag} (ID: ${client.user.id})`);
        
        // Optional: Set a custom presence/activity
        client.user.setActivity({
            name: 'SA-MP Network',
            type: 3 // ActivityType.Watching
        });
    },
};