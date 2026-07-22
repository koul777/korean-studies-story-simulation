import { EVIDENCE, STORY } from "./story";
import type { StoryStats } from "./story";

export type SavePhase = "play" | "ending";
export type StoryFlags = Record<string, boolean>;
export type FlagPatch = Record<string, boolean | undefined>;
export type ChoiceHistoryItem = { nodeId: string; choiceId: string; label: string; next: string };

export type SaveData = {
  schemaVersion: number;
  contentVersion: string;
  phase: SavePhase;
  nodeId: string;
  stats: StoryStats;
  evidence: string[];
  history: string[];
  flags: StoryFlags;
  choiceHistory: ChoiceHistoryItem[];
  visitedNodes: string[];
};

export const SAVE_KEY = "korean-studies-strange-adventure-v2";
export const SAVE_SCHEMA_VERSION = 3;
export const CONTENT_VERSION = "scene-art-branching-v1";
export const INITIAL_STATS: StoryStats = { insight: 1, empathy: 1, order: 1, bond: 0 };

function clampStat(value: number) {
  return Math.max(0, Math.min(9, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeStat(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? clampStat(Math.round(numeric)) : fallback;
}

function normalizeStats(value: unknown): StoryStats {
  const source = isRecord(value) ? value : {};
  return {
    insight: normalizeStat(source.insight, INITIAL_STATS.insight),
    empathy: normalizeStat(source.empathy, INITIAL_STATS.empathy),
    order: normalizeStat(source.order, INITIAL_STATS.order),
    bond: normalizeStat(source.bond, INITIAL_STATS.bond),
  };
}

function normalizeStringArray(value: unknown, allowed: (id: string) => boolean, limit = 80) {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  value.forEach((item) => {
    if (typeof item === "string" && allowed(item)) unique.add(item);
  });
  return Array.from(unique).slice(-limit);
}

export function appendVisitedNode(current: string[], nodeId: string) {
  const withoutCurrent = current.filter((id) => id !== nodeId);
  return [...withoutCurrent.slice(-119), nodeId];
}

function normalizeFlags(value: unknown): StoryFlags {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, active]) => typeof active === "boolean")) as StoryFlags;
}

function normalizeChoiceHistory(value: unknown): ChoiceHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.nodeId !== "string" || typeof item.choiceId !== "string") return [];
    return [{
      nodeId: item.nodeId,
      choiceId: item.choiceId,
      label: typeof item.label === "string" ? item.label : item.choiceId,
      next: typeof item.next === "string" ? item.next : "",
    }];
  }).slice(-80);
}

export function applyFlagPatch(flags: StoryFlags, patch?: FlagPatch) {
  if (!patch) return flags;
  const next = { ...flags };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  });
  return next;
}

export function parseSaveData(raw: string | null): SaveData | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || typeof parsed.nodeId !== "string" || !STORY[parsed.nodeId]) return null;
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION || parsed.contentVersion !== CONTENT_VERSION) return null;
    const node = STORY[parsed.nodeId];
    const phase: SavePhase = parsed.phase === "ending" && node.ending ? "ending" : "play";
    const history = normalizeStringArray(parsed.history, (id) => Boolean(STORY[id]), 80);
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      phase,
      nodeId: parsed.nodeId,
      stats: normalizeStats(parsed.stats),
      evidence: normalizeStringArray(parsed.evidence, (id) => Boolean(EVIDENCE[id]), 30),
      history,
      flags: normalizeFlags(parsed.flags),
      choiceHistory: normalizeChoiceHistory(parsed.choiceHistory),
      visitedNodes: appendVisitedNode(normalizeStringArray(parsed.visitedNodes, (id) => Boolean(STORY[id]), 120), parsed.nodeId),
    };
  } catch {
    return null;
  }
}

export function loadSaveFromStorage(storage: Pick<Storage, "getItem"> = localStorage) {
  return parseSaveData(storage.getItem(SAVE_KEY));
}
