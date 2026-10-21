const { Events, ActivityType } = require('discord.js');
const { queryServer } = require('../../utils/sampQuery');
const config = require('../../config');

// Interval update status dalam milidetik (30 detik aman dari Discord rate limit)
const UPDATE_INTERVAL = 30_000;

/**
 * Mengambil data live server SA-MP dan memperbarui status bot
 * @param {import('discord.js').Client} client 
 */
async function updateBotPresence(client) {
    try {
        const data = await queryServer();
        const serverName = data.hostname || config.bot.name;
        const onlinePlayers = data.online ?? 0;
        const maxPlayers = data.maxplayers ?? 0;

        client.user.setPresence({
            activities: [{
                name: `${serverName} | ${onlinePlayers}/${maxPlayers} Players`,
                type: ActivityType.Listening
            }],
            status: 'online'
        });
    } catch {
        // Fallback jika server SA-MP sedang offline atau tidak merespons query UDP
        client.user.setPresence({
            activities: [{
                name: `${config.bot.name} | Server Offline`,
                type: ActivityType.Listening
            }],
            status: 'dnd' // Set status DND (merah) saat server game offline
        });
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,

    /**
     * Dijalankan saat bot berhasil login ke Discord
     * @param {import('discord.js').Client} client 
     */
    async execute(client) {
        console.log(`[SYSTEM] Client authenticated successfully.`);
        console.log(`[SYSTEM] Logged in as: ${client.user.tag} (ID: ${client.user.id})`);

        // Update status pertama kali saat bot baru aktif
        await updateBotPresence(client);

        // Pasang timer interval berkala
        setInterval(() => {
            updateBotPresence(client);
        }, UPDATE_INTERVAL);

        console.log(`[PRESENCE] Auto-updater running (Interval: ${UPDATE_INTERVAL / 1000}s).`);
    },
};