
const statusList = document.getElementById('statusList');
const startButton = document.getElementById('startButton');
const exportButton = document.getElementById('exportButton');
const searchInput = document.getElementById('searchInput');
const summary = document.getElementById('summary');

const ws = new WebSocket(`ws://${window.location.host}`);

let allStatuses = {};

const statusMap = {
    pending: '待处理',
    in_progress: '登录中',
    success: '登录成功',
    failed: '登录失败',
    retrying: '重试中',
    offline: '已下线'
};

ws.onopen = () => {
    console.log('已连接到服务器');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'initialState':
        case 'statusUpdate':
            allStatuses = data.payload;
            renderList();
            break;
    }
};

function renderList() {
    const searchTerm = searchInput.value.toLowerCase();
    statusList.innerHTML = ''; // 清空列表
    let successCount = 0;
    let failedCount = 0;
    let totalCount = 0;

    const filteredUsers = Object.keys(allStatuses).filter(username => 
        username.toLowerCase().includes(searchTerm)
    );

    for (const username of filteredUsers) {
        const user = allStatuses[username];
        const listItem = document.createElement('div');
        listItem.className = `list-item status-${user.status}`;
        listItem.innerHTML = `
            <span class="username">${username}</span>
            <span class="status">${statusMap[user.status] || user.status}</span>
            ${user.retries > 0 ? `<span class="retries">重试: ${user.retries}</span>` : ''}
        `;
        statusList.appendChild(listItem);
    }

    // 更新统计信息
    totalCount = Object.keys(allStatuses).length;
    const completedCount = Object.values(allStatuses).filter(u => u.status === 'success' || u.status === 'failed' || u.status === 'offline').length;
    failedCount = Object.values(allStatuses).filter(u => u.status === 'failed').length;

    if (totalCount > 0 && completedCount === totalCount) {
        summary.innerHTML = `<h3>任务完成</h3><p>总计: ${totalCount}, 失败: ${failedCount}</p>`;
        exportButton.disabled = failedCount === 0;
    }
}

function exportFailedUsers() {
    const failedUsers = Object.keys(allStatuses).filter(username => allStatuses[username].status === 'failed');
    if (failedUsers.length === 0) return;

    const blob = new Blob([failedUsers.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_users.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

startButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ action: 'start' }));
    startButton.disabled = true;
    startButton.textContent = '处理中...';
    exportButton.disabled = true;
    summary.innerHTML = '';
});

searchInput.addEventListener('input', renderList);
exportButton.addEventListener('click', exportFailedUsers);
