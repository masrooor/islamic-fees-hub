import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Student, FeeStructure, Payment } from "@/types";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setStudents(
        data.map((s) => ({
          id: s.id,
          studentCode: (s as any).student_code ?? "",
          name: s.name,
          guardianName: s.guardian_name,
          contact: s.contact,
          classGrade: s.class_grade,
          enrollmentDate: s.enrollment_date,
          status: s.status as "active" | "inactive",
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const addStudent = useCallback(async (student: Omit<Student, "id" | "studentCode"> & { studentCode?: string }) => {
    const insertData: Record<string, unknown> = {
      name: student.name,
      guardian_name: student.guardianName,
      contact: student.contact,
      class_grade: student.classGrade,
      enrollment_date: student.enrollmentDate,
      status: student.status,
    };
    if (student.studentCode) insertData.student_code = student.studentCode;
    const { data, error } = await supabase
      .from("students")
      .insert(insertData as any)
      .select()
      .single();
    if (data) await fetchStudents();
    return data;
  }, [fetchStudents]);

  const bulkAddStudents = useCallback(async (students: Array<Omit<Student, "id" | "studentCode"> & { studentCode?: string }>) => {
    const rows = students.map((s) => {
      const row: Record<string, unknown> = {
        name: s.name,
        guardian_name: s.guardianName,
        contact: s.contact,
        class_grade: s.classGrade,
        enrollment_date: s.enrollmentDate,
        status: s.status,
      };
      if (s.studentCode) row.student_code = s.studentCode;
      return row;
    });
    const { error } = await supabase.from("students").insert(rows as any);
    await fetchStudents();
    return error;
  }, [fetchStudents]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    const mapped: Record<string, unknown> = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.guardianName !== undefined) mapped.guardian_name = updates.guardianName;
    if (updates.contact !== undefined) mapped.contact = updates.contact;
    if (updates.classGrade !== undefined) mapped.class_grade = updates.classGrade;
    if (updates.enrollmentDate !== undefined) mapped.enrollment_date = updates.enrollmentDate;
    if (updates.status !== undefined) mapped.status = updates.status;
    await supabase.from("students").update(mapped).eq("id", id);
    await fetchStudents();
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    await supabase.from("students").delete().eq("id", id);
    await fetchStudents();
  }, [fetchStudents]);

  return { students, loading, addStudent, bulkAddStudents, updateStudent, deleteStudent };
}

export function useFeeStructures() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fee_structures")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setFees(
        data.map((f) => ({
          id: f.id,
          classGrade: f.class_grade,
          feeType: f.fee_type as "tuition" | "registration",
          amount: Number(f.amount),
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const addFee = useCallback(async (fee: Omit<FeeStructure, "id">) => {
    await supabase.from("fee_structures").insert({
      class_grade: fee.classGrade,
      fee_type: fee.feeType,
      amount: fee.amount,
    });
    await fetchFees();
  }, [fetchFees]);

  const updateFee = useCallback(async (id: string, updates: Partial<FeeStructure>) => {
    const mapped: Record<string, unknown> = {};
    if (updates.classGrade !== undefined) mapped.class_grade = updates.classGrade;
    if (updates.feeType !== undefined) mapped.fee_type = updates.feeType;
    if (updates.amount !== undefined) mapped.amount = updates.amount;
    await supabase.from("fee_structures").update(mapped).eq("id", id);
    await fetchFees();
  }, [fetchFees]);

  const deleteFee = useCallback(async (id: string) => {
    await supabase.from("fee_structures").delete().eq("id", id);
    await fetchFees();
  }, [fetchFees]);

  return { fees, loading, addFee, updateFee, deleteFee };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setPayments(
        data.map((p) => ({
          id: p.id,
          studentId: p.student_id,
          feeType: p.fee_type as "tuition" | "registration",
          amountPaid: Number(p.amount_paid),
          date: p.date,
          feeMonth: p.fee_month ?? "",
          receiptNumber: p.receipt_number,
          notes: p.notes,
          collectedBy: p.collected_by,
          paymentMode: p.payment_mode,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const addPayment = useCallback(async (payment: Omit<Payment, "id" | "receiptNumber">) => {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const { data } = await supabase
      .from("payments")
      .insert({
        student_id: payment.studentId,
        fee_type: payment.feeType,
        amount_paid: payment.amountPaid,
        date: payment.date,
        fee_month: payment.feeMonth,
        receipt_number: receiptNumber,
        notes: payment.notes,
        collected_by: payment.collectedBy,
        payment_mode: payment.paymentMode,
      })
      .select()
      .single();
    await fetchPayments();
    if (data) {
      return {
        id: data.id,
        studentId: data.student_id,
        feeType: data.fee_type as "tuition" | "registration",
        amountPaid: Number(data.amount_paid),
        date: data.date,
        feeMonth: data.fee_month ?? "",
        receiptNumber: data.receipt_number,
        notes: data.notes,
        collectedBy: data.collected_by,
        paymentMode: data.payment_mode,
      };
    }
    return null;
  }, [fetchPayments]);

  return { payments, loading, addPayment };
}
