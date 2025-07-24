
const statusGrid = document.getElementById('statusGrid');
const startButton = document.getElementById('startButton');
const summary = document.getElementById('summary');

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
    console.log('Connected to server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'initialState':
        case 'statusUpdate':
            updateGrid(data.payload);
            break;
    }
};

function updateGrid(statuses) {
    statusGrid.innerHTML = ''; // Clear the grid
    let successCount = 0;
    let failedCount = 0;

    for (const username in statuses) {
        const user = statuses[username];
        const card = document.createElement('div');
        card.className = `card status-${user.status}`;
        card.innerHTML = `
            <div class="username">${username}</div>
            <div class="status">${user.status.replace('_', ' ')}</div>
            ${user.retries > 0 ? `<div class="retries">Retries: ${user.retries}</div>` : ''}
        `;
        statusGrid.appendChild(card);

        if (user.status === 'success') successCount++;
        if (user.status === 'failed') failedCount++;
    }

    // Update summary
    const totalUsers = Object.keys(statuses).length;
    if (totalUsers > 0 && (successCount + failedCount === totalUsers)) {
        summary.innerHTML = `
            <h3>Batch Complete</h3>
            <p>Successful: ${successCount}</p>
            <p>Failed: ${failedCount}</p>
        `;
    }
}

startButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ action: 'start' }));
    startButton.disabled = true;
    startButton.textContent = 'Processing...';
    summary.innerHTML = ''; // Clear summary on start
});
