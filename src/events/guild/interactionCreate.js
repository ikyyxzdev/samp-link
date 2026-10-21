const { 
    Events, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { query } = require('../../database');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * Handles all interactions (Slash Commands, Buttons, Modals)
     * @param {import('discord.js').Interaction} interaction 
     */
    async execute(interaction) {
        // ==========================================
        // 1. Slash Command Router
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, interaction.client);
            } catch (error) {
                console.error(`[ERROR] Command execution failure: ${interaction.commandName}`, error);
                const reply = { content: 'An unexpected error occurred while executing this command.', ephemeral: true };
                if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
                else await interaction.reply(reply);
            }
            return;
        }

        // ==========================================
        // 2. Button Interaction: Trigger Registration Modal
        // ==========================================
        if (interaction.isButton() && interaction.customId === 'btn_ucp_register_init') {
            const modal = new ModalBuilder()
                .setCustomId('modal_ucp_register')
                .setTitle('UCP Account Registration');

            const ucpInput = new TextInputBuilder()
                .setCustomId('input_ucp_name')
                .setLabel('Desired UCP Username')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., John99 (letters & numbers, min 4 chars)')
                .setMinLength(4)
                .setMaxLength(24)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(ucpInput);
            modal.addComponents(row);

            return await interaction.showModal(modal);
        }

        // ==========================================
        // 3. Modal Submission: Process Registration Flow
        // ==========================================
        if (interaction.isModalSubmit() && interaction.customId === 'modal_ucp_register') {
            await interaction.deferReply({ ephemeral: true });

            const ucpName = interaction.fields.getTextInputValue('input_ucp_name').trim();

            // Validation: Letters and numbers only (no spaces/symbols), length 4-24
            const isAlphanumeric = /^[a-zA-Z0-9]{4,24}$/.test(ucpName);
            const hasLetter = /[a-zA-Z]/.test(ucpName);

            if (!isAlphanumeric || !hasLetter) {
                return interaction.editReply({
                    content: '❌ **Invalid Username**: Must be at least 4 characters long, contain only letters and numbers (no spaces or special characters), and cannot be numbers only.'
                });
            }

            // Check duplicate UCP name in MySQL/MariaDB
            try {
                const checkSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE LOWER(\`${config.database.colNameUcp}\`) = LOWER(?) LIMIT 1`;
                const existing = await query(checkSql, [ucpName]);

                if (existing && existing.length > 0) {
                    return interaction.editReply({
                        content: `⚠️ The username **${ucpName}** is already registered. Please choose a different name.`
                    });
                }
            } catch (dbError) {
                console.error('[DATABASE ERROR] Failed to check duplicate UCP name:', dbError);
                return interaction.editReply({
                    content: '⚠️ Database connection error while validating your username. Please contact an administrator.'
                });
            }

            // Generate 6-digit numeric verification code
            const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Insert into Database
            try {
                const insertSql = `INSERT INTO \`${config.database.tableUcp}\` (\`${config.database.colNameUcp}\`, \`${config.database.colVerifyCode}\`) VALUES (?, ?)`;
                await query(insertSql, [ucpName, verifyCode]);
            } catch (insertError) {
                console.error('[DATABASE ERROR] Failed to insert UCP record:', insertError);
                return interaction.editReply({
                    content: '⚠️ Failed to store your UCP account into the database. Please try again later.'
                });
            }

            // Auto Assign Role (UCP_ROLE)
            if (config.roles.ucp && interaction.member) {
                try {
                    await interaction.member.roles.add(config.roles.ucp);
                } catch (roleError) {
                    console.warn(`[WARNING] Could not assign UCP role to ${interaction.user.tag}:`, roleError.message);
                }
            }

            // Auto Update Member Nickname ("Verifed - Username")
            if (interaction.member) {
                try {
                    const formattedNickname = `${config.ucp.namePrefix} -${ucpName}`.slice(0, 32);
                    await interaction.member.setNickname(formattedNickname);
                } catch (nickError) {
                    console.warn(`[WARNING] Could not update nickname for ${interaction.user.tag} (check role hierarchy):`, nickError.message);
                }
            }

            // Load DM Template from JSON
            const dmJsonPath = path.join(__dirname, '..', '..', 'text', 'registerdm.json');
            let dmData = {
                title: '🔐 UCP Verification Code',
                description: 'Hello **{USER_TAG}**!\nYour code for **{UCP_NAME}** is below.',
                code_field_title: 'Verification Code',
                footer: '{BOT_NAME}'
            };

            if (fs.existsSync(dmJsonPath)) {
                try {
                    dmData = JSON.parse(fs.readFileSync(dmJsonPath, 'utf-8'));
                } catch (e) {
                    console.error('[ERROR] Failed to parse registerdm.json:', e);
                }
            }

            // Build DM Embed
            const dmEmbed = new EmbedBuilder()
                .setTitle(dmData.title)
                .setDescription(
                    dmData.description
                        .replace(/{USER_TAG}/g, interaction.user.tag)
                        .replace(/{UCP_NAME}/g, ucpName)
                        .replace(/{BOT_NAME}/g, config.bot.name)
                )
                .addFields({
                    name: dmData.code_field_title || 'Verification Code',
                    value: `\`\`\`${verifyCode}\`\`\``
                })
                .setColor(config.colors.primary)
                .setFooter({
                    text: dmData.footer.replace(/{BOT_NAME}/g, config.bot.name),
                    iconURL: config.bot.logo || undefined
                })
                .setTimestamp();

            if (config.bot.logo) dmEmbed.setThumbnail(config.bot.logo);

            // Attempt to deliver DM
            let dmSuccess = false;
            try {
                await interaction.user.send({ embeds: [dmEmbed] });
                dmSuccess = true;
            } catch {
                dmSuccess = false;
            }

            if (dmSuccess) {
                return interaction.editReply({
                    content: `✅ UCP **${ucpName}** successfully registered! Role assigned, nickname updated, and your 6-digit verification code has been sent directly to your DMs.`
                });
            } else {
                return interaction.editReply({
                    content: `⚠️ UCP **${ucpName}** registered and role assigned, but we couldn't send your code via DM. Please enable **Direct Messages** from server members in your Discord privacy settings.`
                });
            }
        }
    }
};