import type { BackgroundKey, StoryNode } from "./story";

export type SceneArtKey =
  | "office_day"
  | "server_room"
  | "forest_trace"
  | "archive_village"
  | "archive_log"
  | "map_room"
  | "guard_post"
  | "maze_core"
  | "hearing_room"
  | "panel_room"
  | "public_forum"
  | "review_room"
  | "evidence_board"
  | "cctv_room"
  | "rule_archive"
  | "witness_room"
  | "forest_crossroads"
  | "verdict_balanced"
  | "verdict_human"
  | "verdict_order"
  | "reconciliation_desk"
  | "censure_chamber"
  | "reform_blueprint";

type SceneTone = "office" | "forest" | "archive" | "maze" | "hearing" | "public" | "verdict";

export type SceneArt = {
  id: SceneArtKey;
  image: string;
  title: string;
  kicker: string;
  tone: SceneTone;
  backgroundPosition: string;
  stagePosition: string;
};

export const SCENE_ART: Record<SceneArtKey, SceneArt> = {
  office_day: {
    id: "office_day",
    image: "/game/scenes/generated/office-briefing.png",
    title: "이상 징후 브리핑룸",
    kicker: "HR INCIDENT ROOM",
    tone: "office",
    backgroundPosition: "center 52%",
    stagePosition: "center 50%",
  },
  server_room: {
    id: "server_room",
    image: "/game/scenes/generated/server-room.png",
    title: "로그 추적 서버실",
    kicker: "LIVE TRACE",
    tone: "maze",
    backgroundPosition: "center 48%",
    stagePosition: "center 54%",
  },
  forest_trace: {
    id: "forest_trace",
    image: "/game/scenes/history-forest.svg",
    title: "숲의 흔적 기록지",
    kicker: "HISTORY TRACE",
    tone: "forest",
    backgroundPosition: "center 57%",
    stagePosition: "center 54%",
  },
  archive_village: {
    id: "archive_village",
    image: "/game/scenes/archive-village.svg",
    title: "증언이 모이는 기록 마을",
    kicker: "ARCHIVE VILLAGE",
    tone: "archive",
    backgroundPosition: "center 48%",
    stagePosition: "center 50%",
  },
  archive_log: {
    id: "archive_log",
    image: "/game/scenes/generated/archive-log.png",
    title: "과거 기록 보관소",
    kicker: "ARCHIVE LOG",
    tone: "archive",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  map_room: {
    id: "map_room",
    image: "/game/scenes/map-room.svg",
    title: "동선 지도 비교실",
    kicker: "ROUTE MAP",
    tone: "archive",
    backgroundPosition: "center 48%",
    stagePosition: "center 48%",
  },
  guard_post: {
    id: "guard_post",
    image: "/game/scenes/guard-post.svg",
    title: "경비 교대 로그존",
    kicker: "GUARD SHIFT",
    tone: "forest",
    backgroundPosition: "center 52%",
    stagePosition: "center 52%",
  },
  maze_core: {
    id: "maze_core",
    image: "/game/scenes/regulation-labyrinth.svg",
    title: "규정의 미로 핵심부",
    kicker: "RULE MAZE",
    tone: "maze",
    backgroundPosition: "center 53%",
    stagePosition: "center 51%",
  },
  hearing_room: {
    id: "hearing_room",
    image: "/game/scenes/generated/hearing-room.png",
    title: "비공개 청문 준비실",
    kicker: "HEARING ROOM",
    tone: "hearing",
    backgroundPosition: "center 45%",
    stagePosition: "center 46%",
  },
  panel_room: {
    id: "panel_room",
    image: "/game/scenes/panel-room.svg",
    title: "최종 심문 패널룸",
    kicker: "PANEL ASSEMBLY",
    tone: "hearing",
    backgroundPosition: "center 48%",
    stagePosition: "center 48%",
  },
  public_forum: {
    id: "public_forum",
    image: "/game/scenes/generated/public-forum.png",
    title: "공개 심의 포럼",
    kicker: "PUBLIC FORUM",
    tone: "public",
    backgroundPosition: "center 44%",
    stagePosition: "center 44%",
  },
  review_room: {
    id: "review_room",
    image: "/game/scenes/review-room.svg",
    title: "사전 검토 데이터룸",
    kicker: "REVIEW DESK",
    tone: "hearing",
    backgroundPosition: "center 56%",
    stagePosition: "center 57%",
  },
  evidence_board: {
    id: "evidence_board",
    image: "/game/scenes/evidence-board.svg",
    title: "증거 연결 보드",
    kicker: "EVIDENCE BOARD",
    tone: "hearing",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  cctv_room: {
    id: "cctv_room",
    image: "/game/scenes/generated/cctv-room.png",
    title: "보안 카메라 검토실",
    kicker: "CCTV REVIEW",
    tone: "hearing",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  rule_archive: {
    id: "rule_archive",
    image: "/game/scenes/rule-archive.svg",
    title: "예외 조항 서가",
    kicker: "RULE ARCHIVE",
    tone: "hearing",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  witness_room: {
    id: "witness_room",
    image: "/game/scenes/generated/witness-room.png",
    title: "목격자 조정실",
    kicker: "WITNESS ROOM",
    tone: "archive",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  forest_crossroads: {
    id: "forest_crossroads",
    image: "/game/scenes/forest-crossroads.svg",
    title: "숲의 기록 갈림길",
    kicker: "FOREST CROSSROADS",
    tone: "forest",
    backgroundPosition: "center 52%",
    stagePosition: "center 52%",
  },
  verdict_balanced: {
    id: "verdict_balanced",
    image: "/game/scenes/verdict-balanced.svg",
    title: "균형 판정 보고 데스크",
    kicker: "BALANCED VERDICT",
    tone: "verdict",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  verdict_human: {
    id: "verdict_human",
    image: "/game/scenes/verdict-human.svg",
    title: "회복 조치 합의 테이블",
    kicker: "HUMAN VERDICT",
    tone: "verdict",
    backgroundPosition: "center 47%",
    stagePosition: "center 47%",
  },
  verdict_order: {
    id: "verdict_order",
    image: "/game/scenes/verdict-order.svg",
    title: "절차 확정 기록실",
    kicker: "ORDER VERDICT",
    tone: "verdict",
    backgroundPosition: "center 52%",
    stagePosition: "center 52%",
  },
  reconciliation_desk: {
    id: "reconciliation_desk",
    image: "/game/scenes/reconciliation-desk.svg",
    title: "회복 조정 테이블",
    kicker: "RECOVERY DESK",
    tone: "verdict",
    backgroundPosition: "center 49%",
    stagePosition: "center 49%",
  },
  censure_chamber: {
    id: "censure_chamber",
    image: "/game/scenes/censure-chamber.svg",
    title: "절차 문책 심의실",
    kicker: "CENSURE CHAMBER",
    tone: "hearing",
    backgroundPosition: "center 50%",
    stagePosition: "center 50%",
  },
  reform_blueprint: {
    id: "reform_blueprint",
    image: "/game/scenes/generated/reform-blueprint.png",
    title: "재발방지 설계실",
    kicker: "REFORM BLUEPRINT",
    tone: "public",
    backgroundPosition: "center 48%",
    stagePosition: "center 48%",
  },
};

const CHAPTER_FALLBACK: Record<StoryNode["chapter"], SceneArtKey> = {
  1: "office_day",
  2: "forest_trace",
  3: "archive_village",
  4: "hearing_room",
  5: "public_forum",
  6: "review_room",
  7: "hearing_room",
};

const BACKGROUND_KEY_ART: Partial<Record<BackgroundKey, SceneArtKey>> = {
  office: "office_day",
  forest: "forest_trace",
  village: "archive_village",
  archive_log: "archive_log",
  map_room: "map_room",
  guard_post: "guard_post",
  maze: "maze_core",
  return: "verdict_balanced",
  panel_room: "panel_room",
  evidence_board: "evidence_board",
  hearing_room: "hearing_room",
  review_room: "review_room",
  public_forum: "public_forum",
  censure_chamber: "censure_chamber",
  reconciliation_desk: "reconciliation_desk",
  reform_blueprint: "reform_blueprint",
  cctv_room: "cctv_room",
  rule_archive: "rule_archive",
  witness_room: "witness_room",
  forest_crossroads: "forest_crossroads",
  server_room: "server_room",
};

type NodeWithArt = StoryNode & { backgroundKey?: string };

function hasSceneArtKey(value: string | undefined): value is SceneArtKey {
  return Boolean(value && value in SCENE_ART);
}

function inferSceneArtKey(node: StoryNode): SceneArtKey {
  const explicit = (node as NodeWithArt).backgroundKey;
  const mapped = explicit ? BACKGROUND_KEY_ART[explicit as BackgroundKey] : undefined;
  if (mapped) return mapped;
  if (hasSceneArtKey(explicit)) return explicit;
  if (node.ending === "balanced") return "verdict_balanced";
  if (node.ending === "human") return "verdict_human";
  if (node.ending === "order") return "verdict_order";

  const search = `${node.id} ${node.location}`.toLowerCase();

  if (/cctv|camera|security|보안|카메라/.test(search)) return "cctv_room";
  if (/crossroads|갈림길/.test(search)) return "forest_crossroads";
  if (/review|audit|data|ledger|board|검토|감사|장부|데이터|사전/.test(search)) return "review_room";
  if (/hearing|panel|assembly|청문|패널|심의/.test(search)) return "hearing_room";
  if (/press|media|forum|public|공개|언론/.test(search)) return "public_forum";
  if (/witness|testimony|interview|증언|목격|진술/.test(search)) return "witness_room";
  if (/rule|regulation|exception|규정|조항|예외/.test(search)) return "rule_archive";
  if (/maze|rule|regulation|규정|미로|조항/.test(search)) return "maze_core";
  if (/village|archive|interview|witness|keeper|마을|증언|목격|기록관/.test(search)) return "archive_village";
  if (/forest|trace|guard|waypoint|숲|흔적|경비/.test(search)) return "forest_trace";
  if (/server|log|camera|security|로그|서버|보안|카메라/.test(search)) return "server_room";
  if (node.scene === "maze") return "maze_core";
  if (node.scene === "village") return "archive_village";
  if (node.scene === "forest") return "forest_trace";
  if (node.scene === "archive") return "archive_log";
  if (node.scene === "hearing") return "hearing_room";
  if (node.scene === "panel") return "panel_room";
  if (node.scene === "cctv") return "cctv_room";
  if (node.scene === "witness") return "witness_room";
  if (node.scene === "press") return "public_forum";
  if (node.scene === "censure") return "censure_chamber";
  if (node.scene === "reconciliation") return "reconciliation_desk";
  if (node.scene === "reform") return "reform_blueprint";
  if (node.scene === "return") return "verdict_balanced";

  return CHAPTER_FALLBACK[node.chapter] || "office_day";
}

export function resolveSceneArt(node: StoryNode, mode: "menu" | "play" | "ending"): SceneArt {
  if (mode === "menu") return SCENE_ART.office_day;
  return SCENE_ART[inferSceneArtKey(node)];
}
