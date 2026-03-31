const https = require('https');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-dangerously-allow-browser');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Legge il body raw dallo stream
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': req.headers['x-api-key'],
        'anthropic-version': req.headers['anthropic-version'],
        'anthropic-dangerously-allow-browser': 'true',
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).setHeader('Content-Type', 'application/json').end(data);
      });
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}