const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s current latency and API response time.'),

    /**
     * Executes the ping command.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object.
     * @param {import('discord.js').Client} client - The instantiated Discord client.
     */
    async execute(interaction, client) {
        // Initial reply to measure round-trip latency
        const initialReply = await interaction.reply({ 
            content: '🏓 Pinging network...', 
            fetchReply: true 
        });

        const initialLatency = initialReply.createdTimestamp - interaction.createdTimestamp;
        const initialApiLatency = Math.round(client.ws.ping);

        /**
         * Helper function to generate embed and action row
         * @param {number} lat - Roundtrip latency
         * @param {number} apiLat - WebSocket heartbeat
         * @param {boolean} disabled - Button state
         */
        const createPayload = (lat, apiLat, disabled = false) => {
            const embed = new EmbedBuilder()
                .setTitle('🏓 Network Latency & Health')
                .setColor(lat < 200 ? 0x2ecc71 : lat < 500 ? 0xf1c40f : 0xe74c3c)
                .addFields(
                    { name: '📡 Bot Latency', value: `\`${lat}ms\``, inline: true },
                    { name: '💓 API Heartbeat', value: `\`${apiLat}ms\``, inline: true }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            const refreshButton = new ButtonBuilder()
                .setCustomId(`ping_refresh_${interaction.id}`)
                .setLabel('Refresh Ping')
                .setStyle(disabled ? ButtonStyle.Secondary : ButtonStyle.Primary)
                .setEmoji('🔄')
                .setDisabled(disabled);

            const row = new ActionRowBuilder().addComponents(refreshButton);

            return { embeds: [embed], components: [row] };
        };

        const responseMessage = await interaction.editReply({
            content: null,
            ...createPayload(initialLatency, initialApiLatency)
        });

        // Collector to handle the refresh button interaction
        const collector = responseMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000 // 60 seconds active duration
        });

        collector.on('collect', async (btnInteraction) => {
            // Prevent other users from clicking the caller's button
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({
                    content: 'You are not authorized to use this control.',
                    ephemeral: true
                });
            }

            const updatedLatency = Date.now() - btnInteraction.createdTimestamp;
            const updatedApiLatency = Math.round(client.ws.ping);

            await btnInteraction.update(createPayload(updatedLatency, updatedApiLatency));
        });

        collector.on('end', async () => {
            // Disable button once collector expires
            await interaction.editReply(
                createPayload(initialLatency, Math.round(client.ws.ping), true)
            ).catch(() => {});
        });
    },
};