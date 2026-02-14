export interface Student {
  id: string;
  studentCode: string;
  name: string;
  guardianName: string;
  contact: string;
  classGrade: string;
  enrollmentDate: string;
  status: "active" | "inactive";
}

export interface FeeStructure {
  id: string;
  classGrade: string;
  feeType: "tuition" | "registration";
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  feeType: "tuition" | "registration";
  amountPaid: number;
  date: string;
  receiptNumber: string;
  notes: string;
}

export const CLASS_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Hifz Program",
  "Alim Course",
];
