import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuditLogs = () => (
  <div className="space-y-6 animate-enter">
    <h1 className="text-2xl font-semibold">Admin — Audit Logs</h1>
    <Card className="glass-panel">
      <CardHeader><CardTitle>Coming soon</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Track system-wide changes and activities.</p>
      </CardContent>
    </Card>
  </div>
);

export default AuditLogs;
