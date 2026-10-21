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

/**
 * Reads a JSON template file safely
 * @param {string} filename 
 * @param {object} defaultData 
 */
function loadJsonTemplate(filename, defaultData) {
    const filePath = path.join(__dirname, '..', '..', 'text', filename);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error(`[ERROR] Failed to parse ${filename}:`, e);
        }
    }
    return defaultData;
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

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
                console.error(`[ERROR] Command failure: ${interaction.commandName}`, error);
                const reply = { content: 'An unexpected error occurred while executing this command.', ephemeral: true };
                if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
                else await interaction.reply(reply);
            }
            return;
        }

        // ==========================================
        // 2. Button: Trigger Registration Modal
        // ==========================================
        if (interaction.isButton() && interaction.customId === 'btn_ucp_register_init') {
            const modal = new ModalBuilder()
                .setCustomId('modal_ucp_register')
                .setTitle('UCP Account Registration');

            const ucpInput = new TextInputBuilder()
                .setCustomId('input_ucp_name')
                .setLabel('Desired UCP Username')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., John99 (min 4 characters, letters & numbers)')
                .setMinLength(4)
                .setMaxLength(24)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(ucpInput));
            return await interaction.showModal(modal);
        }

        // ==========================================
        // 3. Button: Resend Code
        // ==========================================
        if (interaction.isButton() && interaction.customId === 'btn_ucp_resend_code') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const findSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE \`${config.database.colDiscordId}\` = ? LIMIT 1`;
                const users = await query(findSql, [interaction.user.id]);

                if (!users || users.length === 0) {
                    return interaction.editReply({
                        content: '❌ No UCP account is linked to your Discord account. Please register first.'
                    });
                }

                const ucpName = users[0][config.database.colNameUcp];
                const newCode = Math.floor(100000 + Math.random() * 900000).toString();

                const updateSql = `UPDATE \`${config.database.tableUcp}\` SET \`${config.database.colVerifyCode}\` = ? WHERE \`${config.database.colDiscordId}\` = ?`;
                await query(updateSql, [newCode, interaction.user.id]);

                const template = loadJsonTemplate('resendcodedm.json', {
                    title: '📩 Resent Verification Code',
                    description: 'Hello **{USER_TAG}**!\nYour code for UCP **{UCP_NAME}** is below.',
                    code_field_title: 'Verification Code',
                    footer: '{BOT_NAME}'
                });

                const embed = new EmbedBuilder()
                    .setTitle(template.title)
                    .setDescription(
                        template.description
                            .replace(/{USER_TAG}/g, interaction.user.tag)
                            .replace(/{UCP_NAME}/g, ucpName)
                            .replace(/{BOT_NAME}/g, config.bot.name)
                    )
                    .addFields({
                        name: template.code_field_title || 'Verification Code',
                        value: `\`\`\`${newCode}\`\`\``
                    })
                    .setColor(config.colors.primary)
                    .setFooter({ text: template.footer.replace(/{BOT_NAME}/g, config.bot.name), iconURL: config.bot.logo || undefined })
                    .setTimestamp();

                if (config.bot.logo) embed.setThumbnail(config.bot.logo);

                try {
                    await interaction.user.send({ embeds: [embed] });
                    return interaction.editReply({ content: '✅ A new verification code has been dispatched to your DMs.' });
                } catch {
                    return interaction.editReply({ content: '⚠️ Could not send DM. Please ensure your Direct Messages are open.' });
                }
            } catch (err) {
                console.error('[DATABASE ERROR] Resend code failed:', err);
                return interaction.editReply({ content: '⚠️ Database error while processing your resend request.' });
            }
        }

        // ==========================================
        // 4. Button: ReVerify Role & Nickname
        // ==========================================
        if (interaction.isButton() && interaction.customId === 'btn_ucp_reverify_role') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const findSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE \`${config.database.colDiscordId}\` = ? LIMIT 1`;
                const users = await query(findSql, [interaction.user.id]);

                if (!users || users.length === 0) {
                    return interaction.editReply({
                        content: '❌ No UCP account is linked to your Discord account. Please register first.'
                    });
                }

                const ucpName = users[0][config.database.colNameUcp];
                const member = interaction.member;

                if (config.roles.ucp && member) {
                    try {
                        await member.roles.add(config.roles.ucp);
                    } catch (rErr) {
                        console.warn('[WARNING] Failed to grant UCP role:', rErr.message);
                    }
                }

                if (member) {
                    try {
                        const targetNick = `${config.ucp.namePrefix} -${ucpName}`.slice(0, 32);
                        await member.setNickname(targetNick);
                    } catch (nErr) {
                        console.warn('[WARNING] Failed to sync nickname:', nErr.message);
                    }
                }

                return interaction.editReply({
                    content: `✅ Sync complete! Your UCP role and nickname (\`${config.ucp.namePrefix} - ${ucpName}\`) have been refreshed.`
                });
            } catch (err) {
                console.error('[DATABASE ERROR] ReVerify role failed:', err);
                return interaction.editReply({ content: '⚠️ Database error while re-verifying your role.' });
            }
        }

        // ==========================================
        // 5. Button: Reset Password
        // ==========================================
        if (interaction.isButton() && interaction.customId === 'btn_ucp_reset_pass') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const findSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE \`${config.database.colDiscordId}\` = ? LIMIT 1`;
                const users = await query(findSql, [interaction.user.id]);

                if (!users || users.length === 0) {
                    return interaction.editReply({
                        content: '❌ No UCP account is linked to your Discord account. Please register first.'
                    });
                }

                const ucpName = users[0][config.database.colNameUcp];
                const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

                // Build dynamic update statements
                const setClauses = [
                    `\`${config.database.colPassword}\` = ''`,
                    `\`${config.database.colVerifyCode}\` = ?`
                ];
                const queryParams = [resetCode];

                if (config.database.colSalt) {
                    setClauses.push(`\`${config.database.colSalt}\` = ''`);
                }

                queryParams.push(interaction.user.id);

                const resetSql = `UPDATE \`${config.database.tableUcp}\` SET ${setClauses.join(', ')} WHERE \`${config.database.colDiscordId}\` = ?`;
                await query(resetSql, queryParams);

                const template = loadJsonTemplate('resetpassworddm.json', {
                    title: '🔑 Password Reset & Recovery Code',
                    description: 'Hello **{USER_TAG}**!\nPassword hash cleared for **{UCP_NAME}**.',
                    code_field_title: 'Reset Verification Code',
                    footer: '{BOT_NAME}'
                });

                const embed = new EmbedBuilder()
                    .setTitle(template.title)
                    .setDescription(
                        template.description
                            .replace(/{USER_TAG}/g, interaction.user.tag)
                            .replace(/{UCP_NAME}/g, ucpName)
                            .replace(/{BOT_NAME}/g, config.bot.name)
                    )
                    .addFields({
                        name: template.code_field_title || 'Reset Code',
                        value: `\`\`\`${resetCode}\`\`\``
                    })
                    .setColor(config.colors.danger)
                    .setFooter({ text: template.footer.replace(/{BOT_NAME}/g, config.bot.name), iconURL: config.bot.logo || undefined })
                    .setTimestamp();

                if (config.bot.logo) embed.setThumbnail(config.bot.logo);

                try {
                    await interaction.user.send({ embeds: [embed] });
                    return interaction.editReply({
                        content: `✅ Password for UCP **${ucpName}** has been wiped. A new 6-digit reset code was dispatched to your DMs.`
                    });
                } catch {
                    return interaction.editReply({
                        content: `⚠️ Password wiped for UCP **${ucpName}**, but we could not deliver your code via DM. Please open your Discord DMs.`
                    });
                }
            } catch (err) {
                console.error('[DATABASE ERROR] Reset password failed:', err);
                return interaction.editReply({ content: '⚠️ Database error while processing your password reset.' });
            }
        }

        // ==========================================
        // 6. Modal Submission: UCP Registration
        // ==========================================
        if (interaction.isModalSubmit() && interaction.customId === 'modal_ucp_register') {
            await interaction.deferReply({ ephemeral: true });

            const ucpName = interaction.fields.getTextInputValue('input_ucp_name').trim();

            const isAlphanumeric = /^[a-zA-Z0-9]{4,24}$/.test(ucpName);
            const hasLetter = /[a-zA-Z]/.test(ucpName);

            if (!isAlphanumeric || !hasLetter) {
                return interaction.editReply({
                    content: '❌ **Invalid Username**: Must be at least 4 characters long, contain only letters and numbers (no spaces/symbols), and cannot be numbers only.'
                });
            }

            try {
                // Check if Discord is already linked
                const checkDiscordSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE \`${config.database.colDiscordId}\` = ? LIMIT 1`;
                const existingDiscord = await query(checkDiscordSql, [interaction.user.id]);

                if (existingDiscord && existingDiscord.length > 0) {
                    const registeredUcp = existingDiscord[0][config.database.colNameUcp];
                    return interaction.editReply({
                        content: `⚠️ Your Discord account is already linked to UCP **${registeredUcp}**.`
                    });
                }

                // Check duplicate UCP name
                const checkSql = `SELECT \`${config.database.colNameUcp}\` FROM \`${config.database.tableUcp}\` WHERE LOWER(\`${config.database.colNameUcp}\`) = LOWER(?) LIMIT 1`;
                const existing = await query(checkSql, [ucpName]);

                if (existing && existing.length > 0) {
                    return interaction.editReply({
                        content: `⚠️ The username **${ucpName}** is already registered. Please choose another name.`
                    });
                }

                // Generate code & insert record
                const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
                const insertSql = `INSERT INTO \`${config.database.tableUcp}\` (\`${config.database.colNameUcp}\`, \`${config.database.colVerifyCode}\`, \`${config.database.colDiscordId}\`) VALUES (?, ?, ?)`;
                await query(insertSql, [ucpName, verifyCode, interaction.user.id]);

                // Auto assign role & nickname
                if (config.roles.ucp && interaction.member) {
                    try {
                        await interaction.member.roles.add(config.roles.ucp);
                    } catch (rErr) {
                        console.warn('[WARNING] Failed to grant UCP role:', rErr.message);
                    }
                }

                if (interaction.member) {
                    try {
                        const targetNick = `${config.ucp.namePrefix} -${ucpName}`.slice(0, 32);
                        await interaction.member.setNickname(targetNick);
                    } catch (nErr) {
                        console.warn('[WARNING] Failed to set nickname:', nErr.message);
                    }
                }

                // Send DM
                const dmTemplate = loadJsonTemplate('registerdm.json', {
                    title: '🔐 UCP Verification Code',
                    description: 'Hello **{USER_TAG}**!\nYour code for **{UCP_NAME}** is below.',
                    code_field_title: 'Verification Code',
                    footer: '{BOT_NAME}'
                });

                const dmEmbed = new EmbedBuilder()
                    .setTitle(dmTemplate.title)
                    .setDescription(
                        dmTemplate.description
                            .replace(/{USER_TAG}/g, interaction.user.tag)
                            .replace(/{UCP_NAME}/g, ucpName)
                            .replace(/{BOT_NAME}/g, config.bot.name)
                    )
                    .addFields({
                        name: dmTemplate.code_field_title || 'Verification Code',
                        value: `\`\`\`${verifyCode}\`\`\``
                    })
                    .setColor(config.colors.primary)
                    .setFooter({ text: dmTemplate.footer.replace(/{BOT_NAME}/g, config.bot.name), iconURL: config.bot.logo || undefined })
                    .setTimestamp();

                if (config.bot.logo) dmEmbed.setThumbnail(config.bot.logo);

                try {
                    await interaction.user.send({ embeds: [dmEmbed] });
                    return interaction.editReply({
                        content: `✅ UCP **${ucpName}** successfully registered! Role assigned, nickname updated, and your 6-digit verification code has been sent to your DMs.`
                    });
                } catch {
                    return interaction.editReply({
                        content: `⚠️ UCP **${ucpName}** registered and role assigned, but we couldn't send your code via DM. Please open your Discord DMs.`
                    });
                }
            } catch (err) {
                console.error('[DATABASE ERROR] Registration failed:', err);
                return interaction.editReply({ content: '⚠️ Database error while processing registration.' });
            }
        }
    }
};