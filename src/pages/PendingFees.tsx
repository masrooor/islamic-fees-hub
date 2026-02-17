import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudents, usePayments, useFeeStructures } from "@/store/useStore";
import { formatPKR } from "@/lib/currency";
import { format, subMonths } from "date-fns";
import { AlertCircle, Filter } from "lucide-react";
import { Link } from "react-router-dom";

export default function PendingFees() {
  const { students } = useStudents();
  const { payments } = usePayments();
  const { fees } = useFeeStructures();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedClass, setSelectedClass] = useState("all");

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, i);
      return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
    });
  }, []);

  const classOptions = useMemo(() => {
    const classes = [...new Set(students.map((s) => s.classGrade))].sort();
    return classes;
  }, [students]);

  const activeStudents = useMemo(() => {
    let filtered = students.filter((s) => s.status === "active");
    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.classGrade === selectedClass);
    }
    return filtered;
  }, [students, selectedClass]);

  const pendingData = useMemo(() => {
    const paidStudents = new Map<string, number>();
    payments
      .filter((p) => p.feeMonth === selectedMonth)
      .forEach((p) => {
        paidStudents.set(p.studentId, (paidStudents.get(p.studentId) ?? 0) + p.amountPaid);
      });

    return activeStudents.map((student) => {
      const feeStructure = fees.find(
        (f) => f.classGrade === student.classGrade && f.feeType === "tuition"
      );
      const expectedFee = feeStructure?.amount ?? 0;
      const paidAmount = paidStudents.get(student.id) ?? 0;
      const pendingAmount = Math.max(0, expectedFee - paidAmount);
      const status: "paid" | "partial" | "unpaid" =
        paidAmount >= expectedFee ? "paid" : paidAmount > 0 ? "partial" : "unpaid";

      return { student, expectedFee, paidAmount, pendingAmount, status };
    }).filter((d) => d.status !== "paid");
  }, [activeStudents, payments, fees, selectedMonth]);

  const totalPending = pendingData.reduce((s, d) => s + d.pendingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Fees</h1>
          <p className="text-sm text-muted-foreground">Students with unpaid or partially paid fees</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Students</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingData.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{formatPKR(totalPending)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeStudents.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Fee Details</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">All students have paid for this month! 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Guardian</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Contact</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Expected</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Paid</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pending</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingData.map(({ student, expectedFee, paidAmount, pendingAmount, status }) => (
                    <tr key={student.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Link to={`/students/${student.id}`} className="font-medium text-primary hover:underline">
                          {student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                      </td>
                      <td className="py-3 px-2">{student.classGrade}</td>
                      <td className="py-3 px-2">{student.guardianName}</td>
                      <td className="py-3 px-2">{student.contact}</td>
                      <td className="py-3 px-2 text-right">{formatPKR(expectedFee)}</td>
                      <td className="py-3 px-2 text-right">{formatPKR(paidAmount)}</td>
                      <td className="py-3 px-2 text-right font-semibold text-destructive">{formatPKR(pendingAmount)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={status === "partial" ? "secondary" : "destructive"}>
                          {status === "partial" ? "Partial" : "Unpaid"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
