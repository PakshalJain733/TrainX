const key = 'AQ.Ab8RN6LtJ2YI4XDAJ9Z1ofv0MSpB6dXMFA_Ts5A7nJROsqvXeQ';
const models = ['gemini-3.1-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

for (const model of models) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Ask a short JavaScript interview question. JSON only: {"question":"...","topic":"...","hint":"..."}' }] }] })
    });
    const d = await r.json();
    console.log(`\n===== ${model} (HTTP ${r.status}) =====`);
    console.log(JSON.stringify(d).slice(0, 400));
    if (r.ok) {
      console.log('\n✅ WORKING MODEL:', model);
      break;
    }
  } catch(e) {
    console.log(`${model} ERROR:`, e.message);
  }
}
