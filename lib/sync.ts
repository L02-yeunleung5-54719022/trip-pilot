import { createClient } from "@supabase/supabase-js";
import type { TripData } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const syncEnabled = Boolean(supabaseUrl && supabaseKey);

export const supabase = syncEnabled
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const SHARED_TRIP_ID = "birthday-europe-2026";

export async function loadTripDataFromCloud() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("trip_data")
    .select("data")
    .eq("trip_id", SHARED_TRIP_ID)
    .single();

  if (error || !data?.data) return null;

  return data.data as TripData;
}

export async function saveTripDataToCloud(tripData: TripData) {
  if (!supabase) return false;

  const { error } = await supabase.from("trip_data").upsert({
    trip_id: SHARED_TRIP_ID,
    data: tripData,
    updated_at: new Date().toISOString()
  });

  return !error;
}
