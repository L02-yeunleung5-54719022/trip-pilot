import type { TripData } from "./types";
import { seedData } from "./seed";

const STORAGE_KEY = "trippilot-data-v1";

export function loadTripData(): TripData {
  if (typeof window === "undefined") return seedData;

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    saveTripData(seedData);
    return seedData;
  }

  try {
    return JSON.parse(raw) as TripData;
  } catch {
    saveTripData(seedData);
    return seedData;
  }
}

export function saveTripData(data: TripData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearTripData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function resetTripData() {
  saveTripData(seedData);
  return seedData;
}
