import type { IncomingMessage, ServerResponse } from 'http';

interface ServerlessRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: unknown;
  url?: string;
  headers: IncomingMessage['headers'] & {
    accountkey?: string;
    'x-account-key'?: string;
  };
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

const LTA_BUS_ARRIVAL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // Set CORS headers
  res.setHeader?.('Access-Control-Allow-Credentials', 'true');
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, AccountKey, Authorization'
  );

  // Handle preflight OPTIONS request
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

  // Parse query parameters from URL or serverless req.query
  let busStopCode = '83139'; // Default as requested in prompt
  let serviceNo = '';

  if (req.query && typeof req.query === 'object') {
    const qStop = req.query.BusStopCode || req.query.busStopCode || req.query.stopId;
    if (qStop && typeof qStop === 'string') {
      busStopCode = qStop.trim();
    }
    const qService = req.query.ServiceNo || req.query.serviceNo;
    if (qService && typeof qService === 'string') {
      serviceNo = qService.trim();
    }
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const qStop = parsedUrl.searchParams.get('BusStopCode') || parsedUrl.searchParams.get('busStopCode');
      if (qStop) busStopCode = qStop.trim();
      const qService = parsedUrl.searchParams.get('ServiceNo') || parsedUrl.searchParams.get('serviceNo');
      if (qService) serviceNo = qService.trim();
    } catch {
      // Use default
    }
  }

  // Retrieve AccountKey from environment or request header (do not hardcode)
  const accountKey = 
    process.env.LTA_ACCOUNT_KEY || 
    process.env.LTA_DATAMALL_KEY || 
    process.env.VITE_LTA_ACCOUNT_KEY || 
    (typeof req.headers?.accountkey === 'string' ? req.headers.accountkey : '') ||
    (typeof req.headers?.['x-account-key'] === 'string' ? req.headers['x-account-key'] : '');

  // If no key is set yet, return informative response
  if (!accountKey) {
    const noKeyResponse = {
      status: 'pending_configuration',
      message: 'LTA_ACCOUNT_KEY is not set. Please configure the LTA_ACCOUNT_KEY environment variable or pass an AccountKey header.',
      requestedBusStopCode: busStopCode,
      requestedServiceNo: serviceNo || null,
      targetEndpoint: `${LTA_BUS_ARRIVAL_ENDPOINT}?BusStopCode=${busStopCode}${serviceNo ? `&ServiceNo=${serviceNo}` : ''}`,
      documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html'
    };

    sendJson(res, 200, noKeyResponse);
    return;
  }

  // Construct upstream LTA DataMall request URL
  const queryParams = new URLSearchParams({ BusStopCode: busStopCode });
  if (serviceNo) {
    queryParams.append('ServiceNo', serviceNo);
  }
  const ltaUrl = `${LTA_BUS_ARRIVAL_ENDPOINT}?${queryParams.toString()}`;

  try {
    const response = await fetch(ltaUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorPayload = {
        error: `LTA DataMall API responded with status ${response.status}`,
        statusCode: response.status,
        details: errorText || response.statusText,
        busStopCode
      };

      sendJson(res, response.status, errorPayload);
      return;
    }

    const data = await response.json();
    sendJson(res, 200, data);
  } catch (error) {
    const errPayload = {
      error: 'Failed to connect to LTA DataMall v3 service',
      message: error instanceof Error ? error.message : String(error),
      busStopCode
    };

    sendJson(res, 502, errPayload);
  }
}
