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
import { UserPlus } from "lucide-react";

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
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [creating, setCreating] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: { email: newEmail, password: newPassword, role: newRole },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Failed to create user");
      } else {
        toast.success(`User ${newEmail} created successfully`);
        setNewEmail("");
        setNewPassword("");
        setNewRole("user");
        await fetchRoles();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
    setCreating(false);
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
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5" /> Add New User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Add User"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
              <p className="text-muted-foreground">Access to student management only. No access to teacher management features.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
