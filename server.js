
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 核心参数调整
const MAX_CONCURRENT_BOTS = 1; // 并发数改为 1
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 秒

app.use(express.static(path.join(__dirname, 'public')));

let users = [];
let userStatus = {}; // { username: { status, retries } }

function readUserList() {
    const filePath = path.join(__dirname, 'userlist.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
}

function updateAllClients() {
    const statusData = JSON.stringify({ type: 'statusUpdate', payload: userStatus });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(statusData);
        }
    });
}

function runBot(username) {
    return new Promise((resolve) => {
        const botProcess = spawn('node', ['minecraft_bot.js', username]);

        const timeout = setTimeout(() => {
            botProcess.kill();
            resolve(false); // 超时即失败
        }, 30000); // 30 秒机器人进程超时

        botProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('LOGIN_SUCCESS')) {
                clearTimeout(timeout);
                resolve(true);
            } else if (output.includes('LOGIN_FAILURE')) {
                clearTimeout(timeout);
                botProcess.kill();
                resolve(false);
            }
        });

        botProcess.stderr.on('data', () => {
            clearTimeout(timeout);
            botProcess.kill();
            resolve(false);
        });

        botProcess.on('close', () => {
            clearTimeout(timeout);
            resolve(false); // 未发出成功信号就关闭，视为失败
        });
    });
}

async function processUser(username) {
    userStatus[username] = { status: 'in_progress', retries: 0 };
    updateAllClients();

    for (let i = 0; i < MAX_RETRIES; i++) {
        const success = await runBot(username);
        if (success) {
            userStatus[username].status = 'success';
            updateAllClients();
            // 10秒后更新为“已下线”状态
            setTimeout(() => {
                userStatus[username].status = 'offline';
                updateAllClients();
            }, 10000);
            return;
        }
        userStatus[username].retries = i + 1;
        if (i < MAX_RETRIES - 1) {
            userStatus[username].status = 'retrying';
            updateAllClients();
            await new Promise(res => setTimeout(res, RETRY_DELAY));
        } else {
            userStatus[username].status = 'failed';
            updateAllClients();
        }
    }
}

async function startBatch() {
    users = readUserList();
    userStatus = users.reduce((acc, user) => {
        acc[user] = { status: 'pending', retries: 0 };
        return acc;
    }, {});
    updateAllClients();

    const queue = [...users];
    const active_workers = [];

    while(queue.length > 0) {
        while(active_workers.length < MAX_CONCURRENT_BOTS && queue.length > 0) {
            const username = queue.shift();
            const worker = processUser(username).then(() => {
                const index = active_workers.indexOf(worker);
                if(index > -1) active_workers.splice(index, 1);
            });
            active_workers.push(worker);
        }
        await Promise.race(active_workers);
    }
    await Promise.all(active_workers); // 等待最后一批完成
}

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'initialState', payload: userStatus }));
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.action === 'start') {
            console.log('开始批量登录流程...');
            startBatch();
        }
    });
});

server.listen(3000, () => {
    console.log('服务器正在 http://localhost:3000 运行');
});
