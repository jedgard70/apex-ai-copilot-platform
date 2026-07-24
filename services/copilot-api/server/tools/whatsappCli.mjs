const [,, to, ...messageParts] = process.argv;
const message = messageParts.join(' ');

if (!to || !message) {
  console.error('Usage: node whatsappCli.mjs <phone_number> "<message>"');
  process.exit(1);
}

// Em ambiente local, a porta padrão é 3000. No Vercel, a URL base é diferente.
// Para rodar como CLI no servidor local, usamos localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function send() {
  try {
    // Usamos o fetch nativo do Node.js (Node 18+)
    const res = await fetch(`${API_URL}/api/notify/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message, source: 'cli-agent' })
    });
    const data = await res.json();
    console.log(JSON.stringify(data));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
  }
}

send();
