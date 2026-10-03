const http = require('http');
const { spawn } = require('child_process');
const WebSocket = globalThis.WebSocket;
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9340;
const outDir = 'C:\\Users\\Dhruvil\\.gemini\\antigravity-ide\\brain\\9d2c7b54-a210-4e99-916a-ccd8f77471b2';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function sendWs(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const msg = JSON.stringify({ id, method, params });
    const handler = (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id === id) {
        ws.removeEventListener('message', handler);
        if (resp.error) reject(resp.error);
        else resolve(resp.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function test() {
  const browserProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1500,900',
    'http://localhost:5173',
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  const pages = await getJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((p) => p.type === 'page' && !p.url.startsWith('chrome-extension')) || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  await sendWs(ws, 'Runtime.enable');
  await sendWs(ws, 'Page.enable');
  await sendWs(ws, 'Log.enable');
  await sendWs(ws, 'Network.enable');

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Network.requestWillBeSent') {
      if (msg.params.request.url.includes('/api/')) {
        console.log('API REQ:', msg.params.request.method, msg.params.request.url);
      }
    }
    if (msg.method === 'Network.responseReceived') {
      if (msg.params.response.url.includes('/api/')) {
        console.log('API RESP:', msg.params.response.status, msg.params.response.url);
      }
    }
    if (msg.method === 'Network.loadingFailed') {
      console.log('NET FAIL:', msg.params.errorText, msg.params.canceled);
    }
  });

  // Navigate to staff chat
  await sendWs(ws, 'Runtime.evaluate', {
    expression: `
      localStorage.setItem('ezqueue_demo_user', 'staff@demo.com');
      window.location.href = 'http://localhost:5173/staff/chat/c0000000-0000-0000-0000-000000000001';
    `,
  });

  // Wait 4 seconds for react to render and fetch
  await new Promise((r) => setTimeout(r, 4000));

  // Check state inside the page
  const evalResult = await sendWs(ws, 'Runtime.evaluate', {
    expression: `
      ({
        url: window.location.href,
        hasSpin: !!document.querySelector('.animate-spin'),
        bodyText: document.body.innerText.slice(0, 300),
      })
    `,
    returnByValue: true,
  });
  console.log('PAGE STATE:', evalResult.result.value);

  // Take screenshot
  const staffShot = await sendWs(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'staff_chat_workspace.png'), Buffer.from(staffShot.data, 'base64'));
  console.log('Saved staff_chat_workspace.png');

  ws.close();
  browserProc.kill();
}

test();
