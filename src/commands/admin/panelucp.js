const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panelucp')
        .setDescription('Deploys the UCP registration panel in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * Executes the panelucp command.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        // Strict Authorization: Check if user has Founder Role or is Server Owner
        const isOwner = interaction.guild?.ownerId === interaction.user.id;
        const hasFounderRole = config.roles.founder && interaction.member.roles.cache.has(config.roles.founder);

        if (!isOwner && !hasFounderRole) {
            return interaction.reply({
                content: '⛔ Access Denied: This command is strictly restricted to Server Founders.',
                ephemeral: true
            });
        }

        // Load content template from JSON
        const jsonPath = path.join(__dirname, '..', '..', 'text', 'registerucp.json');

        if (!fs.existsSync(jsonPath)) {
            return interaction.reply({
                content: '⚠️ Configuration error: `src/text/registerucp.json` was not found.',
                ephemeral: true
            });
        }

        let panelData;
        try {
            const rawContent = fs.readFileSync(jsonPath, 'utf-8');
            panelData = JSON.parse(rawContent);
        } catch (error) {
            console.error('[ERROR] Failed to parse registerucp.json:', error);
            return interaction.reply({
                content: '⚠️ Failed to read panel content. Please check the JSON syntax in `registerucp.json`.',
                ephemeral: true
            });
        }

        // Interpolate placeholder variables
        const parsedDescription = panelData.description.replace(/{BOT_NAME}/g, config.bot.name);
        const parsedFooter = panelData.footer.replace(/{BOT_NAME}/g, config.bot.name);

        // Build Embed
        const embed = new EmbedBuilder()
            .setTitle(panelData.title)
            .setDescription(parsedDescription)
            .setColor(config.colors.primary)
            .setFooter({ text: parsedFooter, iconURL: config.bot.logo || undefined })
            .setTimestamp();

        if (config.bot.logo) {
            embed.setThumbnail(config.bot.logo);
        }

        if (config.bot.banner) {
            embed.setImage(config.bot.banner);
        }

        if (Array.isArray(panelData.fields)) {
            for (const field of panelData.fields) {
                embed.addFields({ name: field.name, value: field.value });
            }
        }

        // Build Action Button
        const registerButton = new ButtonBuilder()
            .setCustomId('btn_ucp_register_init')
            .setLabel(panelData.button?.label || 'Register UCP')
            .setEmoji(panelData.button?.emoji || '📝')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(registerButton);

        // Post panel to channel and confirm to administrator
        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ UCP registration panel has been successfully posted to this channel.',
            ephemeral: true
        });
    }
};