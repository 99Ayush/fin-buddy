import fetch from 'node-fetch';
const key = process.env.GEMINI_API_KEY; // set this in your .env file
const body = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: 'Say: AI is live!' }] }],
  generationConfig: { maxOutputTokens: 30 }
});
const resp = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
  { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body }
);
const j = await resp.json();
const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
console.log('Status:', resp.status, text ? 'REPLY: ' + text : 'ERR: ' + JSON.stringify(j).slice(0, 200));
