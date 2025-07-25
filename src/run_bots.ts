import * as fs from 'fs';
import * as path from 'path';
import { loginBot } from './minecraft_bot';
import { TaskQueue } from './TaskQueue';

// 核心参数调整
const LOGIN_INTERVAL: number = 100; // 每个机器人登录之间的间隔时间 (毫秒)

function readUserList(): string[] {
    const filePath = path.join(__dirname, '../userlist.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
}

async function main() {
    const users = readUserList();
    console.log(`找到了 ${users.length} 个用户。`);

    const taskExecutor = async (task: { username: string, retries: number }): Promise<boolean> => {
        console.log(`[Executor] 正在尝试登录: ${task.username} (重试次数: ${task.retries})`);
        try {
            const success = await loginBot(task.username);
            if (success) {
                console.log(`[Executor] 登录成功: ${task.username}`);
                return true;
            } else {
                console.log(`[Executor] 登录失败: ${task.username}`);
                return false;
            }
        } catch (error) {
            console.error(`[Executor] 执行时发生严重错误: ${task.username}`, error);
            return false;
        }
    };

    const queue = new TaskQueue(taskExecutor, LOGIN_INTERVAL);

    const initialTasks = users.map(username => ({ username, retries: 0 }));
    queue.addMultipleTasks(initialTasks);
}

main();