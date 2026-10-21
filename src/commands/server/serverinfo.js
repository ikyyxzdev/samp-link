const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const { queryServer } = require('../../utils/sampQuery');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Fetches real-time status and player statistics from the SA-MP server.'),

    /**
     * Executes the serverinfo command.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        // Defer reply immediately since querying a UDP game server can take a moment
        await interaction.deferReply();

        /**
         * Helper to build embed and components based on query result
         * @param {object|null} data - Query response or null if offline
         * @param {boolean} disabled - Whether the refresh button is disabled
         */
        const buildResponse = (data, disabled = false) => {
            const embed = new EmbedBuilder().setTimestamp();

            if (config.bot.logo) {
                embed.setThumbnail(config.bot.logo);
            }

            if (!data) {
                // Server is offline or unreachable
                embed
                    .setTitle(`🔴 ${config.bot.name} - Server Offline`)
                    .setColor(config.colors.danger)
                    .setDescription('Unable to establish a connection to the SA-MP server. The server might be restarting or offline.')
                    .addFields(
                        { name: '🌐 Server Address', value: `\`${config.server.ip}\``, inline: true },
                        { name: '📡 Status', value: '`Offline / Unreachable`', inline: true }
                    );
            } else {
                // Server is online
                const isPassworded = Boolean(data.passworded);
                const onlinePlayers = data.online ?? 0;
                const maxPlayers = data.maxplayers ?? 0;

                embed
                    .setTitle(`🟢 ${data.hostname || config.bot.name}`)
                    .setColor(config.colors.success)
                    .addFields(
                        { name: '🌐 Server IP', value: `\`${config.server.ip}\``, inline: true },
                        { name: '👥 Players Online', value: `\`${onlinePlayers} / ${maxPlayers}\``, inline: true },
                        { name: '🔒 Password Protected', value: isPassworded ? '`Yes`' : '`No`', inline: true },
                        { name: '🎮 Gamemode', value: `\`${data.gamemode || 'Unknown'}\``, inline: true },
                        { name: '🗺️ Map Name', value: `\`${data.mapname || 'San Andreas'}\``, inline: true },
                        { name: '⚡ Status', value: '`Online`', inline: true }
                    );

                if (config.bot.banner) {
                    embed.setImage(config.bot.banner);
                }
            }

            embed.setFooter({
                text: `${config.bot.name} • Live Query`,
                iconURL: config.bot.logo || undefined
            });

            const refreshButton = new ButtonBuilder()
                .setCustomId(`serverinfo_refresh_${interaction.id}`)
                .setLabel('Refresh Status')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled);

            const row = new ActionRowBuilder().addComponents(refreshButton);

            return { embeds: [embed], components: [row] };
        };

        // Initial query attempt
        let serverData = null;
        try {
            serverData = await queryServer();
        } catch {
            serverData = null;
        }

        const replyMessage = await interaction.editReply(buildResponse(serverData));

        // Create component collector for the Refresh button (active for 60 seconds)
        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000
        });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({
                    content: 'You cannot use this control.',
                    ephemeral: true
                });
            }

            let refreshedData = null;
            try {
                refreshedData = await queryServer();
            } catch {
                refreshedData = null;
            }

            await btnInteraction.update(buildResponse(refreshedData));
        });

        collector.on('end', async () => {
            // Disable button after interaction timeout expires
            await interaction.editReply(buildResponse(serverData, true)).catch(() => {});
        });
    }
};