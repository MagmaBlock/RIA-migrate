const mineflayer = require('mineflayer');

// 配置
const config = {
    host: '192.168.0.113',
    port: 25565,
    username: process.argv[2] || 'TestPlayer',
    version: '1.20.4',
    auth: 'offline'  // 离线模式
};

console.log(`正在连接到 Minecraft 服务器...`);
console.log(`服务器: ${config.host}:${config.port}`);
console.log(`用户名: ${config.username}`);
console.log(`版本: ${config.version}`);

// 创建机器人
const bot = mineflayer.createBot(config);

// 连接成功
bot.on('login', () => {
    console.log(`✓ 成功登录! 用户: ${bot.username}`);
    console.log(`UUID: ${bot.uuid}`);
});

// 进入游戏
bot.on('spawn', () => {
    console.log('✓ 成功进入游戏世界!');
    console.log(`位置: x=${bot.entity.position.x.toFixed(2)}, y=${bot.entity.position.y.toFixed(2)}, z=${bot.entity.position.z.toFixed(2)}`);
    console.log('玩家现在在服务器中可见');
    console.log('按 Ctrl+C 断开连接');
});

// 聊天消息
bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`[聊天] ${username}: ${message}`);
});

// 错误处理
bot.on('error', (err) => {
    console.error('连接错误:', err.message);
});

// 断开连接
bot.on('end', () => {
    console.log('已断开与服务器的连接');
});

// 踢出处理
bot.on('kicked', (reason) => {
    console.log('被服务器踢出:', reason);
});

// 保持连接
process.on('SIGINT', () => {
    console.log('\n正在断开连接...');
    bot.quit();
    process.exit(0);
});