module.exports = {
    bot: {
        name: process.env.BOT_NAME || 'SA-MP Link',
        logo: process.env.LOGO_LINK || null,
        banner: process.env.BANNER_LINK || null,
    },
    server: {
        ip: process.env.SERVER_IP || '127.0.0.1:7777',
    },
    colors: {
        primary: 0x3498db,
        success: 0x2ecc71,
        warning: 0xf1c40f,
        danger: 0xe74c3c,
    }
};