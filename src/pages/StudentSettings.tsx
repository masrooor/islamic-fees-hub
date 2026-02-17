import { useState } from "react";
import { useFeeStructures } from "@/store/useStore";
import { CLASS_GRADES } from "@/types";
import { formatPKR } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, TrendingUp } from "lucide-react";

export default function Settings() {
  const { fees, updateFee } = useFeeStructures();
  const [increaseType, setIncreaseType] = useState<"percentage" | "fixed">("percentage");
  const [increaseValue, setIncreaseValue] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("");
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const tuitionFees = fees.filter((f) => f.feeType === "tuition");

  const toggleClass = (grade: string) => {
    setSelectedClasses((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const getNewAmount = (currentAmount: number) => {
    const val = parseFloat(increaseValue) || 0;
    if (increaseType === "percentage") {
      return Math.round(currentAmount + currentAmount * (val / 100));
    }
    return currentAmount + val;
  };

  const affectedFees = tuitionFees.filter((f) => {
    if (scope === "all") return true;
    return selectedClasses.includes(f.classGrade);
  });

  const handleApply = async () => {
    const val = parseFloat(increaseValue);
    if (!val || val <= 0) {
      toast({ title: "Invalid value", description: "Please enter a valid increase amount.", variant: "destructive" });
      return;
    }
    if (!effectiveMonth) {
      toast({ title: "Select month", description: "Please select the effective month.", variant: "destructive" });
      return;
    }
    if (scope === "selected" && selectedClasses.length === 0) {
      toast({ title: "No classes selected", description: "Please select at least one class.", variant: "destructive" });
      return;
    }

    for (const fee of affectedFees) {
      const newAmount = getNewAmount(fee.amount);
      await updateFee(fee.id, { amount: newAmount });
    }

    toast({
      title: "Fees updated",
      description: `${affectedFees.length} fee(s) increased effective from ${effectiveMonth}.`,
    });
    setIncreaseValue("");
    setEffectiveMonth("");
    setSelectedClasses([]);
  };

  return (
    <div className="space-y-6">
      <div>
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" /> Student Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage fee increases for new sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Bulk Fee Increase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Increase Type</Label>
              <Select value={increaseType} onValueChange={(v) => setIncreaseType(v as "percentage" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{increaseType === "percentage" ? "Percentage (%)" : "Amount (PKR)"}</Label>
              <Input
                type="number"
                min={0}
                value={increaseValue}
                onChange={(e) => setIncreaseValue(e.target.value)}
                placeholder={increaseType === "percentage" ? "e.g. 10" : "e.g. 500"}
              />
            </div>
            <div>
              <Label>Effective From Month</Label>
              <Input
                type="month"
                value={effectiveMonth}
                onChange={(e) => setEffectiveMonth(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Apply To</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "selected")}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="selected">Select Specific Classes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "selected" && (
            <div className="flex flex-wrap gap-3">
              {CLASS_GRADES.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedClasses.includes(g)}
                    onCheckedChange={() => toggleClass(g)}
                  />
                  {g}
                </label>
              ))}
            </div>
          )}

          {/* Preview */}
          {increaseValue && parseFloat(increaseValue) > 0 && affectedFees.length > 0 && (
            <div>
              <Label className="mb-2 block">Preview</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Current Fee</TableHead>
                    <TableHead>New Fee</TableHead>
                    <TableHead>Increase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affectedFees.map((f) => {
                    const newAmt = getNewAmount(f.amount);
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.classGrade}</TableCell>
                        <TableCell>{formatPKR(f.amount)}</TableCell>
                        <TableCell className="font-semibold text-primary">{formatPKR(newAmt)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">+{formatPKR(newAmt - f.amount)}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <Button onClick={handleApply} disabled={affectedFees.length === 0}>
            Apply Fee Increase
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
