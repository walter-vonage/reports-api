const input = document.getElementById('input');
const send = document.getElementById('send');
const messages = document.getElementById('messages');

function appendMessage(text, className) {
    const msg = document.createElement('div');
    msg.className = `message ${className}`;

    if (className === 'ai') {
        const icon = document.createElement('img');
        icon.src = '/ai.png';
        icon.alt = 'AI';
        icon.style.width = '40px';
        icon.style.height = '40px';
        icon.style.marginRight = '10px';
        icon.style.verticalAlign = 'middle';

        const span = document.createElement('span');
        span.innerText = text;

        msg.style.display = 'flex';
        msg.style.alignItems = 'center';
        msg.appendChild(icon);
        msg.appendChild(span);
    } else {
        msg.innerText = text;
    }

    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

send.onclick = () => {
    const question = input.value.trim();
    if (!question) return;
    appendMessage(question, 'user');
    input.value = '';

    setTimeout(async () => {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                filename: window.reportFilename || ''
            })
        });

        const data = await response.json();
        appendMessage(data.answer || 'No response', 'ai');
    }, 2000);
};

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send.click();
});

setTimeout(() => {
    appendMessage(`Hi there! I'm here to answer any questions about your last report`, 'ai');
}, 3000)