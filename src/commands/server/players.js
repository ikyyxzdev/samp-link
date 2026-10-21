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

const PLAYERS_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('players')
        .setDescription('Displays a list of currently connected players, scores, and pings.'),

    /**
     * Executes the players command.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();

        let currentPage = 0;
        let serverData = null;

        /**
         * Formats player array into an aligned monospace table
         * @param {Array<object>} playerList 
         * @returns {string} Formatted code block
         */
        const formatPlayerTable = (playerList) => {
            const header = 'ID  | Player Name          | Score | Ping\n' +
                           '----+----------------------+-------+------';
            const rows = playerList.map(p => {
                const id = String(p.id ?? '-').padEnd(3, ' ');
                const name = String(p.name ?? 'Unknown').slice(0, 20).padEnd(20, ' ');
                const score = String(p.score ?? 0).padEnd(5, ' ');
                const ping = `${p.ping ?? 0}ms`.padEnd(5, ' ');
                return `${id} \vert{}${name} | ${score} \vert{}${ping}`;
            });

            return `\`\`\`asciidoc\n${header}\n${rows.join('\n')}\n\`\`\``;
        };

        /**
         * Builds the embed and pagination buttons based on current state
         * @param {object|null} data - Live query data
         * @param {number} page - Active page index
         * @param {boolean} disabledAll - Disables all controls when interaction expires
         */
        const buildResponse = (data, page, disabledAll = false) => {
            const embed = new EmbedBuilder().setTimestamp();

            if (config.bot.logo) {
                embed.setThumbnail(config.bot.logo);
            }

            // Case 1: Server is unreachable / offline
            if (!data) {
                embed
                    .setTitle(`🔴 ${config.bot.name} - Server Offline`)
                    .setColor(config.colors.danger)
                    .setDescription('Unable to query the server. The SA-MP server appears to be offline or unreachable.')
                    .addFields({ name: '🌐 Server Address', value: `\`${config.server.ip}\`` });

                const refreshBtn = new ButtonBuilder()
                    .setCustomId(`players_refresh_${interaction.id}`)
                    .setLabel('Retry Query')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabledAll);

                return { embeds: [embed], components: [new ActionRowBuilder().addComponents(refreshBtn)] };
            }

            const players = Array.isArray(data.players) ? data.players : [];
            const totalPlayers = players.length;
            const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE) || 1;
            const validPage = Math.min(Math.max(page, 0), totalPages - 1);

            embed
                .setTitle(`👥 ${data.hostname || config.bot.name} - Player Directory`)
                .setColor(config.colors.primary)
                .setFooter({
                    text: `Page ${validPage + 1} of ${totalPages} • Total Players: ${totalPlayers} • ${config.bot.name}`,
                    iconURL: config.bot.logo || undefined
                });

            // Case 2: Server is online but has 0 players
            if (totalPlayers === 0) {
                embed.setDescription('There are currently no players online.');
            } else {
                // Slice players for the active page
                const startIndex = validPage * PLAYERS_PER_PAGE;
                const pagePlayers = players.slice(startIndex, startIndex + PLAYERS_PER_PAGE);

                embed.setDescription(formatPlayerTable(pagePlayers));
            }

            // Navigation and action buttons
            const prevButton = new ButtonBuilder()
                .setCustomId(`players_prev_${interaction.id}`)
                .setLabel('Previous')
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabledAll || validPage === 0);

            const nextButton = new ButtonBuilder()
                .setCustomId(`players_next_${interaction.id}`)
                .setLabel('Next')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabledAll || validPage >= totalPages - 1);

            const refreshButton = new ButtonBuilder()
                .setCustomId(`players_refresh_${interaction.id}`)
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabledAll);

            const row = new ActionRowBuilder().addComponents(prevButton, nextButton, refreshButton);

            return { embeds: [embed], components: [row] };
        };

        // Initial fetch
        try {
            serverData = await queryServer();
        } catch {
            serverData = null;
        }

        const replyMessage = await interaction.editReply(buildResponse(serverData, currentPage));

        // Component collector for buttons (60-second window)
        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000
        });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({
                    content: 'You are not authorized to use these navigation controls.',
                    ephemeral: true
                });
            }

            const customId = btnInteraction.customId;

            if (customId.startsWith(`players_prev_`)) {
                currentPage = Math.max(0, currentPage - 1);
            } else if (customId.startsWith(`players_next_`)) {
                currentPage++;
            } else if (customId.startsWith(`players_refresh_`)) {
                try {
                    serverData = await queryServer();
                } catch {
                    serverData = null;
                }
            }

            await btnInteraction.update(buildResponse(serverData, currentPage));
        });

        collector.on('end', async () => {
            await interaction.editReply(buildResponse(serverData, currentPage, true)).catch(() => {});
        });
    }
};