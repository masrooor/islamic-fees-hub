import { useState, useMemo } from "react";
import { useTeachers, useTeacherSalaries, useTeacherLoans } from "@/store/useTeacherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatPKR } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

export default function TeacherSalaries() {
  const { teachers } = useTeachers();
  const { salaries, loading, addSalary } = useTeacherSalaries();
  const { loans, updateLoan } = useTeacherLoans();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    teacherId: "",
    month: format(new Date(), "yyyy-MM"),
    otherDeduction: 0,
    notes: "",
    datePaid: format(new Date(), "yyyy-MM-dd"),
    paymentMode: "cash" as "cash" | "online",
    receiptUrl: "",
    customAmount: 0,
    customLoanDeduction: 0,
    useCustomLoanDeduction: false,
    useCustomAmount: false,
  });

  const selectedTeacher = teachers.find((t) => t.id === form.teacherId);
  const activeLoans = loans.filter((l) => l.teacherId === form.teacherId && l.status === "active");
  const totalLoanRemaining = activeLoans.reduce((s, l) => s + l.remaining, 0);
  const defaultLoanDeduction = Math.min(totalLoanRemaining, (selectedTeacher?.monthlySalary ?? 0) * 0.1);
  const loanDeduction = form.useCustomLoanDeduction
    ? Math.min(form.customLoanDeduction, totalLoanRemaining)
    : defaultLoanDeduction;
  const baseSalary = form.useCustomAmount && form.customAmount > 0
    ? form.customAmount
    : (selectedTeacher?.monthlySalary ?? 0);
  const netPaid = baseSalary - loanDeduction - form.otherDeduction;

  const currentMonth = format(new Date(), "yyyy-MM");
  const paidTeacherIds = new Set(salaries.filter((s) => s.month === currentMonth).map((s) => s.teacherId));
  const pendingTeachers = teachers.filter((t) => t.status === "active" && !paidTeacherIds.has(t.id));

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `salary-receipt-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("salary-receipts").upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("salary-receipts").getPublicUrl(data.path);
      setForm({ ...form, receiptUrl: urlData.publicUrl });
      toast.success("Receipt uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.teacherId) { toast.error("Select a teacher"); return; }
    await addSalary({
      teacherId: form.teacherId, month: form.month, baseSalary, loanDeduction,
      otherDeduction: form.otherDeduction, netPaid, datePaid: form.datePaid, notes: form.notes,
      paymentMode: form.paymentMode, receiptUrl: form.receiptUrl,
      customAmount: form.useCustomAmount ? form.customAmount : 0,
    });
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
    setForm({
      teacherId: "", month: format(new Date(), "yyyy-MM"), otherDeduction: 0, notes: "",
      datePaid: format(new Date(), "yyyy-MM-dd"), paymentMode: "cash", receiptUrl: "",
      customAmount: 0, customLoanDeduction: 0, useCustomLoanDeduction: false, useCustomAmount: false,
    });
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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

              {/* Payment Mode */}
              <div><Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={(v: "cash" | "online") => setForm({ ...form, paymentMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Receipt upload for online */}
              {form.paymentMode === "online" && (
                <div>
                  <Label>Attach Receipt</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} disabled={uploading} />
                    {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                  </div>
                  {form.receiptUrl && <p className="text-xs text-primary mt-1">✓ Receipt attached</p>}
                </div>
              )}

              {selectedTeacher && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                  <p>Base Salary: <strong>{formatPKR(selectedTeacher.monthlySalary)}</strong></p>
                  <p>Loan Deduction ({form.useCustomLoanDeduction ? "custom" : "10%"}): <strong className="text-destructive">-{formatPKR(loanDeduction)}</strong></p>
                  <p className="text-xs text-muted-foreground">Outstanding loans: {formatPKR(totalLoanRemaining)}</p>
                </div>
              )}

              {/* Custom Amount */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="useCustomAmount" checked={form.useCustomAmount}
                  onChange={(e) => setForm({ ...form, useCustomAmount: e.target.checked })}
                  className="rounded border-input" />
                <Label htmlFor="useCustomAmount" className="text-sm">Use custom salary amount</Label>
              </div>
              {form.useCustomAmount && (
                <div><Label>Custom Amount</Label><Input type="number" value={form.customAmount} onChange={(e) => setForm({ ...form, customAmount: Number(e.target.value) })} /></div>
              )}

              {/* Custom Loan Deduction */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="useCustomLoan" checked={form.useCustomLoanDeduction}
                  onChange={(e) => setForm({ ...form, useCustomLoanDeduction: e.target.checked })}
                  className="rounded border-input" />
                <Label htmlFor="useCustomLoan" className="text-sm">Use custom loan deduction</Label>
              </div>
              {form.useCustomLoanDeduction && (
                <div><Label>Custom Loan Deduction (max: {formatPKR(totalLoanRemaining)})</Label>
                  <Input type="number" value={form.customLoanDeduction}
                    onChange={(e) => setForm({ ...form, customLoanDeduction: Math.min(Number(e.target.value), totalLoanRemaining) })} />
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

      {/* Pending Teachers */}
      {pendingTeachers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Pending Salaries — {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTeachers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-sm font-semibold text-destructive">{formatPKR(t.monthlySalary)}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Total pending: <strong className="text-destructive">{formatPKR(pendingTeachers.reduce((s, t) => s + t.monthlySalary, 0))}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Salary History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : salaries.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No salary payments recorded.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Teacher</TableHead><TableHead>Month</TableHead><TableHead>Base</TableHead><TableHead>Loan Ded.</TableHead><TableHead>Other Ded.</TableHead><TableHead>Net Paid</TableHead><TableHead>Mode</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {salaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{getTeacherName(s.teacherId)}</TableCell>
                    <TableCell>{s.month}</TableCell>
                    <TableCell>{formatPKR(s.baseSalary)}{s.customAmount > 0 && <span className="text-xs text-muted-foreground ml-1">(custom)</span>}</TableCell>
                    <TableCell className="text-destructive">-{formatPKR(s.loanDeduction)}</TableCell>
                    <TableCell className="text-destructive">-{formatPKR(s.otherDeduction)}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatPKR(s.netPaid)}</TableCell>
                    <TableCell>
                      <Badge variant={s.paymentMode === "online" ? "default" : "secondary"}>
                        {s.paymentMode}
                      </Badge>
                      {s.receiptUrl && (
                        <a href={s.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary ml-1 underline">receipt</a>
                      )}
                    </TableCell>
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
