import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserRole {
  id: string;
  userId: string;
  role: string;
  email?: string;
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("user_roles").select("*");
    if (data) {
      setRoles(data.map((r: any) => ({ id: r.id, userId: r.user_id, role: r.role })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleUpdateRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").update({ role: role as any }).eq("user_id", userId);
    toast.success("Role updated");
    await fetchRoles();
  };

  const roleBadgeVariant = (role: string) => {
    if (role === "admin") return "default" as const;
    if (role === "manager") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Role Management</h1>
        <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">User Roles</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : roles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No roles found.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>User ID</TableHead><TableHead>Current Role</TableHead><TableHead className="text-right">Change Role</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.userId.slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant={roleBadgeVariant(r.role)}>{r.role}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Select value={r.role} onValueChange={(v) => handleUpdateRole(r.userId, v)}>
                        <SelectTrigger className="w-32 ml-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Role Permissions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <Badge>Admin</Badge>
              <p className="text-muted-foreground">Full access to all features: students, teachers, payments, salaries, loans, attendance, role management.</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <Badge variant="secondary">Manager</Badge>
              <p className="text-muted-foreground">Can view all data but cannot modify or delete records. Read-only access to teachers, students, and financial data.</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <Badge variant="outline">User</Badge>
              <p className="text-muted-foreground">Basic access. No access to management features.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
