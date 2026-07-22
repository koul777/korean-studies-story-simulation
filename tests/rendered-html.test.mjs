import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Korean-studies story simulation", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /INTERACTIVE STORY SIMULATION/);
  assert.match(html, /CHAPTER 7:/);
  assert.match(html, /새 이야기 시작|새로 시작|NEW STORY/);
  assert.match(html, /\/game\/scenes\/office-briefing\.svg/);
  assert.doesNotMatch(html, /\/game\/title-art\.png/);
});

test("server-renders scene capture routes with scene-specific art", async () => {
  const scenes = {
    office: "office-briefing.svg",
    server: "server-room.svg",
    "server-room": "server-room.svg",
    log: "server-room.svg",
    cctv: "cctv-room.svg",
    "cctv-room": "cctv-room.svg",
    security: "cctv-room.svg",
    rules: "rule-archive.svg",
    "rule-archive": "rule-archive.svg",
    archive: "rule-archive.svg",
    witness: "witness-room.svg",
    "witness-room": "witness-room.svg",
    testimony: "witness-room.svg",
    forest: "history-forest.svg",
    "forest-crossroads": "forest-crossroads.svg",
    village: "archive-village.svg",
    maze: "regulation-labyrinth.svg",
    "review-room": "review-room.svg",
    review_room: "review-room.svg",
    press: "public-forum.svg",
    board: "panel-room.svg",
    panel: "panel-room.svg",
    "panel-core": "witness-room.svg",
    "panel-core-followup": "witness-room.svg",
    "panel-audit": "hearing-room.svg",
    "panel-audit-followup": "hearing-room.svg",
    "panel-expert": "reform-blueprint.svg",
    "panel-expert-followup": "reform-blueprint.svg",
    "cross-procedure": "hearing-room.svg",
    "cross-procedure-followup": "hearing-room.svg",
    "cross-recovery": "reconciliation-desk.svg",
    "cross-recovery-followup": "reconciliation-desk.svg",
    "cross-summary": "panel-room.svg",
    "cross-summary-followup": "panel-room.svg",
    evidence: "evidence-board.svg",
    "frame-evidence": "cctv-room.svg",
    "frame-evidence-followup": "cctv-room.svg",
    "frame-testimony": "witness-room.svg",
    "frame-testimony-followup": "witness-room.svg",
    "frame-public": "public-forum.svg",
    "frame-public-followup": "public-forum.svg",
    censure: "censure-chamber.svg",
    reconciliation: "reconciliation-desk.svg",
    reform: "reform-blueprint.svg",
    "bridge-order": "censure-chamber.svg",
    "bridge-human": "witness-room.svg",
    "bridge-balanced": "reform-blueprint.svg",
    "bridge-mixed": "panel-room.svg",
    "bridge-order-followup": "censure-chamber.svg",
    "bridge-human-followup": "witness-room.svg",
    "bridge-balanced-followup": "reform-blueprint.svg",
    "bridge-mixed-followup": "panel-room.svg",
    "entry-fact": "server-room.svg",
    "entry-human": "witness-room.svg",
    "entry-balanced": "rule-archive.svg",
    "entry-mixed": "evidence-board.svg",
    "entry-fact-followup": "server-room.svg",
    "entry-human-followup": "witness-room.svg",
    "entry-balanced-followup": "rule-archive.svg",
    "entry-mixed-followup": "evidence-board.svg",
    "return-fact": "evidence-board.svg",
    "return-human": "reconciliation-desk.svg",
    "return-balanced": "panel-room.svg",
    "return-fact-followup": "evidence-board.svg",
    "return-human-followup": "reconciliation-desk.svg",
    "return-balanced-followup": "panel-room.svg",
    "archive-log": "archive-log.svg",
    "map-room": "map-room.svg",
    "guard-post": "guard-post.svg",
    "review-order": "censure-chamber.svg",
    "review-human": "reconciliation-desk.svg",
    "review-balanced": "reform-blueprint.svg",
    "review-mixed": "evidence-board.svg",
    "review-order-followup": "censure-chamber.svg",
    "review-human-followup": "reconciliation-desk.svg",
    "review-balanced-followup": "reform-blueprint.svg",
    "review-mixed-followup": "evidence-board.svg",
    forum: "public-forum.svg",
    review: "evidence-board.svg",
    hearing: "panel-room.svg",
    "censure-followup": "censure-chamber.svg",
    "reconciliation-followup": "reconciliation-desk.svg",
    "reform-followup": "reform-blueprint.svg",
    balanced: "verdict-balanced.svg",
    human: "verdict-human.svg",
    order: "verdict-order.svg",
  };
  const branchResultScenes = new Set([
    "bridge-order",
    "bridge-human",
    "bridge-balanced",
    "bridge-mixed",
    "bridge-order-followup",
    "bridge-human-followup",
    "bridge-balanced-followup",
    "bridge-mixed-followup",
    "entry-fact",
    "entry-human",
    "entry-balanced",
    "entry-mixed",
    "entry-fact-followup",
    "entry-human-followup",
    "entry-balanced-followup",
    "entry-mixed-followup",
    "return-fact",
    "return-human",
    "return-balanced",
    "return-fact-followup",
    "return-human-followup",
    "return-balanced-followup",
    "review-order",
    "review-human",
    "review-balanced",
    "review-mixed",
    "review-order-followup",
    "review-human-followup",
    "review-balanced-followup",
    "review-mixed-followup",
    "frame-evidence",
    "frame-evidence-followup",
    "frame-testimony",
    "frame-testimony-followup",
    "frame-public",
    "frame-public-followup",
    "panel-core",
    "panel-core-followup",
    "panel-audit",
    "panel-audit-followup",
    "panel-expert",
    "panel-expert-followup",
    "cross-procedure",
    "cross-procedure-followup",
    "cross-recovery",
    "cross-recovery-followup",
    "cross-summary",
    "cross-summary-followup",
    "censure-followup",
    "reconciliation-followup",
    "reform-followup",
  ]);

  for (const [scene, asset] of Object.entries(scenes)) {
    const response = await render(`/?scene=${scene}`);
    assert.equal(response.status, 200);

    const html = await response.text();
    const bodyMarkup = html.slice(html.indexOf("<body"), html.indexOf('<script id="_R_"'));
    const escapedAsset = escapeRegExp(asset);
    assert.ok(html.includes(`/game/scenes/${asset}`), `${scene} should render ${asset}`);
    assert.match(bodyMarkup, new RegExp(`class="scene-background active"[^>]*\\/game\\/scenes\\/${escapedAsset}`));
    assert.match(bodyMarkup, new RegExp(`class="scene-art-image"[^>]*\\/game\\/scenes\\/${escapedAsset}`));
    assert.doesNotMatch(bodyMarkup, /\/game\/title-art\.png/);
    if (["balanced", "human", "order"].includes(scene)) {
      assert.match(bodyMarkup, /ENDING ·/);
      assert.match(bodyMarkup, /ROUTE MEMORY/);
      const expectedCode = scene === "balanced" ? "REFORM" : scene === "human" ? "CARE" : "PROC";
      assert.match(bodyMarkup, new RegExp(`<b>${expectedCode}</b>`));
    } else {
      assert.match(bodyMarkup, /QA CAPTURE/);
      if (branchResultScenes.has(scene)) assert.match(bodyMarkup, /BRANCH RESULT/);
    }
  }
});

test("ships the seven-chapter narrative, choice systems, and visual assets", async () => {
  const [story, game, css, sceneArt, saveState, graphReport, pathReport] = await Promise.all([
    readFile(new URL("../app/story.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/StoryGame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/sceneArt.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/saveState.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/story-graph-report.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/story-path-report.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(story, /chapter:\s*1/);
  assert.match(story, /chapter:\s*2/);
  assert.match(story, /chapter:\s*3/);
  assert.match(story, /chapter:\s*4/);
  assert.match(story, /chapter:\s*5/);
  assert.match(story, /chapter:\s*6/);
  assert.match(story, /chapter:\s*7/);
  assert.match(story, /c4_return_notice/);
  assert.match(story, /c4_resolution/);
  assert.match(story, /c5_assembly_open/);
  assert.match(story, /c5_resolution_summary/);
  assert.match(story, /c6_review_open/);
  assert.match(story, /c7_final_resolution/);
  assert.match(story, /EARLY_ROUTE_GATE_ROUTE/);
  assert.match(story, /MID_ROUTE_GATE_ROUTE/);
  assert.match(story, /resolveEarlyRouteGate/);
  assert.match(story, /resolveMidRouteGate/);
  assert.match(story, /c3_entry_fact/);
  assert.match(story, /c3_entry_human/);
  assert.match(story, /c3_entry_balanced/);
  assert.match(story, /c6_review_order_entry/);
  assert.match(story, /c6_review_human_entry/);
  assert.match(story, /c6_review_balanced_entry/);
  assert.match(story, /insight/);
  assert.match(story, /empathy/);
  assert.match(story, /order/);
  assert.match(story, /bond/);
  assert.match(story, /FINAL_VERDICT_WEIGHT = 2/);
  assert.doesNotMatch(story, /resolveExplicitVerdictEnding/);
  assert.match(story, /\| "hearing"/);
  assert.match(story, /\| "reform"/);
  assert.match(story, /scene: "cctv"/);
  assert.match(story, /scene: "panel"/);
  assert.doesNotMatch(story, /harinPose/);
  assert.doesNotMatch(story, /haechiPose/);

  assert.match(game, /localStorage/);
  assert.match(game, /const choose = useCallback/);
  assert.match(game, /case-drawer/);
  assert.match(game, /schemaVersion/);
  assert.match(game, /choiceHistory/);
  assert.match(game, /resolvedChoiceDestination/);
  assert.match(game, /STORY\[item\.next\]/);
  assert.match(game, /nodeFlagPatch/);
  assert.match(game, /choice-history-log/);
  assert.match(game, /visited-scene-log/);
  assert.match(game, /SCENE TRAIL/);
  assert.match(game, /ending-route/);
  assert.match(game, /ending-branch-milestones/);
  assert.match(game, /getRouteFlagScores/);
  assert.match(game, /resolveEarlyRouteGate/);
  assert.match(game, /resolveMidRouteGate/);
  assert.match(game, /route-signals/);
  assert.match(game, /route-hud/);
  assert.match(game, /route-echo/);
  assert.match(game, /branch-result-chip/);
  assert.match(game, /BRANCH RESULT/);
  assert.match(game, /BRANCH_RESULT_META/);
  assert.match(game, /recentBranchResults/);
  assert.match(game, /branch-result-log/);
  assert.match(game, /MENU_SCENE_MONTAGE/);
  assert.match(game, /MENU_REFERENCE_BACKGROUND/);
  assert.match(game, /STATIC_CAST_IMAGES/);
  assert.match(game, /resolveStaticCast/);
  assert.match(game, /\/game\/characters\/character-sheet-1\.jpg/);
  assert.match(game, /\/game\/characters\/character-sheet-2\.jpg/);
  assert.match(game, /\/game\/reference\/story-reference-1\.jpg/);
  assert.match(game, /menu-scene-montage/);
  assert.match(game, /선택이 바꾸는 배경/);
  assert.match(game, /normalizeCaptureSceneKey/);
  assert.match(game, /forest-crossroads/);
  assert.match(game, /review-room/);
  assert.match(game, /BRANCH MILESTONES/);
  assert.match(graphReport, /branchDepthRows/);
  assert.match(graphReport, /routeChoiceRows/);
  assert.match(graphReport, /routeGateDepthRows/);
  assert.match(graphReport, /unreachableNodeIds/);
  assert.match(graphReport, /terminalNonEndingNodeIds/);
  assert.match(graphReport, /missingDestinationRefs/);
  assert.match(pathReport, /mixed_route/);
  assert.match(pathReport, /choiceByNode/);
  assert.match(game, /return-fact/);
  assert.match(game, /return-human/);
  assert.match(game, /return-balanced/);
  assert.match(game, /entry-mixed-followup/);
  assert.match(game, /return-fact-followup/);
  assert.match(game, /censure-followup/);
  assert.match(game, /review-mixed-followup/);
  assert.match(game, /bridge-mixed-followup/);
  assert.match(game, /frame-evidence-followup/);
  assert.match(game, /panel-core-followup/);
  assert.match(game, /cross-procedure-followup/);
  assert.match(game, /c7_cross_procedure_followup/);
  assert.match(game, /c5_frame_evidence_chain/);
  assert.match(game, /c7_panel_core_testimony/);
  assert.match(story, /c3_final_fact_report/);
  assert.match(story, /c4_resolution_balanced/);
  assert.match(game, /c7_bridge_mixed_followup/);
  assert.match(game, /choice-route-impact/);
  assert.match(game, /getChoiceRouteImpact/);
  assert.match(game, /경로 기억/);
  assert.match(game, /route-verdict/);
  assert.match(game, /capture-banner/);
  assert.match(game, /code: "MIX"/);
  assert.match(game, /ROUTE MEMORY/);
  assert.match(game, /evidenceTotal/);
  assert.match(game, /loadSaveFromStorage/);
  assert.match(game, /resolveSceneArt/);
  assert.doesNotMatch(game, /harin-16\.png/);
  assert.doesNotMatch(game, /haechi-16\.png/);
  assert.doesNotMatch(game, /title-art\.png/);
  assert.doesNotMatch(game, /focus-ring/);
  assert.doesNotMatch(game, /scene-speaker-chip/);
  assert.doesNotMatch(game, /document-chip/);
  assert.doesNotMatch(game, /floating-pages/);
  assert.doesNotMatch(game, /scene-lens/);
  assert.doesNotMatch(game, /scene-transition/);
  assert.doesNotMatch(game, /story-grain/);
  assert.doesNotMatch(game, /chapter-epilogue-aura/);
  assert.doesNotMatch(game, /scene-aura/);
  assert.doesNotMatch(game, /scene-glow/);
  assert.doesNotMatch(game, /chapter-glow/);
  assert.doesNotMatch(game, /scene-light/);
  assert.doesNotMatch(game, /scene-vignette/);
  assert.doesNotMatch(game, /setInterval/);
  assert.doesNotMatch(game, /current \+ 2/);
  assert.doesNotMatch(game, /chapter-splash/);
  assert.match(css, /\.choice-list/);
  assert.match(css, /\.scene-illustration/);
  assert.match(css, /width:\s*min\(76vw,\s*1180px\)/);
  assert.match(css, /brightness\(0\.9\)/);
  assert.match(css, /transition:\s*none/);
  assert.match(css, /\.route-signals/);
  assert.match(css, /\.route-hud/);
  assert.match(css, /\.route-echo/);
  assert.match(css, /\.branch-result-chip/);
  assert.match(css, /\.branch-result-log/);
  assert.match(css, /\.menu-scene-montage/);
  assert.match(css, /\.static-cast-layer/);
  assert.match(css, /\.static-character-card/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /\.choice-route-impact/);
  assert.match(css, /\.route-verdict/);
  assert.match(css, /\.ending-branch-milestones/);
  assert.match(css, /\.visited-scene-log/);
  assert.match(css, /\.capture-banner/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /animation:\s*none/);
  assert.doesNotMatch(css, /@keyframes/);
  assert.doesNotMatch(css, /lens-sway 9s ease-in-out infinite/);
  assert.doesNotMatch(css, /scene-lens/);
  assert.doesNotMatch(css, /@keyframes lens-sway/);
  assert.doesNotMatch(css, /focus-pulse 4\.2s ease-in-out infinite/);
  assert.doesNotMatch(css, /focus-ring/);
  assert.doesNotMatch(css, /scene-speaker-chip/);
  assert.doesNotMatch(css, /document-chip/);
  assert.doesNotMatch(css, /@keyframes focus-pulse/);
  assert.doesNotMatch(css, /page-drift calc\(8s \+ var\(--i\) \* 0\.65s\) ease-in-out infinite/);
  assert.doesNotMatch(css, /floating-pages/);
  assert.doesNotMatch(css, /@keyframes page-drift/);
  assert.doesNotMatch(css, /grain 0\.25s steps\(2\) infinite/);
  assert.doesNotMatch(css, /story-grain/);
  assert.doesNotMatch(css, /@keyframes grain/);
  assert.doesNotMatch(css, /scene-transition/);
  assert.doesNotMatch(css, /@keyframes scene-flash/);
  assert.doesNotMatch(css, /chapter-epilogue-aura/);
  assert.doesNotMatch(css, /@keyframes epilogue-veil/);
  assert.doesNotMatch(css, /chapter-splash/);
  assert.doesNotMatch(css, /@keyframes splash/);
  assert.doesNotMatch(css, /scene-aura/);
  assert.doesNotMatch(css, /scene-glow/);
  assert.doesNotMatch(css, /chapter-glow/);
  assert.doesNotMatch(css, /scene-light/);
  assert.doesNotMatch(css, /scene-vignette/);
  assert.doesNotMatch(css, /@keyframes blink/);
  assert.doesNotMatch(css, /@keyframes choices-in/);
  assert.doesNotMatch(css, /@keyframes ending-in/);
  assert.doesNotMatch(css, /@keyframes drawer-in/);
  assert.doesNotMatch(css, /@keyframes toast/);
  assert.doesNotMatch(css, /translate:\s*0 -3px/);
  assert.doesNotMatch(css, /translate:\s*-7px 0/);
  assert.doesNotMatch(css, /scene-card-in 560ms/);
  assert.doesNotMatch(css, /choices-in 400ms/);
  assert.doesNotMatch(css, /ending-in 600ms/);
  assert.doesNotMatch(css, /drawer-in 450ms/);
  assert.doesNotMatch(css, /toast 2\.3s/);
  assert.doesNotMatch(css, /epilogue-veil 2s ease-in-out infinite/);
  assert.doesNotMatch(css, /actor-breathe/);
  assert.match(sceneArt, /public_forum/);
  assert.match(sceneArt, /review_room/);
  assert.match(sceneArt, /evidence_board/);
  assert.match(sceneArt, /panel_room/);
  assert.match(sceneArt, /reconciliation_desk/);
  assert.match(sceneArt, /censure_chamber/);
  assert.match(sceneArt, /reform_blueprint/);
  assert.match(sceneArt, /cctv_room/);
  assert.match(sceneArt, /rule_archive/);
  assert.match(sceneArt, /witness_room/);
  assert.match(sceneArt, /archive_log/);
  assert.match(sceneArt, /map_room/);
  assert.match(sceneArt, /guard_post/);
  assert.match(saveState, /parseSaveData/);
  assert.match(saveState, /appendVisitedNode/);
  assert.match(saveState, /parsed\.schemaVersion !== SAVE_SCHEMA_VERSION/);
  assert.match(saveState, /parsed\.contentVersion !== CONTENT_VERSION/);
  assert.match(sceneArt, /\/game\/scenes\/public-forum\.svg/);
  assert.doesNotMatch(sceneArt, /history-forest\.png|archive-village\.png|regulation-labyrinth\.png/);
  assert.match(game, /office: "c1_open"/);
  assert.match(game, /cctv: "c5_evidence_bridge"/);
  assert.match(game, /rules: "c6_legal_consult"/);
  assert.match(game, /witness: "c6_witness_circle"/);
  assert.match(game, /forum: "c5_panel_plan"/);

  assert.doesNotMatch(`${game}\n${sceneArt}`, /\/game\/(?:title-art|history-forest|archive-village|regulation-labyrinth)\.png/);

  const sceneSvgAssets = [
    "server-room.svg",
    "office-briefing.svg",
    "archive-log.svg",
    "map-room.svg",
    "guard-post.svg",
    "hearing-room.svg",
    "public-forum.svg",
    "review-room.svg",
    "cctv-room.svg",
    "rule-archive.svg",
    "witness-room.svg",
    "forest-crossroads.svg",
    "history-forest.svg",
    "archive-village.svg",
    "regulation-labyrinth.svg",
    "evidence-board.svg",
    "panel-room.svg",
    "reconciliation-desk.svg",
    "censure-chamber.svg",
    "reform-blueprint.svg",
    "verdict-balanced.svg",
    "verdict-human.svg",
    "verdict-order.svg",
  ];

  await Promise.all(sceneSvgAssets.map((asset) => access(new URL(`../public/game/scenes/${asset}`, import.meta.url))));

  const sceneSvgSources = await Promise.all(
    sceneSvgAssets.map(async (asset) => [
      asset,
      await readFile(new URL(`../public/game/scenes/${asset}`, import.meta.url), "utf8"),
    ]),
  );

  for (const [asset, source] of sceneSvgSources) {
    assert.doesNotMatch(source, /<animate|animateTransform|animateMotion|@keyframes|animation\s*:|repeatCount|harin|haechi/i, asset);
  }
});
