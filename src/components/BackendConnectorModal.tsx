import React, { useState } from 'react';
import { X, Check, Copy, Terminal, ExternalLink, Code2, Server } from 'lucide-react';

interface BackendConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customBackendUrl: string;
  onSaveCustomBackendUrl: (url: string) => void;
  isCustomBackendActive: boolean;
  onToggleCustomBackend: (active: boolean) => void;
}

export const BackendConnectorModal: React.FC<BackendConnectorModalProps> = ({
  isOpen,
  onClose,
  customBackendUrl,
  onSaveCustomBackendUrl,
  isCustomBackendActive,
  onToggleCustomBackend
}) => {
  const [urlInput, setUrlInput] = useState(customBackendUrl || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'guide' | 'code' | 'schema'>('endpoints');
  const [testEndpoint, setTestEndpoint] = useState<'/api/health' | '/api/busarrival'>('/api/busarrival');
  const [testBusStopCode, setTestBusStopCode] = useState('83139');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const runEndpointTest = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const url = testEndpoint === '/api/health' 
        ? '/api/health' 
        : `/api/busarrival?BusStopCode=${encodeURIComponent(testBusStopCode || '83139')}`;
      const res = await fetch(url);
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setTestResponse(JSON.stringify({ error: 'Network error or endpoint not reachable', details: String(err) }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  const expressSnippet = `// server.ts - Example Express proxy for LTA DataMall v3
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const LTA_API_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

app.get('/api/bus-arrivals', async (req, res) => {
  try {
    const { BusStopCode, ServiceNo } = req.query;
    if (!BusStopCode) {
      return res.status(400).json({ error: 'BusStopCode query parameter is required' });
    }

    const query = new URLSearchParams({ BusStopCode: String(BusStopCode) });
    if (ServiceNo) query.append('ServiceNo', String(ServiceNo));

    const response = await fetch(\`\${LTA_API_URL}?\${query.toString()}\`, {
      headers: {
        AccountKey: process.env.LTA_DATAMALL_KEY || '',
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'LTA API responded with error' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch LTA bus arrivals' });
  }
});

app.listen(3000, () => console.log('Transit backend ready on port 3000'));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(expressSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveCustomBackendUrl(urlInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Backend Connection Setup
              </h3>
              <p className="text-xs text-slate-400">
                Plug in your Singapore LTA DataMall proxy or custom backend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-4 px-5 border-b border-slate-800 bg-slate-950/30 text-xs font-medium">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'endpoints'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Serverless API (/api)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Connection Setup
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Express Proxy Snippet
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            LTA DataMall Schema
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Serverless Function Endpoints (/api)</span>
                  <span className="text-[10px] font-mono-tabular bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Active in root /api
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The serverless handlers are located in <code className="text-emerald-400 font-mono">/api/health.ts</code> and <code className="text-emerald-400 font-mono">/api/busarrival.ts</code>. You can test live queries right now:
                </p>
              </div>

              {/* Endpoint Selector & Tester */}
              <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Endpoint</label>
                    <select
                      value={testEndpoint}
                      onChange={(e) => setTestEndpoint(e.target.value as '/api/health' | '/api/busarrival')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="/api/busarrival">GET /api/busarrival</option>
                      <option value="/api/health">GET /api/health</option>
                    </select>
                  </div>

                  {testEndpoint === '/api/busarrival' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Bus Stop Code</label>
                      <input
                        type="text"
                        value={testBusStopCode}
                        onChange={(e) => setTestBusStopCode(e.target.value)}
                        placeholder="e.g. 83139 or 01012"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate">
                    {testEndpoint === '/api/health' 
                      ? '/api/health' 
                      : `/api/busarrival?BusStopCode=${testBusStopCode || '83139'}`}
                  </span>
                  <button
                    onClick={runEndpointTest}
                    disabled={isTesting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>{isTesting ? 'Fetching...' : 'Send Live Request'}</span>
                  </button>
                </div>

                {testResponse && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Response JSON:</span>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 leading-relaxed">
                      {testResponse}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-700/30 rounded-xl space-y-1">
                <span className="font-semibold text-amber-300 block">Adding Your LTA AccountKey</span>
                <p className="text-slate-400 text-[11px]">
                  When ready, set <code className="text-amber-300 font-mono">LTA_ACCOUNT_KEY=&quot;your_key&quot;</code> in your environment or secrets. The serverless function will immediately forward requests to <code className="text-slate-300 font-mono">https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival</code> with <code className="text-slate-300 font-mono">AccountKey</code> header.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-700/40 rounded-xl space-y-2">
                <span className="font-semibold text-emerald-300 block">
                  Current Frontend Mode: Realistic Simulation Active
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The frontend is currently powered by a real-time simulation engine generating authentic LTA DataMall v3 timings, GPS coordinates, bus deck types, and crowd levels for all Singapore bus stops.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-white">
                  Custom Backend Base URL (When you add your server):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. /api/bus-arrivals or https://your-backend.run.app"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Save URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  When enabled, the frontend will issue real fetch requests to this URL passing <code className="text-emerald-400 font-mono">?BusStopCode=01012</code>.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                <div>
                  <span className="text-xs font-medium text-white block">Switch to Custom Backend</span>
                  <span className="text-[11px] text-slate-500">Bypasses simulated feed and uses your API</span>
                </div>
                <button
                  onClick={() => onToggleCustomBackend(!isCustomBackendActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isCustomBackendActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isCustomBackendActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Add this proxy route to your backend to avoid CORS with LTA DataMall:
                </span>
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {expressSnippet}
              </pre>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Need an LTA DataMall Key?</span>
                  <span className="text-[11px] text-slate-400">Apply instantly for a free API key at Land Transport Authority DataMall.</span>
                </div>
                <a
                  href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Request Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block">
                Standard LTA DataMall v3 JSON response structure supported by this UI:
              </span>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1 overflow-x-auto">
                <p>&#123;</p>
                <p className="pl-4">&quot;BusStopCode&quot;: &quot;01012&quot;,</p>
                <p className="pl-4">&quot;Services&quot;: [</p>
                <p className="pl-8">&#123;</p>
                <p className="pl-12">&quot;ServiceNo&quot;: &quot;190&quot;,</p>
                <p className="pl-12">&quot;Operator&quot;: &quot;SMRT&quot;,</p>
                <p className="pl-12">&quot;NextBus&quot;: &#123;</p>
                <p className="pl-16">&quot;EstimatedArrival&quot;: &quot;2026-10-15T06:45:12+08:00&quot;,</p>
                <p className="pl-16">&quot;Latitude&quot;: &quot;1.2968&quot;,</p>
                <p className="pl-16">&quot;Longitude&quot;: &quot;103.8529&quot;,</p>
                <p className="pl-16">&quot;Load&quot;: &quot;SEA&quot;, <span className="text-slate-500">// SEA | SDA | LSD</span></p>
                <p className="pl-16">&quot;Feature&quot;: &quot;WAB&quot;, <span className="text-slate-500">// WAB | NORM</span></p>
                <p className="pl-16">&quot;Type&quot;: &quot;DD&quot; <span className="text-slate-500">// SD | DD | BD</span></p>
                <p className="pl-12">&#125;,</p>
                <p className="pl-12">&quot;NextBus2&quot;: &#123; ... &#125;,</p>
                <p className="pl-12">&quot;NextBus3&quot;: &#123; ... &#125;</p>
                <p className="pl-8">&#125;</p>
                <p className="pl-4">]</p>
                <p>&#125;</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
