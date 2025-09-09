import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Example = {
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string; // e.g. /products
  body?: Record<string, any>;
  note?: string;
};

const API_BASE = 'http://localhost:5000/api/v1/sandbox';

export default function ApiWorkbench({ examples }: { examples: Example[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const ex = examples[activeIdx];

  const curl = useMemo(() => {
    const token = 'YOUR_ACCESS_TOKEN';
    const url = `${API_BASE}${ex.path}`;
    const parts = [
      `curl -X ${ex.method}`,
      `'${url}'`,
      `-H 'Authorization: Bearer ${token}'`,
      `-H 'Content-Type: application/json'`
    ];
    let cmd = parts.join(' \\\n  ');
    if (ex.body) {
      cmd += ` \\\n  -d '${JSON.stringify(ex.body)}'`;
    }
    return cmd;
  }, [activeIdx, examples]);

  const run = async () => {
    try {
      setRunning(true); setResult(null);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}${ex.path}`, {
        method: ex.method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: ex.body ? JSON.stringify(ex.body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      setResult({ status: res.status, json });
    } catch (e: any) {
      setResult({ error: e?.message || String(e) });
    } finally { setRunning(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Workbench</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap mb-3">
          {examples.map((e, i) => (
            <Button key={i} size="sm" variant={i===activeIdx? 'default':'outline'} onClick={()=> setActiveIdx(i)}>{e.title}</Button>
          ))}
        </div>
        {ex.note && <div className="text-sm text-gray-600 mb-2">{ex.note}</div>}
        <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs whitespace-pre-wrap">{curl}</pre>
        <div className="mt-3 flex gap-2">
          <Button onClick={()=> navigator.clipboard.writeText(curl)} variant="outline">Copy curl</Button>
          <Button onClick={run} disabled={running}>{running? 'Running...':'Run request'}</Button>
        </div>
        {result && (
          <div className="mt-4 text-sm">
            <div className="mb-1 font-medium">Response</div>
            <pre className="bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


