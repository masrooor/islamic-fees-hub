import { useState } from "react";
import { useStudents, usePayments, useFeeStructures } from "@/store/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import { downloadCSV } from "@/lib/exportCsv";
import { format } from "date-fns";

export default function Payments() {
  const { students } = useStudents();
  const { payments, addPayment } = usePayments();
  const { fees } = useFeeStructures();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const currentMonth = format(new Date(), "yyyy-MM");
  const [form, setForm] = useState({
    studentId: "",
    feeType: "tuition" as "tuition" | "registration",
    amountPaid: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    feeMonth: currentMonth,
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.studentId || form.amountPaid <= 0) return;
    addPayment(form);
    setForm({
      studentId: "",
      feeType: "tuition",
      amountPaid: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      feeMonth: currentMonth,
      notes: "",
    });
    setDialogOpen(false);
  };

  const getStudentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? "Unknown";

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Record and track fee payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const headers = ["Date", "Fee Month", "Student", "Fee Type", "Amount", "Receipt #", "Notes"];
              const rows = sortedPayments.map((p) => [
                p.date,
                p.feeMonth,
                getStudentName(p.studentId),
                p.feeType,
                String(p.amountPaid),
                p.receiptNumber,
                p.notes,
              ]);
              downloadCSV("payments.csv", headers, rows);
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Student *</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) => s.status === "active")
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.classGrade})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fee Type *</Label>
                <Select
                  value={form.feeType}
                  onValueChange={(v: "tuition" | "registration") =>
                    setForm({ ...form, feeType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.amountPaid || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amountPaid: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Fee Month *</Label>
                <Input
                  type="month"
                  value={form.feeMonth}
                  onChange={(e) => setForm({ ...form, feeMonth: e.target.value })}
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fee Month</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell>{p.feeMonth}</TableCell>
                    <TableCell className="font-medium">
                      {getStudentName(p.studentId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {p.feeType}
                      </Badge>
                    </TableCell>
                    <TableCell>${p.amountPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.receiptNumber}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
