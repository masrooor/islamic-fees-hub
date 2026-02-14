import { useState, useCallback } from "react";
import { Student, FeeStructure, Payment } from "@/types";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage("iec_students", [])
  );

  const save = useCallback((updated: Student[]) => {
    setStudents(updated);
    saveToStorage("iec_students", updated);
  }, []);

  const addStudent = useCallback(
    (student: Omit<Student, "id">) => {
      const newStudent = { ...student, id: crypto.randomUUID() };
      save([...students, newStudent]);
      return newStudent;
    },
    [students, save]
  );

  const updateStudent = useCallback(
    (id: string, data: Partial<Student>) => {
      save(students.map((s) => (s.id === id ? { ...s, ...data } : s)));
    },
    [students, save]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      save(students.filter((s) => s.id !== id));
    },
    [students, save]
  );

  return { students, addStudent, updateStudent, deleteStudent };
}

export function useFeeStructures() {
  const [fees, setFees] = useState<FeeStructure[]>(() =>
    loadFromStorage("iec_fees", [])
  );

  const save = useCallback((updated: FeeStructure[]) => {
    setFees(updated);
    saveToStorage("iec_fees", updated);
  }, []);

  const addFee = useCallback(
    (fee: Omit<FeeStructure, "id">) => {
      save([...fees, { ...fee, id: crypto.randomUUID() }]);
    },
    [fees, save]
  );

  const updateFee = useCallback(
    (id: string, data: Partial<FeeStructure>) => {
      save(fees.map((f) => (f.id === id ? { ...f, ...data } : f)));
    },
    [fees, save]
  );

  const deleteFee = useCallback(
    (id: string) => {
      save(fees.filter((f) => f.id !== id));
    },
    [fees, save]
  );

  return { fees, addFee, updateFee, deleteFee };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadFromStorage("iec_payments", [])
  );

  const save = useCallback((updated: Payment[]) => {
    setPayments(updated);
    saveToStorage("iec_payments", updated);
  }, []);

  const addPayment = useCallback(
    (payment: Omit<Payment, "id" | "receiptNumber">) => {
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
      const newPayment = { ...payment, id: crypto.randomUUID(), receiptNumber };
      save([...payments, newPayment]);
      return newPayment;
    },
    [payments, save]
  );

  return { payments, addPayment };
}
