import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import NewTransaction from "./NewTransaction";

const statusOptions = ["all", "pending", "completed", "failed", "refunded"] as const;

const Transactions = () => {
  useSEO("Transactions — TransactLab", "Manage and review all transactions.");
  const transactions: any[] = []; // Mock data - replace with actual data source
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = query.toLowerCase();
      const match = t.reference.toLowerCase().includes(q) || t.currency.toLowerCase().includes(q);
      const statusOk = status === "all" ? true : t.status === status;
      return match && statusOk;
    });
  }, [transactions, query, status]);

  return (
    <div className="space-y-4 animate-enter">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Create Transaction</DialogTitle></DialogHeader>
            <NewTransaction compact />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input placeholder="Search by reference or currency" value={query} onChange={(e) => setQuery(e.target.value)} className="md:max-w-sm" />
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Results ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{t.reference}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{t.currency} {t.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      t.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                      t.status === 'failed' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>{t.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
