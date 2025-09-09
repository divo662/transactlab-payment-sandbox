import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminUsers = () => (
  <div className="space-y-6 animate-enter">
    <h1 className="text-2xl font-semibold">Admin — Users</h1>
    <Card className="glass-panel">
      <CardHeader><CardTitle>Coming soon</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">User management UI with roles and permissions.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </CardContent>
    </Card>
  </div>
);

export default AdminUsers;
