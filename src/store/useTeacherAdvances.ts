import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeacherAdvance {
  id: string;
  teacherId: string;
  month: string;
  amount: number;
  dateGiven: string;
  paymentMode: string;
  notes: string;
}

export function useTeacherAdvances() {
  const [advances, setAdvances] = useState<TeacherAdvance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("teacher_advances")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setAdvances(
        data.map((a: any) => ({
          id: a.id,
          teacherId: a.teacher_id,
          month: a.month,
          amount: Number(a.amount),
          dateGiven: a.date_given,
          paymentMode: a.payment_mode,
          notes: a.notes,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const addAdvance = useCallback(
    async (advance: Omit<TeacherAdvance, "id">) => {
      await supabase.from("teacher_advances").insert({
        teacher_id: advance.teacherId,
        month: advance.month,
        amount: advance.amount,
        date_given: advance.dateGiven,
        payment_mode: advance.paymentMode,
        notes: advance.notes,
      } as any);
      await fetchAdvances();
    },
    [fetchAdvances]
  );

  const deleteAdvance = useCallback(
    async (id: string) => {
      await supabase.from("teacher_advances").delete().eq("id", id);
      await fetchAdvances();
    },
    [fetchAdvances]
  );

  return { advances, loading, addAdvance, deleteAdvance, fetchAdvances };
}
