"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS, EARLY_ROUTE_GATE_ROUTE, EVIDENCE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, START_NODE, STORY, StoryStats, getRouteFlagScores, resolveEarlyRouteGate, resolveEnding, resolveMidRouteGate, resolveRouteBridge } from "./story";
import { resolveSceneArt } from "./sceneArt";
import {
  CONTENT_VERSION,
  INITIAL_STATS,
  SAVE_KEY,
  SAVE_SCHEMA_VERSION,
  appendVisitedNode,
  applyFlagPatch,
  loadSaveFromStorage,
  type ChoiceHistoryItem,
  type FlagPatch,
  type StoryFlags,
} from "./saveState";

type Mode = "menu" | "play" | "ending";
type ChoiceWithMeta = { choiceId?: string; setFlags?: FlagPatch };
type NodeWithMeta = { setFlags?: FlagPatch };

const CAPTURE_STATS: StoryStats = { insight: 6, empathy: 6, order: 5, bond: 4 };

const CAPTURE_NODES: Record<string, string> = {
  office: "c1_open",
  server: "c1_logs",
  "server-room": "c1_logs",
  log: "c4_log_room",
  cctv: "c5_evidence_bridge",
  "cctv-room": "c5_evidence_bridge",
  security: "c5_evidence_bridge",
  rules: "c6_legal_consult",
  "rule-archive": "c6_legal_consult",
  archive: "c6_legal_consult",
  witness: "c6_witness_circle",
  "witness-room": "c6_witness_circle",
  testimony: "c6_witness_circle",
  press: "c4_press_plan",
  "public-forum": "c5_panel_plan",
  board: "c4_board_pre",
  panel: "c7_prehearing",
  "panel-room": "c7_prehearing",
  "panel-core": "c7_core_testimony",
  "panel-core-followup": "c7_core_testimony_followup",
  "panel-audit": "c7_audit_statement",
  "panel-audit-followup": "c7_audit_statement_followup",
  "panel-expert": "c7_expert_input",
  "panel-expert-followup": "c7_expert_input_followup",
  evidence: "c6_review_open",
  "frame-evidence": "c5_evidence_bridge",
  "frame-evidence-followup": "c5_evidence_bridge_followup",
  "frame-testimony": "c5_cross_exam",
  "frame-testimony-followup": "c5_cross_exam_followup",
  "frame-public": "c5_public_plan",
  "frame-public-followup": "c5_public_plan_followup",
  censure: "c5_resolution_censure",
  reconciliation: "c5_resolution_reconciliation",
  reform: "c5_resolution_reform",
  "censure-followup": "c5_resolution_censure_followup",
  "reconciliation-followup": "c5_resolution_reconciliation_followup",
  "reform-followup": "c5_resolution_reform_followup",
  "bridge-order": "c7_bridge_order",
  "bridge-human": "c7_bridge_human",
  "bridge-balanced": "c7_bridge_balanced",
  "bridge-mixed": "c7_bridge_mixed",
  "bridge-order-followup": "c7_bridge_order_followup",
  "bridge-human-followup": "c7_bridge_human_followup",
  "bridge-balanced-followup": "c7_bridge_balanced_followup",
  "bridge-mixed-followup": "c7_bridge_mixed_followup",
  "entry-fact": "c3_entry_fact",
  "entry-human": "c3_entry_human",
  "entry-balanced": "c3_entry_balanced",
  "entry-mixed": "c3_entry_mixed",
  "entry-fact-followup": "c3_entry_fact_followup",
  "entry-human-followup": "c3_entry_human_followup",
  "entry-balanced-followup": "c3_entry_balanced_followup",
  "entry-mixed-followup": "c3_entry_mixed_followup",
  "return-fact": "c4_return_fact_notice",
  "return-human": "c4_return_motive_notice",
  "return-balanced": "c4_return_balanced_notice",
  "return-fact-followup": "c4_return_fact_followup",
  "return-human-followup": "c4_return_motive_followup",
  "return-balanced-followup": "c4_return_balanced_followup",
  forest: "c2_arrival",
  crossroads: "c2_arrival",
  "forest-crossroads": "c2_arrival",
  "history-forest": "c2_arrival",
  village: "c2_keeper",
  "archive-village": "c2_keeper",
  "archive-log": "c2_log_node",
  "map-room": "c2_waypoint",
  "guard-post": "c2_guard_shift",
  "review-order": "c6_review_order_entry",
  "review-human": "c6_review_human_entry",
  "review-balanced": "c6_review_balanced_entry",
  "review-mixed": "c6_review_mixed_entry",
  "review-order-followup": "c6_review_order_followup",
  "review-human-followup": "c6_review_human_followup",
  "review-balanced-followup": "c6_review_balanced_followup",
  "review-mixed-followup": "c6_review_mixed_followup",
  maze: "c3_final",
  "regulation-labyrinth": "c3_final",
  forum: "c5_panel_plan",
  review: "c6_review_open",
  "review-room": "c6_review_open",
  hearing: "c7_final_resolution",
  "hearing-room": "c7_final_resolution",
  "cross-procedure": "c7_cross_procedure_answer",
  "cross-procedure-followup": "c7_cross_procedure_followup",
  "cross-recovery": "c7_cross_recovery_answer",
  "cross-recovery-followup": "c7_cross_recovery_followup",
  "cross-summary": "c7_cross_summary_answer",
  "cross-summary-followup": "c7_cross_summary_followup",
  balanced: "end_balanced",
  human: "end_human",
  order: "end_order",
};

const MENU_SCENE_MONTAGE = [
  {
    code: "LOG",
    label: "서버 로그실",
    note: "절차 단서가 열리는 경로",
    image: "/game/scenes/server-room.svg",
  },
  {
    code: "CARE",
    label: "증언 대기실",
    note: "피해 회복을 좇는 경로",
    image: "/game/scenes/witness-room.svg",
  },
  {
    code: "REFORM",
    label: "개선 설계실",
    note: "제도 수정을 밀어붙이는 경로",
    image: "/game/scenes/reform-blueprint.svg",
  },
  {
    code: "PUBLIC",
    label: "공개 토론장",
    note: "여론과 조직 신뢰가 갈리는 장면",
    image: "/game/scenes/public-forum.svg",
  },
] as const;

const MENU_REFERENCE_BACKGROUND = "/game/reference/story-reference-1.jpg";

const STATIC_CAST_IMAGES: Record<string, Record<string, string>> = {
  harin: {
    idle: "/game/characters/poses/harin-idle.png",
    search: "/game/characters/poses/harin-search.png",
    brief: "/game/characters/poses/harin-brief.png",
  },
  haechi: {
    idle: "/game/characters/poses/haechi-idle.png",
    low: "/game/characters/poses/haechi-low.png",
    judge: "/game/characters/poses/haechi-judge.png",
  },
};

type StoryGameProps = {
  initialScene?: string;
};

const STAT_LABELS: Record<keyof StoryStats, { label: string; symbol: string }> = {
  insight: { label: "통찰", symbol: "觀" },
  empathy: { label: "공감", symbol: "心" },
  order: { label: "질서", symbol: "序" },
  bond: { label: "유대", symbol: "結" },
};

const ROUTE_SIGNAL_META = [
  { key: "orderRoute", label: "절차 추적", code: "PROC", echo: "앞선 선택이 절차 중심 기록으로 이어지고 있다.", summary: "절차를 먼저 세운 선택들이 결말의 기준선을 단단하게 만들었다." },
  { key: "humanRoute", label: "회복 경로", code: "CARE", echo: "앞선 선택이 관계 회복을 우선하는 방향으로 이어지고 있다.", summary: "사람의 진술과 회복을 놓치지 않은 선택들이 결말의 온도를 바꿨다." },
  { key: "balancedRoute", label: "개혁 조율", code: "REFORM", echo: "앞선 선택이 제도 개선과 조율의 흐름으로 이어지고 있다.", summary: "증거와 관계를 함께 묶은 선택들이 제도 개선의 결론으로 이어졌다." },
] as const;

const CHAPTER_LIST = Object.keys(CHAPTERS)
  .map((key) => Number(key))
  .sort((a, b) => a - b);

function clampStat(value: number) {
  return Math.max(0, Math.min(9, value));
}

function applyEffects(stats: StoryStats, effects?: Partial<StoryStats>) {
  const next = { ...stats };
  if (!effects) return next;
  (Object.keys(effects) as Array<keyof StoryStats>).forEach((key) => {
    next[key] = clampStat(next[key] + (effects[key] || 0));
  });
  return next;
}

function normalizeCaptureSceneKey(scene: string) {
  return scene.trim().toLowerCase().replace(/\.(svg|png)$/i, "").replace(/_/g, "-");
}

function resolveSceneClassKey(node: StoryNode, sceneArtId: string) {
  const backgroundKey = (node as StoryNode & { backgroundKey?: string }).backgroundKey;
  return normalizeCaptureSceneKey(backgroundKey || sceneArtId || node.scene);
}

const STATIC_SCENE_POSES: Record<string, {
  harin: "idle" | "search" | "brief";
  haechi: "idle" | "low" | "judge";
}> = {
  "server-room": { harin: "search", haechi: "judge" },
  "cctv-room": { harin: "search", haechi: "judge" },
  "witness-room": { harin: "brief", haechi: "low" },
  village: { harin: "idle", haechi: "low" },
  "forest-crossroads": { harin: "search", haechi: "low" },
  "archive-log": { harin: "search", haechi: "low" },
  "rule-archive": { harin: "search", haechi: "judge" },
  "map-room": { harin: "search", haechi: "idle" },
  "evidence-board": { harin: "search", haechi: "judge" },
  "guard-post": { harin: "brief", haechi: "judge" },
  "hearing-room": { harin: "brief", haechi: "judge" },
  "panel-room": { harin: "brief", haechi: "judge" },
  "censure-chamber": { harin: "brief", haechi: "judge" },
  "reconciliation-desk": { harin: "idle", haechi: "low" },
  "reform-blueprint": { harin: "search", haechi: "judge" },
  "public-forum": { harin: "brief", haechi: "idle" },
  office: { harin: "idle", haechi: "idle" },
};

function resolveContextualStaticCast(node: StoryNode, mode: Mode) {
  const cast = resolveStaticCast(node, mode);
  if (mode === "menu" || cast.length === 0) return cast;

  const sceneKey = normalizeCaptureSceneKey(
    (node as StoryNode & { backgroundKey?: string }).backgroundKey || node.scene,
  );
  const scenePose = STATIC_SCENE_POSES[sceneKey];
  if (!scenePose) return cast;

  return cast.map((character) => ({
    ...character,
    variant: character.key === "harin" ? scenePose.harin : scenePose.haechi,
  }));
}

function resolveStaticCast(node: StoryNode, mode: Mode) {
  if (mode !== "play") return [];

  const sceneKey = normalizeCaptureSceneKey((node as StoryNode & { backgroundKey?: string }).backgroundKey || node.scene);
  const harinVariant = /forest|archive|guard|map/.test(sceneKey)
    ? "search"
    : /hearing|panel|censure|reform|rule|review/.test(sceneKey)
      ? "brief"
      : "idle";
  const haechiVariant = /forest|archive|guard|map/.test(sceneKey)
    ? "low"
    : /hearing|panel|censure|reform|rule|review/.test(sceneKey)
      ? "judge"
      : "idle";

  if (node.speaker.includes("하린")) {
    return [
      { key: "harin", label: "서하린", variant: harinVariant, focus: true },
      { key: "haechi", label: "해치", variant: haechiVariant, focus: false },
    ] as const;
  }

  if (node.speaker.includes("해치") || node.speaker.includes("하치")) {
    return [
      { key: "haechi", label: "해치", variant: haechiVariant, focus: true },
      { key: "harin", label: "서하린", variant: harinVariant, focus: false },
    ] as const;
  }

  return [
    { key: "harin", label: "서하린", variant: harinVariant, focus: false },
    { key: "haechi", label: "해치", variant: haechiVariant, focus: false },
  ] as const;
}

function resolveCaptureNodeId(scene?: string | null) {
  if (!scene) return null;
  return CAPTURE_NODES[normalizeCaptureSceneKey(scene)] ?? null;
}

function resolveCaptureFlags(scene?: string | null): StoryFlags {
  const key = scene?.toLowerCase();
  if (key === "balanced") return { capture: true, early_balance_path: true, panel_reform: true, verdict_reform: true };
  if (key === "human") return { capture: true, early_human_path: true, panel_reconciliation: true, verdict_reconciliation: true };
  if (key === "order") return { capture: true, early_fact_path: true, panel_censure: true, verdict_censure: true };
  return { capture: true };
}

function getChoiceRouteImpact(choice: ChoiceWithMeta) {
  if (!choice.setFlags) return null;
  const scores = getRouteFlagScores(choice.setFlags as StoryFlags);
  const impacts = ROUTE_SIGNAL_META
    .map((signal) => ({ ...signal, value: scores[signal.key] }))
    .filter((signal) => signal.value > 0);
  if (impacts.length === 0) return null;
  if (impacts.length > 1) return { code: "MIX", label: "복합 경로" };
  return impacts[0];
}

type BranchResultMeta = { code: string; label: string; text: string; chapter: number };

const BRANCH_RESULT_META: Record<string, BranchResultMeta> = {
  c3_entry_fact: { code: "PROC", label: "초반 선택 결과", text: "이전 선택 때문에 기록 우선 진입로가 열림", chapter: 3 },
  c3_entry_human: { code: "CARE", label: "초반 선택 결과", text: "이전 선택 때문에 증언 우선 진입로가 열림", chapter: 3 },
  c3_entry_balanced: { code: "REFORM", label: "초반 선택 결과", text: "이전 선택 때문에 균형 검토 진입로가 열림", chapter: 3 },
  c3_entry_mixed: { code: "MIX", label: "초반 선택 결과", text: "초반 경로가 동률이라 혼합 단서 진입로가 열림", chapter: 3 },
  c3_entry_fact_followup: { code: "PROC", label: "초반 선택 유지", text: "기록 우선 확인대까지 선택 결과가 이어짐", chapter: 3 },
  c3_entry_human_followup: { code: "CARE", label: "초반 선택 유지", text: "증언 우선 확인대까지 선택 결과가 이어짐", chapter: 3 },
  c3_entry_balanced_followup: { code: "REFORM", label: "초반 선택 유지", text: "균형 검토 확인대까지 선택 결과가 이어짐", chapter: 3 },
  c3_entry_mixed_followup: { code: "MIX", label: "초반 선택 유지", text: "혼합 단서 확인대까지 선택 결과가 이어짐", chapter: 3 },
  c4_return_fact_notice: { code: "PROC", label: "4장 선택 결과", text: "사실 공지 경로로 복귀", chapter: 4 },
  c4_return_motive_notice: { code: "CARE", label: "4장 선택 결과", text: "동기 설명 경로로 복귀", chapter: 4 },
  c4_return_balanced_notice: { code: "REFORM", label: "4장 선택 결과", text: "균형 공지 경로로 복귀", chapter: 4 },
  c4_return_fact_followup: { code: "PROC", label: "4장 선택 유지", text: "사실 공지 확인석까지 복귀 경로가 이어짐", chapter: 4 },
  c4_return_motive_followup: { code: "CARE", label: "4장 선택 유지", text: "동기 설명 확인석까지 복귀 경로가 이어짐", chapter: 4 },
  c4_return_balanced_followup: { code: "REFORM", label: "4장 선택 유지", text: "균형 공지 확인석까지 복귀 경로가 이어짐", chapter: 4 },
  c5_evidence_bridge: { code: "PROC", label: "5장 질문 프레임", text: "증거 체인 프레임으로 청문 질문이 정렬됨", chapter: 5 },
  c5_evidence_bridge_followup: { code: "PROC", label: "5장 질문 유지", text: "증거 체인 고정석까지 질문 프레임이 이어짐", chapter: 5 },
  c5_cross_exam: { code: "CARE", label: "5장 질문 프레임", text: "증언 맥락 프레임으로 청문 질문이 정렬됨", chapter: 5 },
  c5_cross_exam_followup: { code: "CARE", label: "5장 질문 유지", text: "증언 맥락 고정석까지 질문 프레임이 이어짐", chapter: 5 },
  c5_public_plan: { code: "REFORM", label: "5장 질문 프레임", text: "공개 균형 프레임으로 청문 질문이 정렬됨", chapter: 5 },
  c5_public_plan_followup: { code: "REFORM", label: "5장 질문 유지", text: "공개 균형 고정석까지 질문 프레임이 이어짐", chapter: 5 },  c5_resolution_censure_followup: { code: "PROC", label: "5장 선택 유지", text: "책임 범위 고정석까지 심의 결과가 이어짐", chapter: 5 },
  c5_resolution_reconciliation_followup: { code: "CARE", label: "5장 선택 유지", text: "회복 문장 조정석까지 심의 결과가 이어짐", chapter: 5 },
  c5_resolution_reform_followup: { code: "REFORM", label: "5장 선택 유지", text: "개선 지표 고정석까지 심의 결과가 이어짐", chapter: 5 },
  c6_review_order_entry: { code: "PROC", label: "중반 선택 결과", text: "징계 검토 라인이 먼저 열림", chapter: 6 },
  c6_review_human_entry: { code: "CARE", label: "중반 선택 결과", text: "회복 검토 라인이 먼저 열림", chapter: 6 },
  c6_review_balanced_entry: { code: "REFORM", label: "중반 선택 결과", text: "제도 검토 라인이 먼저 열림", chapter: 6 },
  c6_review_mixed_entry: { code: "MIX", label: "중반 선택 결과", text: "경로 기억이 동률이라 혼합 검토 라인이 열림", chapter: 6 },
  c6_review_order_followup: { code: "PROC", label: "중반 선택 유지", text: "절차 검토 체크리스트까지 경로가 이어짐", chapter: 6 },
  c6_review_human_followup: { code: "CARE", label: "중반 선택 유지", text: "회복 검토 체크리스트까지 경로가 이어짐", chapter: 6 },
  c6_review_balanced_followup: { code: "REFORM", label: "중반 선택 유지", text: "후속 지표 체크리스트까지 경로가 이어짐", chapter: 6 },
  c6_review_mixed_followup: { code: "MIX", label: "중반 선택 유지", text: "혼합 쟁점 체크리스트까지 경로가 이어짐", chapter: 6 },
  c7_cross_procedure_answer: { code: "PROC", label: "7장 교차 답변", text: "절차 준수 답변이 최종 결론 전 기준으로 남음", chapter: 7 },
  c7_cross_procedure_followup: { code: "PROC", label: "7장 교차 유지", text: "절차 답변 고정석까지 답변 여파가 이어짐", chapter: 7 },
  c7_cross_recovery_answer: { code: "CARE", label: "7장 교차 답변", text: "회복 조항 답변이 최종 결론 전 기준으로 남음", chapter: 7 },
  c7_cross_recovery_followup: { code: "CARE", label: "7장 교차 유지", text: "회복 답변 고정석까지 답변 여파가 이어짐", chapter: 7 },
  c7_cross_summary_answer: { code: "REFORM", label: "7장 교차 답변", text: "근거 요약 답변이 최종 결론 전 기준으로 남음", chapter: 7 },
  c7_cross_summary_followup: { code: "REFORM", label: "7장 교차 유지", text: "요약 답변 고정석까지 답변 여파가 이어짐", chapter: 7 },
  c7_core_testimony: { code: "CARE", label: "7장 패널 질문", text: "핵심 증언 중심으로 최종 질문이 정렬됨", chapter: 7 },
  c7_core_testimony_followup: { code: "CARE", label: "7장 패널 유지", text: "핵심 증언 고정석까지 패널 질문이 이어짐", chapter: 7 },
  c7_audit_statement: { code: "PROC", label: "7장 패널 질문", text: "감사 기록 중심으로 최종 질문이 정렬됨", chapter: 7 },
  c7_audit_statement_followup: { code: "PROC", label: "7장 패널 유지", text: "감사 기록 고정석까지 패널 질문이 이어짐", chapter: 7 },
  c7_expert_input: { code: "REFORM", label: "7장 패널 질문", text: "전문가 권고 중심으로 최종 질문이 정렬됨", chapter: 7 },
  c7_expert_input_followup: { code: "REFORM", label: "7장 패널 유지", text: "전문가 권고 고정석까지 패널 질문이 이어짐", chapter: 7 },  c7_bridge_order: { code: "PROC", label: "최종 선택 결과", text: "절차 확정 회랑으로 진입", chapter: 7 },
  c7_bridge_human: { code: "CARE", label: "최종 선택 결과", text: "관계 회복 회랑으로 진입", chapter: 7 },
  c7_bridge_balanced: { code: "REFORM", label: "최종 선택 결과", text: "재발방지 설계 회랑으로 진입", chapter: 7 },
  c7_bridge_mixed: { code: "MIX", label: "최종 선택 결과", text: "우세 경로가 없어 혼합 쟁점 회랑으로 진입", chapter: 7 },
  c7_bridge_order_followup: { code: "PROC", label: "최종 선택 유지", text: "절차 최종 점검석까지 청문 경로가 이어짐", chapter: 7 },
  c7_bridge_human_followup: { code: "CARE", label: "최종 선택 유지", text: "증언 최종 점검석까지 청문 경로가 이어짐", chapter: 7 },
  c7_bridge_balanced_followup: { code: "REFORM", label: "최종 선택 유지", text: "개선안 최종 점검석까지 청문 경로가 이어짐", chapter: 7 },
  c7_bridge_mixed_followup: { code: "MIX", label: "최종 선택 유지", text: "혼합 쟁점 최종 점검석까지 청문 경로가 이어짐", chapter: 7 },
};
export default function StoryGame({ initialScene }: StoryGameProps) {
  const initialCaptureNodeId = resolveCaptureNodeId(initialScene);
  const initialNodeId = initialCaptureNodeId ?? START_NODE;
  const initialCaptureMode = Boolean(initialCaptureNodeId);
  const initialCaptureFlags = initialCaptureMode ? resolveCaptureFlags(initialScene) : {};
  const initialMode: Mode = initialCaptureMode ? STORY[initialNodeId].ending ? "ending" : "play" : "menu";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [nodeId, setNodeId] = useState(initialNodeId);
  const [stats, setStats] = useState<StoryStats>(() => (initialCaptureMode ? { ...CAPTURE_STATS } : INITIAL_STATS));
  const [evidence, setEvidence] = useState<string[]>(() => (initialCaptureMode ? Object.keys(EVIDENCE) : []));
  const [history, setHistory] = useState<string[]>([]);
  const [flags, setFlags] = useState<StoryFlags>(() => initialCaptureFlags);
  const [choiceHistory, setChoiceHistory] = useState<ChoiceHistoryItem[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([initialNodeId]);
  const [visibleChars, setVisibleChars] = useState(() => STORY[initialNodeId].text.length);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveAvailable, setSaveAvailable] = useState(false);
  const [captureMode, setCaptureMode] = useState(initialCaptureMode);
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [openingVisible, setOpeningVisible] = useState(() => !initialCaptureMode);
  const [openingMuted, setOpeningMuted] = useState(true);
  const openingVideoRef = useRef<HTMLVideoElement | null>(null);
  const previousChapter = useRef(STORY[initialNodeId].chapter);
  const audioRef = useRef<AudioContext | null>(null);
  const node = STORY[nodeId];

  useEffect(() => {
    setSaveAvailable(Boolean(loadSaveFromStorage()));
    const params = new URLSearchParams(window.location.search);
    const capture = params.get("scene");
    const captureNodeId = resolveCaptureNodeId(capture);
    if (captureNodeId) {
      setOpeningVisible(false);
      setCaptureMode(true);
      setNodeId(captureNodeId);
      setStats({ ...CAPTURE_STATS });
      setEvidence(Object.keys(EVIDENCE));
      setHistory([]);
      setFlags(resolveCaptureFlags(capture));
      setChoiceHistory([]);
      setVisitedNodes([captureNodeId]);
      previousChapter.current = STORY[captureNodeId].chapter;
      setMode(STORY[captureNodeId].ending ? "ending" : "play");
    }
  }, []);

  useEffect(() => {
    setVisibleChars(node.text.length);
  }, [node.id, node.text]);

  useEffect(() => {
    if (mode !== "play") return;
    if (node.evidence && !evidence.includes(node.evidence)) {
      setEvidence((current) => [...current, node.evidence!]);
      setToast(`새 단서 · ${EVIDENCE[node.evidence].title}`);
    }
    if (node.chapter !== previousChapter.current) {
      previousChapter.current = node.chapter;
    }
    const flagPatch = (node as typeof node & NodeWithMeta).setFlags;
    if (flagPatch) setFlags((current) => applyFlagPatch(current, flagPatch));
  }, [node, evidence, mode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (mode === "menu" || captureMode) return;
    const save: SaveData = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      phase: mode,
      nodeId,
      stats,
      evidence,
      history,
      flags,
      choiceHistory,
      visitedNodes,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      setSaveAvailable(true);
    } catch {
      setSaveAvailable(false);
    }
  }, [captureMode, mode, nodeId, stats, evidence, history, flags, choiceHistory, visitedNodes]);

  const playTone = useCallback((frequency = 520, duration = 0.12) => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioRef.current || new AudioContextClass();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [soundOn]);

  const goTo = useCallback((nextId: string, nextStats = stats, nextEvidence = evidence, nextFlags = flags) => {
    const destination = nextId === "resolve"
      ? resolveEnding(nextStats, nextEvidence.length, nextFlags)
      : nextId === EARLY_ROUTE_GATE_ROUTE ? resolveEarlyRouteGate(nextFlags)
      : nextId === MID_ROUTE_GATE_ROUTE ? resolveMidRouteGate(nextFlags)
      : nextId === ROUTE_BRIDGE_ROUTE ? resolveRouteBridge(nextFlags) : nextId;
    if (!STORY[destination]) return;
    setHistory((current) => [...current.slice(-24), nodeId]);
    setNodeId(destination);
    setVisitedNodes((current) => appendVisitedNode(current, destination));
    setDrawerOpen(false);
    playTone(destination.startsWith("end_") ? 784 : 540, destination.startsWith("end_") ? 0.3 : 0.1);
  }, [evidence, flags, nodeId, playTone, stats]);

  const choose = useCallback((index: number) => {
    const choice = node.choices?.[index];
    if (!choice) return;
    const choiceMeta = choice as typeof choice & ChoiceWithMeta;
    const nextStats = applyEffects(stats, choice.effects);
    const newEvidence = choice.evidence && !evidence.includes(choice.evidence) ? choice.evidence : null;
    const nextEvidence = newEvidence ? [...evidence, newEvidence] : evidence;
    const nextFlags = applyFlagPatch(flags, choiceMeta.setFlags);
    const routeImpact = getChoiceRouteImpact(choiceMeta);
    const routeToast = routeImpact ? `${routeImpact.code} 경로 기억 · ${routeImpact.label}` : null;
    const resolvedChoiceDestination = choice.next === "resolve"
      ? resolveEnding(nextStats, nextEvidence.length, nextFlags)
      : choice.next === EARLY_ROUTE_GATE_ROUTE ? resolveEarlyRouteGate(nextFlags)
      : choice.next === MID_ROUTE_GATE_ROUTE ? resolveMidRouteGate(nextFlags)
      : choice.next === ROUTE_BRIDGE_ROUTE ? resolveRouteBridge(nextFlags) : choice.next;
    const choiceId = choiceMeta.choiceId || `${node.id}:${index}`;
    setStats(nextStats);
    setEvidence(nextEvidence);
    setFlags(nextFlags);
    setChoiceHistory((current) => [...current.slice(-79), { nodeId: node.id, choiceId, label: choice.label, next: resolvedChoiceDestination }]);
    if (newEvidence && routeToast) {
      setToast(`${routeToast} · 새 단서 ${EVIDENCE[newEvidence].title}`);
    } else if (newEvidence) {
      setToast(`새 단서 · ${EVIDENCE[newEvidence].title}`);
    } else if (routeToast) {
      setToast(routeToast);
    } else if (choice.effects) {
      const changed = Object.entries(choice.effects)
        .filter(([, value]) => value)
        .map(([key, value]) => `${STAT_LABELS[key as keyof StoryStats].label} ${Number(value) > 0 ? "+" : ""}${value}`)
        .join(" · ");
      if (changed) setToast(changed);
    }
    goTo(choice.next, nextStats, nextEvidence, nextFlags);
  }, [evidence, flags, goTo, node.choices, node.id, stats]);

  const advance = useCallback(() => {
    if (visibleChars < node.text.length) {
      setVisibleChars(node.text.length);
      return;
    }
    if (node.choices || node.ending || !node.next) return;
    const nodeFlagPatch = (node as typeof node & NodeWithMeta).setFlags;
    const nextFlags = applyFlagPatch(flags, nodeFlagPatch);
    if (nodeFlagPatch) setFlags(nextFlags);
    goTo(node.next, stats, evidence, nextFlags);
  }, [evidence, flags, goTo, node, stats, visibleChars]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (mode !== "play" || drawerOpen) return;
      if ((event.key === "Enter" || event.key === " ") && !node.choices) {
        event.preventDefault();
        advance();
      }
      if (node.choices && visibleChars >= node.text.length && ["1", "2", "3"].includes(event.key)) {
        choose(Number(event.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, choose, drawerOpen, mode, node.choices, node.text.length, visibleChars]);

  const startNew = () => {
    setCaptureMode(false);
    previousChapter.current = 1;
    setNodeId(START_NODE);
    setStats({ ...INITIAL_STATS });
    setEvidence([]);
    setHistory([]);
    setFlags({});
    setChoiceHistory([]);
    setVisitedNodes([START_NODE]);
    setMode("play");
    playTone(659, 0.25);
  };

  const continueGame = () => {
    const save = loadSaveFromStorage();
    if (!save) return startNew();
    setNodeId(save.nodeId);
    setStats(save.stats);
    setEvidence(save.evidence);
    setHistory(save.history);
    setFlags(save.flags);
    setChoiceHistory(save.choiceHistory);
    setVisitedNodes(save.visitedNodes);
    setCaptureMode(false);
    previousChapter.current = STORY[save.nodeId].chapter;
    setMode(save.phase);
  };

  const chapterNodes = useMemo(() => Object.values(STORY).filter((item) => item.chapter === node.chapter && !item.ending), [node.chapter]);
  const chapterIndex = Math.max(0, chapterNodes.findIndex((item) => item.id === node.id));
  const chapterProgress = node.ending ? 100 : Math.min(96, ((chapterIndex + 1) / Math.max(1, chapterNodes.length)) * 100);
  const textComplete = visibleChars >= node.text.length;
  const endingTitle = node.ending === "balanced" ? "함께 만든 질서" : node.ending === "human" ? "사람을 남긴 기록" : "완벽한 분류의 그림자";
  const sceneArt = useMemo(() => resolveSceneArt(node, mode), [node, mode]);
  const sceneClassKey = resolveSceneClassKey(node, sceneArt.id);
  const sceneBackgroundImage = mode === "menu" ? MENU_REFERENCE_BACKGROUND : sceneArt.image;
  const staticCast = useMemo(() => resolveContextualStaticCast(node, mode), [node, mode]);
  const routeScores = useMemo(() => getRouteFlagScores(flags), [flags]);
  const routeSignals = ROUTE_SIGNAL_META.map((signal) => ({ ...signal, value: routeScores[signal.key] }));
  const routeEcho = node.chapter >= 3 ? (() => {
    const activeSignals = routeSignals.filter((signal) => signal.value > 0);
    if (!activeSignals.length) return null;
    const maxValue = Math.max(...activeSignals.map((signal) => signal.value));
    const strongestSignals = activeSignals.filter((signal) => signal.value === maxValue);
    if (strongestSignals.length > 1) {
      return { code: "MIX", echo: "앞선 선택이 여러 판단 축으로 갈라져 이어지고 있다." };
    }
    return strongestSignals[0];
  })() : null;
  const routeSummary = (() => {
    const activeSignals = routeSignals.filter((signal) => signal.value > 0);
    if (!activeSignals.length) return { code: "OPEN", text: "이번 결말은 아직 뚜렷한 누적 성향 없이 현재 단서와 스탯으로 정리되었다." };
    const maxValue = Math.max(...activeSignals.map((signal) => signal.value));
    const strongestSignals = activeSignals.filter((signal) => signal.value === maxValue);
    if (strongestSignals.length > 1) return { code: "MIX", text: "여러 판단 축이 비슷하게 누적되어, 결말은 단일한 기준보다 조정의 흔적을 더 크게 남겼다." };
    return { code: strongestSignals[0].code, text: strongestSignals[0].summary };
  })();
  const routeBranchBadge = BRANCH_RESULT_META[node.id] ?? null;
  const evidenceTotal = Object.keys(EVIDENCE).length;
  const recentChoices = choiceHistory.slice(-6).reverse();
  const recentBranchResults = visitedNodes
    .map((visitedNodeId) => {
      const result = BRANCH_RESULT_META[visitedNodeId];
      return result ? { nodeId: visitedNodeId, ...result } : null;
    })
    .filter((item): item is { nodeId: string } & BranchResultMeta => Boolean(item))
    .slice(-6)
    .reverse();
  const recentVisitedScenes = visitedNodes.slice(-6).reverse().map((visitedNodeId) => {
    const visitedNode = STORY[visitedNodeId];
    return {
      nodeId: visitedNodeId,
      location: visitedNode?.location || visitedNodeId,
      title: visitedNode ? resolveSceneArt(visitedNode, visitedNode.ending ? "ending" : "play").title : "알 수 없는 장면",
      chapter: visitedNode?.chapter,
    };
  });

  const closeOpening = () => setOpeningVisible(false);
  const toggleOpeningSound = () => {
    const video = openingVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setOpeningMuted(video.muted);
  };

  if (openingVisible) {
    return (
      <main className="opening-screen">
        <video
          ref={openingVideoRef}
          className="opening-video"
          src="/game/opening.mp4"
          autoPlay
          muted={openingMuted}
          playsInline
          onEnded={closeOpening}
          aria-label="한국학 인사팀의 이상한 모험 오프닝 영상"
        />
        <div className="opening-screen-shade" />
        <section className="opening-ui" aria-label="오프닝 영상 메뉴">
          <div className="opening-kicker">KOREAN STUDIES STORY</div>
          <h1>한국학 인사팀의<br /><em>이상한 모험</em></h1>
          <p>기록이 흔들린 밤, 첫 번째 선택이 시작된다.</p>
          <div className="opening-actions">
            <button type="button" className="opening-sound-button" onClick={toggleOpeningSound}>
              {openingMuted ? "소리 켜기" : "소리 끄기"}
            </button>
            <button type="button" className="opening-skip-button" onClick={closeOpening}>
              건너뛰고 시작하기 <span>SKIP OPENING</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`story-game mode-${mode} scene-${sceneClassKey} story-scene-${node.scene} art-${sceneArt.id} tone-${sceneArt.tone} chapter-${node.chapter} ${node.choices && textComplete ? "has-choices" : ""}`}>
      <div key={`${mode}-${sceneArt.id}`} className="scene-background active" style={{ backgroundImage: `url(${sceneBackgroundImage})`, backgroundPosition: sceneArt.backgroundPosition }} />
      {captureMode && <div className="capture-banner"><b>QA CAPTURE</b><span>이 진입 경로는 저장되지 않습니다. 실제 플레이는 새 이야기 시작 또는 이어하기를 사용하세요.</span></div>}

      <header className="story-topbar">
        <button className="story-brand" onClick={() => setMode("menu")} aria-label="시작 화면으로">
          <span className="seal-mark">韓</span>
          <span><small>KOREAN STUDIES STORY</small><b>한국학 인사팀의 이상한 모험</b></span>
        </button>
      {mode === "play" && (
          <div className="chapter-status">
            <small>CHAPTER {node.chapter} / {CHAPTER_LIST.length}</small>
            <b>{CHAPTERS[node.chapter].title}</b>
            <span><i style={{ width: `${chapterProgress}%` }} /></span>
          </div>
        )}
        <div className="top-actions">
          {mode === "play" && <button onClick={() => setDrawerOpen(true)}><span>▤</span> 사건 기록 <b>{evidence.length}/{evidenceTotal}</b></button>}
          <button onClick={() => setSoundOn((on) => !on)} aria-label={soundOn ? "소리 끄기" : "소리 켜기"}><span>{soundOn ? "♪" : "×"}</span><i>{soundOn ? "ON" : "OFF"}</i></button>
        </div>
      </header>

      {mode === "menu" && (
        <section className="story-menu">
          <div className="menu-kicker"><i /> INTERACTIVE STORY SIMULATION</div>
          <h1>한 사람의 삶은<br /><em>하나의 칸</em>에<br />들어가지 않는다</h1>
            <p>인사팀 실습생 서하린과 기록의 수호신 해치.<br />불완전한 기록으로 시작해 7장 구성 선택형 어드벤처를 완성해간다.</p>
          <div className="chapter-preview">
            {CHAPTER_LIST.map((chapter) => (
              <span key={chapter}>
                <b>0{chapter}</b>
                <i>{CHAPTERS[chapter].title}</i>
              </span>
            ))}
          </div>
          <div className="menu-buttons">
            <button className="primary-story-button" onClick={startNew}><span>새 이야기 시작</span><b>NEW STORY</b></button>
            {saveAvailable && <button className="continue-button" onClick={continueGame}><span>저장된 이야기 계속</span><b>CONTINUE</b></button>}
          </div>
          <small className="menu-note">선택은 자동으로 저장됩니다 · 키보드 1–3 선택 · Enter 진행</small>
        </section>
      )}

      {mode === "menu" && (
        <section className="menu-scene-montage" aria-label="선택에 따라 열리는 주요 상황 배경">
          <header>
            <small>SCENE ROUTES</small>
            <b>선택이 바꾸는 배경</b>
          </header>
          {MENU_SCENE_MONTAGE.map((item) => (
            <article key={item.code} style={{ backgroundImage: `url(${item.image})` }}>
              <span>{item.code}</span>
              <p><b>{item.label}</b><small>{item.note}</small></p>
            </article>
          ))}
        </section>
      )}

      {mode === "play" && (
        <>
          <aside className="story-stats" aria-label="이야기 성향">
            {(Object.keys(STAT_LABELS) as Array<keyof StoryStats>).map((key) => (
              <div key={key}><span>{STAT_LABELS[key].symbol}</span><p><small>{STAT_LABELS[key].label}</small><i><b style={{ width: `${(stats[key] / 9) * 100}%` }} /></i></p><strong>{stats[key]}</strong></div>
            ))}
          </aside>

          <aside className="route-hud" aria-label="현재 선택 경로">
            <small>ROUTE NOW</small>
            {routeSignals.map((signal) => (
              <span key={signal.key} className={signal.value > 0 ? "active" : ""}>
                <b>{signal.code}</b>
                <i><em style={{ width: `${Math.min(signal.value, 7) * 14.28}%` }} /></i>
              </span>
            ))}
          </aside>

          <section className={`scene-illustration tone-${sceneArt.tone}`} aria-label={sceneArt.title}>
            <div className="scene-art-frame">
              <div className="scene-art-image" style={{ backgroundImage: `url(${sceneArt.image})`, backgroundPosition: sceneArt.stagePosition }} />
              {staticCast.length > 0 && (
                <div className={`static-cast-layer count-${staticCast.length}`} aria-label="정지 캐릭터 컷">
                  {staticCast.map((cast) => (
                    <span
                      key={cast.key}
                      className={`static-character-card ${cast.key} pose-${cast.variant} ${cast.focus ? "focus" : "support"}`}
                      style={{ backgroundImage: `url(${STATIC_CAST_IMAGES[cast.key][cast.variant]})` }}
                    >
                      <b>{cast.label}</b>
                    </span>
                  ))}
                </div>
              )}
              <div className="scene-art-shade" />
              <div className="scene-art-caption"><small>{sceneArt.kicker}</small><b>{sceneArt.title}</b><span>{node.location}</span></div>
              {routeBranchBadge && <div className="branch-result-chip"><small><b>{routeBranchBadge.code}</b> BRANCH RESULT</small><strong>{routeBranchBadge.label}</strong><span>{routeBranchBadge.text}</span></div>}
            </div>
          </section>

          <section className={`dialogue-zone ${node.choices && textComplete ? "has-choices" : ""}`}>
            {node.choices && textComplete && (
              <div className="choice-list">
                {node.choices.map((choice, index) => {
                  const routeImpact = getChoiceRouteImpact(choice as typeof choice & ChoiceWithMeta);
                  return (
                    <button key={choice.label} onClick={() => choose(index)}>
                      <b>0{index + 1}</b>
                      <span>
                        {choice.label}
                        <small>{choice.subtext}</small>
                        {routeImpact && <em className="choice-route-impact"><strong>{routeImpact.code}</strong>{routeImpact.label} 기억에 남음</em>}
                      </span>
                      <i>→</i>
                    </button>
                  );
                })}
              </div>
            )}
            <button className="dialogue-box" onClick={advance}>
              <span className="speaker-name"><i>{node.speaker === "내레이션" ? "NARRATION" : "DIALOGUE"}</i>{node.speaker}</span>
              <p>{node.text.slice(0, visibleChars)}<em className={textComplete ? "cursor ready" : "cursor"} /></p>
              <span className="location-tag">⌖ {node.location}</span>
              {routeEcho && <span className="route-echo"><b>{routeEcho.code}</b>{routeEcho.echo}</span>}
              {!node.choices && !node.ending && textComplete && <span className="advance-label">ENTER · 계속</span>}
            </button>
            {node.ending && textComplete && <button className="ending-button" onClick={() => setMode("ending")}>엔딩 기록 보기 <span>→</span></button>}
          </section>
        </>
      )}

      {mode === "ending" && (
        <section className="ending-panel">
          <div className={`ending-seal ${node.ending}`}>{node.ending === "balanced" ? "結" : node.ending === "human" ? "心" : "序"}</div>
          <small>ENDING · {node.ending?.toUpperCase()}</small>
          <h2>{endingTitle}</h2>
          <p>{node.text}</p>
          <div className="route-verdict" aria-label="루트 서사 요약"><b>{routeSummary.code}</b><span>{routeSummary.text}</span></div>
          <div className="ending-stats">{(Object.keys(STAT_LABELS) as Array<keyof StoryStats>).map((key) => <span key={key}><small>{STAT_LABELS[key].label}</small><b>{stats[key]}</b></span>)}</div>
          <div className="route-signals" aria-label="엔딩에 반영된 누적 선택 성향">
            <small>ROUTE MEMORY</small>
            {routeSignals.map((signal) => (
              <span key={signal.key} className={signal.value > 0 ? "active" : ""}>
                <b>{signal.code}</b>
                <i><em style={{ width: `${Math.min(signal.value, 7) * 14.28}%` }} /></i>
                <strong>{signal.label}</strong>
                <small>{signal.value}</small>
              </span>
            ))}
          </div>
          {recentBranchResults.length > 0 && (
            <div className="ending-branch-milestones" aria-label="엔딩에 반영된 분기 이정표">
              <small>BRANCH MILESTONES</small>
              {recentBranchResults.slice(0, 4).map((item, index) => (
                <span key={`${item.nodeId}-${index}`}>
                  <b>{item.code}</b>
                  <p><strong>C{item.chapter} · {item.label}</strong><small>{item.text}</small></p>
                </span>
              ))}
            </div>
          )}          {recentChoices.length > 0 && (
            <div className="ending-route" aria-label="엔딩에 반영된 최근 선택">
              <small>DECISION ROUTE</small>
              {recentChoices.slice(0, 3).map((item, index) => (
                <span key={`${item.nodeId}-${item.choiceId}-${index}`}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <p><strong>{item.label}</strong><small>→ {STORY[item.next]?.location || item.next}</small></p>
                </span>
              ))}
            </div>
          )}
          <div className="ending-actions"><button className="primary-story-button" onClick={startNew}><span>다른 선택으로 다시 시작</span><b>REPLAY</b></button><button className="continue-button" onClick={() => setMode("play")}><span>마지막 장면 보기</span><b>EPILOGUE</b></button></div>
        </section>
      )}

      {drawerOpen && (
        <aside className="case-drawer">
          <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="기록 닫기" />
          <div className="case-panel">
            <header><span><small>HR CASE FILE 2026-071</small><b>이음 기록 복원 조사서</b></span><button onClick={() => setDrawerOpen(false)}>×</button></header>
            <p>확보한 단서는 마지막 심의 결과에 영향을 줍니다. 단서는 ‘정답’이 아니라 판단의 근거입니다.</p>
            <div className="evidence-list">
              {Object.entries(EVIDENCE).map(([id, item]) => {
                const found = evidence.includes(id);
                return <article key={id} className={found ? "found" : "locked"}><span>{found ? item.mark : "?"}</span><div><small>{found ? "EVIDENCE" : "LOCKED"}</small><b>{found ? item.title : "아직 발견하지 못한 단서"}</b><p>{found ? item.description : "대화와 선택을 통해 조사할 수 있습니다."}</p></div></article>;
              })}
            </div>
            <section className="route-signals compact" aria-label="누적 선택 성향">
              <small>ROUTE MEMORY</small>
              {routeSignals.map((signal) => (
                <span key={signal.key} className={signal.value > 0 ? "active" : ""}>
                  <b>{signal.code}</b>
                  <i><em style={{ width: `${Math.min(signal.value, 7) * 14.28}%` }} /></i>
                  <strong>{signal.label}</strong>
                  <small>{signal.value}</small>
                </span>
              ))}
            </section>
            {recentBranchResults.length > 0 && (
              <section className="branch-result-log" aria-label="분기 이정표">
                <header><span><small>BRANCH MILESTONES</small><b>분기 이정표</b></span></header>
                {recentBranchResults.map((item, index) => (
                  <article key={`${item.nodeId}-${index}`}>
                    <span>{item.code}</span>
                    <p><b>C{item.chapter} · {item.label}</b><small>{item.text}</small></p>
                  </article>
                ))}
              </section>
            )}            {recentVisitedScenes.length > 0 && (
              <section className="visited-scene-log" aria-label="최근 방문 장면">
                <header><span><small>SCENE TRAIL</small><b>최근 장면</b></span></header>
                {recentVisitedScenes.map((item, index) => (
                  <article key={`${item.nodeId}-${index}`}>
                    <span>{item.chapter ? `C${item.chapter}` : "--"}</span>
                    <p><b>{item.title}</b><small>{item.location}</small></p>
                  </article>
                ))}
              </section>
            )}
            {recentChoices.length > 0 && (
              <section className="choice-history-log" aria-label="최근 선택 기록">
                <header><span><small>DECISION TRAIL</small><b>최근 선택</b></span></header>
                {recentChoices.map((item, index) => (
                  <article key={`${item.nodeId}-${item.choiceId}-${index}`}>
                    <span>{String(recentChoices.length - index).padStart(2, "0")}</span>
                    <p><b>{item.label}</b><small>{STORY[item.nodeId]?.location || item.nodeId} → {STORY[item.next]?.location || item.next}</small></p>
                  </article>
                ))}
              </section>
            )}
            <footer><span>조사 진행률</span><b>{evidence.length} / {evidenceTotal}</b><span>방문 장면</span><b>{visitedNodes.length}</b></footer>
          </div>
        </aside>
      )}

      {toast && <div className="story-toast"><span>✦</span>{toast}</div>}
    </main>
  );
}
