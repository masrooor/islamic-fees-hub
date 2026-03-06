import { useState } from "react";
import { useTeachers, useTeacherLoans } from "@/store/useTeacherStore";
import { useTeacherBonuses } from "@/store/useTeacherBonuses";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Gift } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProofUpload from "@/components/ProofUpload";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatPKR } from "@/lib/currency";

type RepaymentType = "specific_month" | "percentage" | "custom_amount" | "manual";

export default function TeacherLoans() {
  const { teachers } = useTeachers();
  const { loans, loading, addLoan, updateLoan, fetchLoans } = useTeacherLoans();
  const { bonuses, loading: bonusesLoading, addBonus, deleteBonus } = useTeacherBonuses();
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

  // Bonus dialog state
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    teacherId: "",
    amount: 0,
    notes: "",
    paymentMode: "cash",
    proofImageUrl: "",
  });
  const [bonusSubmitting, setBonusSubmitting] = useState(false);

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

  const handleBonusSubmit = async () => {
    if (!bonusForm.teacherId || bonusForm.amount <= 0) {
      toast.error("Select teacher and enter amount");
      return;
    }
    if (!bonusForm.notes.trim()) {
      toast.error("Please add a note for the bonus");
      return;
    }
    if (bonusForm.paymentMode === "online" && !bonusForm.proofImageUrl) {
      toast.error("Please upload payment proof for online payment");
      return;
    }
    setBonusSubmitting(true);
    try {
      await addBonus({
        teacherId: bonusForm.teacherId,
        amount: bonusForm.amount,
        month: format(new Date(), "yyyy-MM"),
        dateGiven: format(new Date(), "yyyy-MM-dd"),
        paymentMode: bonusForm.paymentMode,
        notes: bonusForm.notes,
        proofImageUrl: bonusForm.proofImageUrl,
      });
      const teacherName = teachers.find(t => t.id === bonusForm.teacherId)?.name ?? "Teacher";
      toast.success(`Bonus of ${formatPKR(bonusForm.amount)} released to ${teacherName}`);
      setBonusOpen(false);
      setBonusForm({ teacherId: "", amount: 0, notes: "", paymentMode: "cash", proofImageUrl: "" });
    } catch {
      toast.error("Failed to record bonus");
    } finally {
      setBonusSubmitting(false);
    }
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

  const getEstimatedCompletion = (loan: typeof loans[0]) => {
    if (loan.status === "paid") return "Completed";
    if (loan.remaining <= 0) return "Completed";

    const teacher = teachers.find((t) => t.id === loan.teacherId);
    if (!teacher) return "—";

    if (loan.repaymentType === "specific_month" && loan.repaymentMonth) {
      return loan.repaymentMonth;
    }

    let monthlyDeduction = 0;
    if (loan.repaymentType === "percentage" && loan.repaymentPercentage) {
      monthlyDeduction = teacher.monthlySalary * (loan.repaymentPercentage / 100);
    } else if (loan.repaymentType === "custom_amount" && loan.repaymentAmount) {
      monthlyDeduction = loan.repaymentAmount;
    } else {
      return "Manual";
    }

    if (monthlyDeduction <= 0) return "—";
    const monthsLeft = Math.ceil(loan.remaining / monthlyDeduction);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsLeft);
    return format(completionDate, "MMM yyyy");
  };

  const handleDeleteLoan = async (id: string) => {
    await supabase.from("teacher_loans").delete().eq("id", id);
    toast.success("Loan deleted");
    await fetchLoans();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Loans & Bonuses</h1>
          <p className="text-sm text-muted-foreground">Track loans and bonuses given to teachers</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Gift className="h-4 w-4 mr-1" /> Give Bonus
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Give Bonus</DialogTitle>
                <DialogDescription>Bonus is an extra amount and will not be deducted from salary.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Teacher</Label>
                  <Select value={bonusForm.teacherId} onValueChange={(v) => setBonusForm({ ...bonusForm, teacherId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>{teachers.filter((t) => t.status === "active").map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (PKR)</Label>
                  <Input type="number" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })} placeholder="Enter bonus amount" />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={bonusForm.paymentMode} onValueChange={(v) => setBonusForm({ ...bonusForm, paymentMode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bonusForm.paymentMode === "online" && (
                  <ProofUpload
                    value={bonusForm.proofImageUrl}
                    onChange={(url) => setBonusForm({ ...bonusForm, proofImageUrl: url })}
                    required
                  />
                )}
                <div>
                  <Label>Notes <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={bonusForm.notes}
                    onChange={(e) => setBonusForm({ ...bonusForm, notes: e.target.value })}
                    placeholder="Reason for bonus (required)..."
                  />
                </div>
                <Button className="w-full" onClick={handleBonusSubmit} disabled={bonusSubmitting}>
                  {bonusSubmitting ? "Saving..." : "Release Bonus"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Loans</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : loans.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No loans recorded.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Teacher</TableHead><TableHead>Amount</TableHead><TableHead>Remaining</TableHead><TableHead>Repayment</TableHead><TableHead>Est. Completion</TableHead><TableHead>Date Issued</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{getTeacherName(l.teacherId)}</TableCell>
                    <TableCell>{formatPKR(l.amount)}</TableCell>
                    <TableCell className={l.remaining > 0 ? "text-destructive font-semibold" : "text-primary"}>{formatPKR(l.remaining)}</TableCell>
                     <TableCell><Badge variant="outline">{getRepaymentLabel(l)}</Badge></TableCell>
                     <TableCell className="text-muted-foreground text-xs">{getEstimatedCompletion(l)}</TableCell>
                     <TableCell>{l.dateIssued}</TableCell>
                    <TableCell><Badge variant={l.status === "active" ? "destructive" : "default"}>{l.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{l.notes}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this loan record for {getTeacherName(l.teacherId)} ({formatPKR(l.amount)}). This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLoan(l.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bonuses Section */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Bonus History</CardTitle></CardHeader>
        <CardContent>
          {bonusesLoading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> : bonuses.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No bonuses recorded.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Teacher</TableHead><TableHead>Amount</TableHead><TableHead>Month</TableHead><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Notes</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {bonuses.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{getTeacherName(b.teacherId)}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatPKR(b.amount)}</TableCell>
                    <TableCell>{b.month}</TableCell>
                    <TableCell>{b.dateGiven}</TableCell>
                    <TableCell><Badge variant={b.paymentMode === "online" ? "default" : "secondary"}>{b.paymentMode}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{b.notes || "—"}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bonus</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this bonus record for {getTeacherName(b.teacherId)} ({formatPKR(b.amount)}). This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBonus(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
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
