import { useState } from "react";
import { useTeachers, useTeacherLoans } from "@/store/useTeacherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatPKR } from "@/lib/currency";

type RepaymentType = "specific_month" | "percentage" | "custom_amount" | "manual";

export default function TeacherLoans() {
  const { teachers } = useTeachers();
  const { loans, loading, addLoan } = useTeacherLoans();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacherId: "",
    amount: 0,
    notes: "",
    dateIssued: format(new Date(), "yyyy-MM-dd"),
    repaymentType: "manual" as RepaymentType,
    repaymentMonth: "",
    repaymentPercentage: 0,
    repaymentAmount: 0,
  });

  const handleSubmit = async () => {
    if (!form.teacherId || form.amount <= 0) { toast.error("Select teacher and enter amount"); return; }

    if (form.repaymentType === "specific_month" && !form.repaymentMonth) {
      toast.error("Select the return month"); return;
    }
    if (form.repaymentType === "percentage" && (form.repaymentPercentage <= 0 || form.repaymentPercentage > 100)) {
      toast.error("Enter a valid percentage (1-100)"); return;
    }
    if (form.repaymentType === "custom_amount" && form.repaymentAmount <= 0) {
      toast.error("Enter a valid monthly deduction amount"); return;
    }

    await addLoan({
      teacherId: form.teacherId,
      amount: form.amount,
      remaining: form.amount,
      dateIssued: form.dateIssued,
      notes: form.notes,
      status: "active",
      repaymentType: form.repaymentType,
      repaymentMonth: form.repaymentType === "specific_month" ? form.repaymentMonth : null,
      repaymentPercentage: form.repaymentType === "percentage" ? form.repaymentPercentage : null,
      repaymentAmount: form.repaymentType === "custom_amount" ? form.repaymentAmount : null,
    });
    toast.success("Loan recorded");
    setOpen(false);
    setForm({
      teacherId: "", amount: 0, notes: "",
      dateIssued: format(new Date(), "yyyy-MM-dd"),
      repaymentType: "manual", repaymentMonth: "", repaymentPercentage: 0, repaymentAmount: 0,
    });
  };

  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "Unknown";

  const getRepaymentLabel = (loan: typeof loans[0]) => {
    switch (loan.repaymentType) {
      case "specific_month": return `Full return in ${loan.repaymentMonth}`;
      case "percentage": return `${loan.repaymentPercentage}% of salary/month`;
      case "custom_amount": return `${formatPKR(loan.repaymentAmount ?? 0)}/month`;
      default: return "Manual";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Loans</h1>
          <p className="text-sm text-muted-foreground">Track advances and loans given to teachers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Loan</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Loan</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Teacher</Label>
                <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{teachers.filter((t) => t.status === "active").map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Date Issued</Label><Input type="date" value={form.dateIssued} onChange={(e) => setForm({ ...form, dateIssued: e.target.value })} /></div>

              <div>
                <Label>Repayment Method</Label>
                <Select value={form.repaymentType} onValueChange={(v) => setForm({ ...form, repaymentType: v as RepaymentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="specific_month">Return in specific month</SelectItem>
                    <SelectItem value="percentage">Deduct % from salary monthly</SelectItem>
                    <SelectItem value="custom_amount">Deduct fixed amount monthly</SelectItem>
                    <SelectItem value="manual">Manual (no auto deduction)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.repaymentType === "specific_month" && (
                <div>
                  <Label>Return Month</Label>
                  <Input type="month" value={form.repaymentMonth} onChange={(e) => setForm({ ...form, repaymentMonth: e.target.value })} />
                </div>
              )}

              {form.repaymentType === "percentage" && (
                <div>
                  <Label>Monthly Deduction (%)</Label>
                  <Input type="number" min={1} max={100} value={form.repaymentPercentage} onChange={(e) => setForm({ ...form, repaymentPercentage: Number(e.target.value) })} placeholder="e.g. 10" />
                </div>
              )}

              {form.repaymentType === "custom_amount" && (
                <div>
                  <Label>Monthly Deduction Amount (PKR)</Label>
                  <Input type="number" min={1} value={form.repaymentAmount} onChange={(e) => setForm({ ...form, repaymentAmount: Number(e.target.value) })} placeholder="e.g. 5000" />
                </div>
              )}

              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleSubmit}>Record Loan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Loans</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : loans.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No loans recorded.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Teacher</TableHead><TableHead>Amount</TableHead><TableHead>Remaining</TableHead><TableHead>Repayment</TableHead><TableHead>Date Issued</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{getTeacherName(l.teacherId)}</TableCell>
                    <TableCell>{formatPKR(l.amount)}</TableCell>
                    <TableCell className={l.remaining > 0 ? "text-destructive font-semibold" : "text-primary"}>{formatPKR(l.remaining)}</TableCell>
                    <TableCell><Badge variant="outline">{getRepaymentLabel(l)}</Badge></TableCell>
                    <TableCell>{l.dateIssued}</TableCell>
                    <TableCell><Badge variant={l.status === "active" ? "destructive" : "default"}>{l.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{l.notes}</TableCell>
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
