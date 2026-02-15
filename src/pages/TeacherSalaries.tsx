import { useState } from "react";
import { useTeachers, useTeacherSalaries, useTeacherLoans } from "@/store/useTeacherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatPKR } from "@/lib/currency";

export default function TeacherSalaries() {
  const { teachers } = useTeachers();
  const { salaries, loading, addSalary } = useTeacherSalaries();
  const { loans, updateLoan } = useTeacherLoans();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacherId: "", month: format(new Date(), "yyyy-MM"),
    otherDeduction: 0, notes: "", datePaid: format(new Date(), "yyyy-MM-dd"),
  });

  const selectedTeacher = teachers.find((t) => t.id === form.teacherId);
  const activeLoans = loans.filter((l) => l.teacherId === form.teacherId && l.status === "active");
  const totalLoanRemaining = activeLoans.reduce((s, l) => s + l.remaining, 0);
  const loanDeduction = Math.min(totalLoanRemaining, (selectedTeacher?.monthlySalary ?? 0) * 0.1);
  const baseSalary = selectedTeacher?.monthlySalary ?? 0;
  const netPaid = baseSalary - loanDeduction - form.otherDeduction;

  const handleSubmit = async () => {
    if (!form.teacherId) { toast.error("Select a teacher"); return; }
    await addSalary({
      teacherId: form.teacherId, month: form.month, baseSalary, loanDeduction,
      otherDeduction: form.otherDeduction, netPaid, datePaid: form.datePaid, notes: form.notes,
    });
    // Deduct from active loans
    let remaining = loanDeduction;
    for (const loan of activeLoans) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, loan.remaining);
      const newRemaining = loan.remaining - deduct;
      await updateLoan(loan.id, { remaining: newRemaining, status: newRemaining <= 0 ? "paid" : "active" });
      remaining -= deduct;
    }
    toast.success("Salary recorded");
    setOpen(false);
    setForm({ teacherId: "", month: format(new Date(), "yyyy-MM"), otherDeduction: 0, notes: "", datePaid: format(new Date(), "yyyy-MM-dd") });
  };

  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Salaries</h1>
          <p className="text-sm text-muted-foreground">Record and track salary payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Pay Salary</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pay Salary</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Teacher</Label>
                <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{teachers.filter((t) => t.status === "active").map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div><Label>Month</Label><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
              <div><Label>Date Paid</Label><Input type="date" value={form.datePaid} onChange={(e) => setForm({ ...form, datePaid: e.target.value })} /></div>
              {selectedTeacher && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                  <p>Base Salary: <strong>{formatPKR(baseSalary)}</strong></p>
                  <p>Loan Deduction (10%): <strong className="text-destructive">-{formatPKR(loanDeduction)}</strong></p>
                  <p className="text-xs text-muted-foreground">Outstanding loans: {formatPKR(totalLoanRemaining)}</p>
                </div>
              )}
              <div><Label>Other Deduction</Label><Input type="number" value={form.otherDeduction} onChange={(e) => setForm({ ...form, otherDeduction: Number(e.target.value) })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              {selectedTeacher && <p className="text-sm font-semibold">Net Pay: <span className="text-primary">{formatPKR(netPaid)}</span></p>}
              <Button className="w-full" onClick={handleSubmit}>Record Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Salary History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : salaries.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No salary payments recorded.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Teacher</TableHead><TableHead>Month</TableHead><TableHead>Base</TableHead><TableHead>Loan Ded.</TableHead><TableHead>Other Ded.</TableHead><TableHead>Net Paid</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {salaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{getTeacherName(s.teacherId)}</TableCell>
                    <TableCell>{s.month}</TableCell>
                    <TableCell>{formatPKR(s.baseSalary)}</TableCell>
                    <TableCell className="text-destructive">-{formatPKR(s.loanDeduction)}</TableCell>
                    <TableCell className="text-destructive">-{formatPKR(s.otherDeduction)}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatPKR(s.netPaid)}</TableCell>
                    <TableCell>{s.datePaid}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
