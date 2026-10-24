import { useSyncExternalStore } from "react";
import {
  subscribe,
  getOverallStats,
  getItemStats,
  getSessions,
  getStreak,
  getClearedKanji,
  getAllKanjiStreaks,
  type ItemKind,
} from "@/lib/progress";

export function useOverallStats() {
  return useSyncExternalStore(subscribe, getOverallStats, getOverallStats);
}

export function useItemStats(kind: ItemKind) {
  return useSyncExternalStore(
    subscribe,
    () => getItemStats(kind),
    () => getItemStats(kind),
  );
}

export function useSessions() {
  return useSyncExternalStore(subscribe, getSessions, getSessions);
}

export function useStreak() {
  return useSyncExternalStore(subscribe, getStreak, getStreak);
}

export function useClearedKanji() {
  return useSyncExternalStore(subscribe, getClearedKanji, getClearedKanji);
}

export function useKanjiStreaks() {
  return useSyncExternalStore(subscribe, getAllKanjiStreaks, getAllKanjiStreaks);
}


