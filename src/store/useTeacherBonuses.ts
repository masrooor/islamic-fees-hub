import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeacherBonus {
  id: string;
  teacherId: string;
  month: string;
  amount: number;
  dateGiven: string;
  paymentMode: string;
  notes: string;
  proofImageUrl: string;
}

export function useTeacherBonuses() {
  const [bonuses, setBonuses] = useState<TeacherBonus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBonuses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("teacher_bonuses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setBonuses(
        data.map((b: any) => ({
          id: b.id,
          teacherId: b.teacher_id,
          month: b.month,
          amount: Number(b.amount),
          dateGiven: b.date_given,
          paymentMode: b.payment_mode,
          notes: b.notes,
          proofImageUrl: b.proof_image_url || "",
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  const addBonus = useCallback(
    async (bonus: Omit<TeacherBonus, "id">) => {
      await supabase.from("teacher_bonuses").insert({
        teacher_id: bonus.teacherId,
        month: bonus.month,
        amount: bonus.amount,
        date_given: bonus.dateGiven,
        payment_mode: bonus.paymentMode,
        notes: bonus.notes,
        proof_image_url: bonus.proofImageUrl || "",
      } as any);
      await fetchBonuses();
    },
    [fetchBonuses]
  );

  const deleteBonus = useCallback(
    async (id: string) => {
      await supabase.from("teacher_bonuses").delete().eq("id", id);
      await fetchBonuses();
    },
    [fetchBonuses]
  );

  return { bonuses, loading, addBonus, deleteBonus, fetchBonuses };
}
