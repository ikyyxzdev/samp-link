module.exports = {
    bot: {
        name: process.env.BOT_NAME || 'SA-MP Link',
        logo: process.env.LOGO_LINK || null,
        banner: process.env.BANNER_LINK || null,
    },
    server: {
        ip: process.env.SERVER_IP || '127.0.0.1:7777',
    },
    roles: {
        founder: process.env.FOUNDER_ROLE || '',
        admin: process.env.ADMIN_ROLE || '',
        ucp: process.env.UCP_ROLE || '',
    },
    ucp: {
        namePrefix: process.env.NAME_AFTER_REGISTER || 'Verifed',
    },
    database: {
        tableUcp: process.env.TABLE_UCP || 'players',
        colId: process.env.COLUMN_ID || 'id',
        colNameUcp: process.env.COLUMN_NAME_UCP || 'ucp_name',
        colVerifyCode: process.env.COLUMN_VERIFY_CODE || 'verify_code',
        colDiscordId: process.env.COLUMN_DISCORD_ID || 'discord_id',
        colPassword: process.env.COLUMN_PASSWORD || 'password',
        colSalt: process.env.COLUMN_SALT || '',
    },
    colors: {
        primary: 0x3498db,
        success: 0x2ecc71,
        warning: 0xf1c40f,
        danger: 0xe74c3c,
    }
};