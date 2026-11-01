import { getSupabaseClient } from "../supabase/client";
import { toHelpRequestInsert, type HelpRequestValues } from "./validation";

export async function submitHelpRequest(values: HelpRequestValues): Promise<void> {
  const payload = toHelpRequestInsert(values);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    // No .select(): public users may insert but must not read requests via RLS.
    const { error } = await getSupabaseClient()
      .from("help_requests")
      .insert(payload)
      .abortSignal(controller.signal);
    if (error) throw error;
  } finally {
    clearTimeout(timer);
  }
}
