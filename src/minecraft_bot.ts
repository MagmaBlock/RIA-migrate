import mineflayer from 'mineflayer';

export function loginBot(username: string): Promise<boolean> {
    return new Promise((resolve) => {
        const config: mineflayer.BotOptions = {
            host: 'localhost',
            port: 26610,
            username: username,
            version: '1.20.4',
            auth: 'offline',
            checkTimeoutInterval: 5000,
        };

        const bot = mineflayer.createBot(config);
        let hasResolved = false;

        const resolveOnce = (result: boolean) => {
            if (hasResolved) return;
            hasResolved = true;
            
            // 移除可能会导致提前退出的监听器
            bot.removeListener('kicked', onKick);
            bot.removeListener('error', onFail);
            bot.removeListener('end', onEnd);

            resolve(result);
        };

        const onSpawn = () => {
            console.log(`[Bot] ${username} 成功登录并进入游戏世界。`);
            resolveOnce(true);

            bot.chat(`Hello, I'm ${username}! I will be online for 10 seconds.`);
            setTimeout(() => {
                console.log(`[Bot] ${username} 任务完成，主动下线。`);
                bot.quit();
            }, 10000);
        };

        const onFail = (err: Error) => {
            if (!err.message.includes('ECONNREFUSED') && !err.message.includes('ETIMEDOUT')) {
                console.error(`[Bot] ${username} 登录时发生错误:`, err.message);
            }
            resolveOnce(false);
            bot.end();
        };

        const onKick = (reason: string) => {
            console.log(`[Bot] ${username} 被服务器踢出: ${reason}`);
            resolveOnce(false);
            bot.end();
        };
        
        const onEnd = () => {
            if (!hasResolved) {
                console.log(`[Bot] ${username} 未能进入游戏就断开了连接。`);
                resolveOnce(false);
            }
        };

        bot.once('spawn', onSpawn);
        bot.once('kicked', onKick);
        bot.once('error', onFail);
        bot.once('end', onEnd);
    });
}