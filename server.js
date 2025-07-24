
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const MAX_CONCURRENT_BOTS = 2;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

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
            resolve(false); // Timeout is a failure
        }, 30000); // 30-second timeout for the bot process

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
            // Any error output is considered a failure
            clearTimeout(timeout);
            botProcess.kill();
            resolve(false);
        });

        botProcess.on('close', () => {
            clearTimeout(timeout);
            resolve(false); // If it closes without success signal, it's a failure
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
                // When done, remove from active workers
                const index = active_workers.indexOf(worker);
                if(index > -1) active_workers.splice(index, 1);
            });
            active_workers.push(worker);
        }
        await Promise.race(active_workers);
    }
    await Promise.all(active_workers); // Wait for the last batch to finish
}

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'initialState', payload: userStatus }));
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.action === 'start') {
            console.log('Starting batch login process...');
            startBatch();
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
