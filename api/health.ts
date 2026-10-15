import type { IncomingMessage, ServerResponse } from 'http';

interface ServerlessRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: unknown;
  url?: string;
}

interface ServerlessResponse extends ServerResponse {
  status?: (statusCode: number) => ServerlessResponse;
  json?: (data: unknown) => void;
  send?: (data: unknown) => void;
}

function sendJson(res: ServerlessResponse, statusCode: number, data: unknown) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  if (typeof res.status === 'function') {
    res.status(statusCode);
  } else {
    res.statusCode = statusCode;
  }
  if (typeof res.json === 'function') {
    res.json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // Set CORS headers
  res.setHeader?.('Access-Control-Allow-Credentials', 'true');
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, AccountKey, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      res.status(200);
      res.end();
    } else {
      res.statusCode = 200;
      res.end();
    }
    return;
  }

  const hasLtaKey = Boolean(
    process.env.LTA_ACCOUNT_KEY || 
    process.env.LTA_DATAMALL_KEY || 
    process.env.VITE_LTA_ACCOUNT_KEY
  );

  const payload = {
    status: 'ok',
    service: 'lta-bus-arrival-serverless-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    ltaKeyConfigured: hasLtaKey,
    endpoints: {
      health: '/api/health',
      busArrival: '/api/busarrival?BusStopCode=83139'
    },
    documentation: 'https://datamall.lta.gov.sg/content/datamall/en/dynamic-data.html'
  };

  sendJson(res, 200, payload);
}
