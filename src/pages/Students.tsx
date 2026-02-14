import { useState } from "react";
import { useStudents } from "@/store/useStore";
import { Student, CLASS_GRADES } from "@/types";
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
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { downloadCSV } from "@/lib/exportCsv";
import { format } from "date-fns";
import StudentCsvImport from "@/components/StudentCsvImport";

type StudentForm = {
  name: string;
  guardianName: string;
  contact: string;
  classGrade: string;
  enrollmentDate: string;
  status: "active" | "inactive";
  studentCode: string;
};

const emptyForm: StudentForm = {
  name: "",
  guardianName: "",
  contact: "",
  classGrade: "",
  enrollmentDate: format(new Date(), "yyyy-MM-dd"),
  status: "active",
  studentCode: "",
};

export default function Students() {
  const { students, addStudent, bulkAddStudents, updateStudent, deleteStudent } = useStudents();
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || s.classGrade === filterClass;
    return matchSearch && matchClass;
  });

  const handleSubmit = () => {
    if (!form.name || !form.classGrade) return;
    if (editingId) {
      updateStudent(editingId, form);
    } else {
      addStudent(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      guardianName: student.guardianName,
      contact: student.contact,
      classGrade: student.classGrade,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      studentCode: student.studentCode,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage student enrollment
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const headers = ["Code", "Name", "Guardian", "Class", "Contact", "Enrollment Date", "Status"];
              const rows = filtered.map((s) => [s.studentCode, s.name, s.guardianName, s.classGrade, s.contact, s.enrollmentDate, s.status]);
              downloadCSV("students.csv", headers, rows);
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <StudentCsvImport onImport={bulkAddStudents} />
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Student" : "Add Student"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Student Code <span className="text-xs text-muted-foreground">(leave blank to auto-generate)</span></Label>
                <Input
                  value={form.studentCode}
                  onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                  placeholder="e.g. STU-001"
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Student name"
                />
              </div>
              <div>
                <Label>Guardian Name</Label>
                <Input
                  value={form.guardianName}
                  onChange={(e) =>
                    setForm({ ...form, guardianName: e.target.value })
                  }
                  placeholder="Father/Guardian name"
                />
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Class/Grade *</Label>
                <Select
                  value={form.classGrade}
                  onValueChange={(v) => setForm({ ...form, classGrade: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Enrollment Date</Label>
                <Input
                  type="date"
                  value={form.enrollmentDate}
                  onChange={(e) =>
                    setForm({ ...form, enrollmentDate: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Update" : "Add"} Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASS_GRADES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{s.studentCode}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.guardianName}</TableCell>
                    <TableCell>{s.classGrade}</TableCell>
                    <TableCell>{s.contact}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.status === "active" ? "default" : "secondary"}
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
