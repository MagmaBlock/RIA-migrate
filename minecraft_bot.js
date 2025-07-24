const mineflayer = require('mineflayer');

const config = {
    host: '192.168.0.113',
    port: 25565,
    username: process.argv[2] || 'TestPlayer',
    version: '1.20.4',
    auth: 'offline'
};

const bot = mineflayer.createBot(config);

bot.on('spawn', () => {
    console.log('LOGIN_SUCCESS');
    // The bot will automatically disconnect after 10 seconds.
    setTimeout(() => {
        bot.quit();
    }, 10000);
});

bot.on('kicked', (reason) => {
    console.log('LOGIN_FAILURE');
    process.exit(1);
});

bot.on('error', (err) => {
    console.log('LOGIN_FAILURE');
    process.exit(1);
});

// Gracefully handle process termination signals
process.on('SIGINT', () => {
    bot.quit();
    process.exit(0);
});

process.on('SIGTERM', () => {
    bot.quit();
    process.exit(0);
});