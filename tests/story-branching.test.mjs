import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

async function loadStoryModule() {
  const source = await readFile(new URL("../app/story.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = await mkdtemp(join(tmpdir(), "story-branching-"));
  const file = join(dir, "story.mjs");
  await writeFile(file, compiled, "utf8");
  try {
    return await import(`${new URL(`file://${file}`).href}?t=${Date.now()}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function loadSceneArtModule() {
  const source = await readFile(new URL("../app/sceneArt.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = await mkdtemp(join(tmpdir(), "scene-art-"));
  const file = join(dir, "sceneArt.mjs");
  await writeFile(file, compiled, "utf8");
  try {
    return await import(`${new URL(`file://${file}`).href}?t=${Date.now()}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("final choices create distinct story scenes before resolving", async () => {
  const { STORY } = await loadStoryModule();

  assert.deepEqual(
    STORY.c7_final_resolution.choices.map((choice) => choice.next),
    ["c7_verdict_censure", "c7_verdict_reconciliation", "c7_verdict_reform"],
  );
  assert.equal(STORY.c7_verdict_censure.next, "resolve");
  assert.equal(STORY.c7_verdict_reconciliation.next, "resolve");
  assert.equal(STORY.c7_verdict_reform.next, "resolve");
  assert.equal(new Set(STORY.c7_final_resolution.choices.map((choice) => choice.choiceId)).size, 3);
});

test("chapter five choices branch into different consequence nodes", async () => {
  const { MID_ROUTE_GATE_ROUTE, STORY, resolveMidRouteGate } = await loadStoryModule();

  assert.deepEqual(
    STORY.c5_panel_plan.choices.map((choice) => choice.next),
    ["c5_resolution_censure", "c5_resolution_reconciliation", "c5_resolution_reform"],
  );
  assert.equal(STORY.c5_resolution_censure.next, "c5_resolution_censure_followup");
  assert.equal(STORY.c5_resolution_reconciliation.next, "c5_resolution_reconciliation_followup");
  assert.equal(STORY.c5_resolution_reform.next, "c5_resolution_reform_followup");
  assert.equal(STORY.c5_resolution_censure_followup.next, "c5_resolution_summary");
  assert.equal(STORY.c5_resolution_reconciliation_followup.next, "c5_resolution_summary");
  assert.equal(STORY.c5_resolution_reform_followup.next, "c5_resolution_summary");
  assert.equal(STORY.c5_internal_notice.next, MID_ROUTE_GATE_ROUTE);
  assert.equal(STORY.c5_public_trust.next, MID_ROUTE_GATE_ROUTE);
  assert.equal(STORY.c5_followup_schedule.next, MID_ROUTE_GATE_ROUTE);
  assert.deepEqual([
    resolveMidRouteGate({ panel_censure: true, summary_internal_notice: true }),
    resolveMidRouteGate({ panel_reconciliation: true, summary_public_trust: true }),
    resolveMidRouteGate({ panel_reform: true, summary_followup_schedule: true }),
    resolveMidRouteGate({ panel_censure: true, panel_reconciliation: true }),
  ], ["c6_review_order_entry", "c6_review_human_entry", "c6_review_balanced_entry", "c6_review_mixed_entry"]);
  assert.equal(STORY.c6_review_order_entry.next, "c6_review_order_followup");
  assert.equal(STORY.c6_review_human_entry.next, "c6_review_human_followup");
  assert.equal(STORY.c6_review_balanced_entry.next, "c6_review_balanced_followup");
  assert.equal(STORY.c6_review_mixed_entry.next, "c6_review_mixed_followup");
  assert.equal(STORY.c6_review_order_followup.next, "c6_review_open");
  assert.equal(STORY.c6_review_human_followup.next, "c6_review_open");
  assert.equal(STORY.c6_review_balanced_followup.next, "c6_review_open");
  assert.equal(STORY.c6_review_mixed_followup.next, "c6_review_open");
});

test("chapter six keeps prebrief and rumor-control choices on distinct routes", async () => {
  const { ROUTE_BRIDGE_ROUTE, STORY, resolveRouteBridge } = await loadStoryModule();

  assert.deepEqual(
    STORY.c6_data_review.choices.map((choice) => choice.next),
    ["c6_record_chain", "c6_witness_circle", "c6_legal_consult"],
  );
  assert.deepEqual(
    STORY.c6_boarding_call.choices.map((choice) => choice.next),
    ["c6_media_strategy", "c6_public_forum", "c6_internal_discipline"],
  );
  assert.equal(STORY.c6_record_chain_prebrief.next, "c6_boarding_call");
  assert.equal(STORY.c6_witness_circle_prebrief.next, "c6_boarding_call");
  assert.equal(STORY.c6_legal_consult_prebrief.next, "c6_boarding_call");
  assert.equal(STORY.c6_rumor_control.next, ROUTE_BRIDGE_ROUTE);
  assert.equal(STORY.c6_forum_rumor_control.next, ROUTE_BRIDGE_ROUTE);
  assert.equal(STORY.c6_discipline_rumor_control.next, ROUTE_BRIDGE_ROUTE);
  assert.deepEqual([
    resolveRouteBridge({ early_fact_path: true, prebrief_record_chain: true }),
    resolveRouteBridge({ early_human_path: true, prebrief_witness_circle: true }),
    resolveRouteBridge({ early_balance_path: true, prebrief_rule_review: true }),
    resolveRouteBridge({ early_fact_path: true, early_human_path: true }),
  ], ["c7_bridge_order", "c7_bridge_human", "c7_bridge_balanced", "c7_bridge_mixed"]);
  assert.equal(new Set(STORY.c6_boarding_call.choices.map((choice) => choice.choiceId)).size, 3);
});

test("chapter five question frames now persist as route memory", async () => {
  const { STORY, getRouteFlagScores } = await loadStoryModule();

  assert.deepEqual(STORY.c5_draft_route.choices.map((choice) => choice.choiceId), [
    "c5_frame_evidence_chain",
    "c5_frame_testimony_context",
    "c5_frame_public_balance",
  ]);
  assert.deepEqual(STORY.c5_draft_route.choices.map((choice) => choice.next), [
    "c5_evidence_bridge",
    "c5_cross_exam",
    "c5_public_plan",
  ]);
  assert.deepEqual(STORY.c5_draft_route.choices.map((choice) => getRouteFlagScores(choice.setFlags)), [
    { orderRoute: 1, humanRoute: 0, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 1, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 0, balancedRoute: 1 },
  ]);
  assert.equal(STORY.c5_evidence_bridge.next, "c5_evidence_bridge_followup");
  assert.equal(STORY.c5_cross_exam.next, "c5_cross_exam_followup");
  assert.equal(STORY.c5_public_plan.next, "c5_public_plan_followup");
  assert.equal(STORY.c5_evidence_bridge_followup.next, "c5_panel_plan");
  assert.equal(STORY.c5_cross_exam_followup.next, "c5_panel_plan");
  assert.equal(STORY.c5_public_plan_followup.next, "c5_panel_plan");
});

test("chapter seven panel assembly now persists as route memory", async () => {
  const { STORY, getRouteFlagScores } = await loadStoryModule();

  assert.deepEqual(STORY.c7_panel_assembly.choices.map((choice) => choice.choiceId), [
    "c7_panel_core_testimony",
    "c7_panel_audit_record",
    "c7_panel_expert_reform",
  ]);
  assert.deepEqual(STORY.c7_panel_assembly.choices.map((choice) => choice.next), [
    "c7_core_testimony",
    "c7_audit_statement",
    "c7_expert_input",
  ]);
  assert.deepEqual(STORY.c7_panel_assembly.choices.map((choice) => getRouteFlagScores(choice.setFlags)), [
    { orderRoute: 0, humanRoute: 1, balancedRoute: 0 },
    { orderRoute: 1, humanRoute: 0, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 0, balancedRoute: 1 },
  ]);
  assert.equal(STORY.c7_core_testimony.next, "c7_core_testimony_followup");
  assert.equal(STORY.c7_audit_statement.next, "c7_audit_statement_followup");
  assert.equal(STORY.c7_expert_input.next, "c7_expert_input_followup");
  assert.equal(STORY.c7_core_testimony_followup.next, "c7_cross_question");
  assert.equal(STORY.c7_audit_statement_followup.next, "c7_cross_question");
  assert.equal(STORY.c7_expert_input_followup.next, "c7_cross_question");
});

test("chapter seven cross answers persist before final verdict choice", async () => {
  const { STORY, getRouteFlagScores } = await loadStoryModule();

  assert.deepEqual(STORY.c7_cross_question.choices.map((choice) => choice.choiceId), [
    "c7_cross_procedure",
    "c7_cross_recovery",
    "c7_cross_summary",
  ]);
  assert.deepEqual(STORY.c7_cross_question.choices.map((choice) => getRouteFlagScores(choice.setFlags)), [
    { orderRoute: 1, humanRoute: 0, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 1, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 0, balancedRoute: 1 },
  ]);
  assert.equal(STORY.c7_cross_procedure_answer.next, "c7_cross_procedure_followup");
  assert.equal(STORY.c7_cross_recovery_answer.next, "c7_cross_recovery_followup");
  assert.equal(STORY.c7_cross_summary_answer.next, "c7_cross_summary_followup");
  assert.equal(STORY.c7_cross_procedure_followup.next, "c7_final_resolution");
  assert.equal(STORY.c7_cross_recovery_followup.next, "c7_final_resolution");
  assert.equal(STORY.c7_cross_summary_followup.next, "c7_final_resolution");
});

test("early chapters now branch into visible consequence nodes", async () => {
  const { EARLY_ROUTE_GATE_ROUTE, STORY, resolveEarlyRouteGate } = await loadStoryModule();

  assert.deepEqual(
    STORY.c3_design_review.choices.map((choice) => choice.next),
    ["c3_design_summary", "c3_design_relation_summary"],
  );
  assert.deepEqual(
    STORY.c3_final.choices.map((choice) => choice.next),
    ["c4_return_fact_notice", "c4_return_motive_notice", "c4_return_balanced_notice"],
  );
  assert.equal(STORY.c4_return_fact_notice.next, "c4_return_fact_followup");
  assert.equal(STORY.c4_return_motive_notice.next, "c4_return_motive_followup");
  assert.equal(STORY.c4_return_balanced_notice.next, "c4_return_balanced_followup");
  assert.equal(STORY.c4_return_fact_followup.next, "c4_return_notice");
  assert.equal(STORY.c4_return_motive_followup.next, "c4_return_notice");
  assert.equal(STORY.c4_return_balanced_followup.next, "c4_return_notice");
  assert.equal(STORY.c2_maze_gate_exit.next, EARLY_ROUTE_GATE_ROUTE);
  assert.deepEqual([
    resolveEarlyRouteGate({ early_fact_path: true }),
    resolveEarlyRouteGate({ early_human_path: true }),
    resolveEarlyRouteGate({ early_balance_path: true }),
    resolveEarlyRouteGate({ early_fact_path: true, early_human_path: true }),
  ], ["c3_entry_fact", "c3_entry_human", "c3_entry_balanced", "c3_entry_mixed"]);
  assert.equal(STORY.c3_entry_fact.next, "c3_entry_fact_followup");
  assert.equal(STORY.c3_entry_human.next, "c3_entry_human_followup");
  assert.equal(STORY.c3_entry_balanced.next, "c3_entry_balanced_followup");
  assert.equal(STORY.c3_entry_mixed.next, "c3_entry_mixed_followup");
  assert.equal(STORY.c3_entry_fact_followup.next, "c3_entry");
  assert.equal(STORY.c3_entry_human_followup.next, "c3_entry");
  assert.equal(STORY.c3_entry_balanced_followup.next, "c3_entry");
  assert.equal(STORY.c3_entry_mixed_followup.next, "c3_entry");
  assert.equal(new Set(STORY.c4_board_pre.choices.map((choice) => choice.choiceId)).size, 3);
  assert.ok(STORY.c4_resolution.choices.every((choice) => choice.choiceId));
});

test("scene art resolves situation-specific nodes to distinct assets", async () => {
  const [{ STORY }, { resolveSceneArt }] = await Promise.all([
    loadStoryModule(),
    loadSceneArtModule(),
  ]);

  assert.equal(resolveSceneArt(STORY.c3_final, "play").id, "maze_core");
  assert.equal(resolveSceneArt(STORY.c3_entry_fact, "play").id, "server_room");
  assert.equal(resolveSceneArt(STORY.c3_entry_human, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c3_entry_balanced, "play").id, "rule_archive");
  assert.equal(resolveSceneArt(STORY.c6_review_open, "play").id, "evidence_board");
  assert.equal(resolveSceneArt(STORY.c7_prehearing, "play").id, "panel_room");
  assert.equal(resolveSceneArt(STORY.end_order, "ending").id, "verdict_order");
  assert.equal(resolveSceneArt({ ...STORY.c2_arrival, id: "forest_crossroads_probe" }, "play").id, "forest_crossroads");
  assert.equal(resolveSceneArt({ ...STORY.c4_briefing, backgroundKey: undefined, location: "보안 카메라 검토실" }, "play").id, "cctv_room");
  assert.equal(resolveSceneArt(STORY.c1_logs, "play").id, "server_room");
  assert.equal(resolveSceneArt(STORY.c1_staff_intro, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c2_log_node, "play").id, "archive_log");
  assert.equal(resolveSceneArt(STORY.c2_waypoint, "play").id, "map_room");
  assert.equal(resolveSceneArt(STORY.c2_guard_shift, "play").id, "guard_post");
  assert.equal(resolveSceneArt(STORY.c4_return_notice, "play").id, "office_day");
  assert.equal(resolveSceneArt(STORY.c4_arrive_night, "play").id, "hearing_room");
  assert.equal(resolveSceneArt(STORY.c4_briefing, "play").id, "hearing_room");
  assert.equal(resolveSceneArt({ ...STORY.c4_resolution, backgroundKey: undefined, location: "대기 공간" }, "play").id, "hearing_room");
  assert.equal(resolveSceneArt(STORY.c4_board_pre, "play").id, "panel_room");
  assert.equal(resolveSceneArt(STORY.c4_press_plan, "play").id, "public_forum");
  assert.equal(resolveSceneArt(STORY.c5_public_plan, "play").id, "public_forum");
  assert.equal(resolveSceneArt(STORY.c4_witness_prepare, "play").id, "witness_room");
  assert.equal(STORY.c4_witness_prepare.scene, "witness");
  assert.equal(STORY.c4_hearing_prepare.scene, "hearing");
  assert.equal(STORY.c4_security_camera.scene, "cctv");
  assert.equal(STORY.c4_audit_room.scene, "archive");
  assert.equal(STORY.c2_log_node.scene, "archive");
  assert.equal(STORY.c6_media_strategy.scene, "press");
  assert.equal(STORY.c7_prehearing.scene, "panel");
  assert.equal(resolveSceneArt(STORY.c5_evidence_bridge, "play").id, "cctv_room");
  assert.equal(resolveSceneArt(STORY.c6_legal_consult, "play").id, "rule_archive");
  assert.equal(resolveSceneArt(STORY.c6_legal_consult_prebrief, "play").id, "rule_archive");
  assert.equal(resolveSceneArt(STORY.c6_witness_circle, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c5_resolution_censure, "play").id, "censure_chamber");
  assert.equal(resolveSceneArt(STORY.c5_resolution_reconciliation, "play").id, "reconciliation_desk");
  assert.equal(resolveSceneArt(STORY.c5_resolution_reform, "play").id, "reform_blueprint");
  assert.equal(STORY.c5_resolution_censure.scene, "censure");
  assert.equal(STORY.c5_resolution_reconciliation.scene, "reconciliation");
  assert.equal(STORY.c5_resolution_reform.scene, "reform");
  assert.equal(resolveSceneArt(STORY.c4_return_fact_followup, "play").id, "evidence_board");
  assert.equal(resolveSceneArt(STORY.c4_return_motive_followup, "play").id, "reconciliation_desk");
  assert.equal(resolveSceneArt(STORY.c4_return_balanced_followup, "play").id, "panel_room");
  assert.equal(resolveSceneArt(STORY.c5_resolution_censure_followup, "play").id, "censure_chamber");
  assert.equal(resolveSceneArt(STORY.c5_resolution_reconciliation_followup, "play").id, "reconciliation_desk");
  assert.equal(resolveSceneArt(STORY.c5_resolution_reform_followup, "play").id, "reform_blueprint");
  assert.equal(resolveSceneArt(STORY.c5_evidence_bridge_followup, "play").id, "cctv_room");
  assert.equal(resolveSceneArt(STORY.c5_cross_exam, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c5_cross_exam_followup, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c5_public_plan_followup, "play").id, "public_forum");
  assert.equal(resolveSceneArt(STORY.c7_core_testimony, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c7_core_testimony_followup, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c7_audit_statement_followup, "play").id, "hearing_room");
  assert.equal(resolveSceneArt(STORY.c7_expert_input, "play").id, "reform_blueprint");
  assert.equal(resolveSceneArt(STORY.c7_expert_input_followup, "play").id, "reform_blueprint");
  assert.equal(resolveSceneArt(STORY.c7_cross_procedure_followup, "play").id, "hearing_room");
  assert.equal(resolveSceneArt(STORY.c7_cross_recovery_followup, "play").id, "reconciliation_desk");
  assert.equal(resolveSceneArt(STORY.c7_cross_summary_followup, "play").id, "panel_room");
  assert.equal(resolveSceneArt(STORY.c6_review_order_entry, "play").id, "censure_chamber");
  assert.equal(resolveSceneArt(STORY.c6_review_human_entry, "play").id, "reconciliation_desk");
  assert.equal(resolveSceneArt(STORY.c6_review_balanced_entry, "play").id, "reform_blueprint");
  assert.equal(resolveSceneArt(STORY.c3_entry_fact_followup, "play").id, "server_room");
  assert.equal(resolveSceneArt(STORY.c3_entry_human_followup, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c3_entry_balanced_followup, "play").id, "rule_archive");
  assert.equal(resolveSceneArt(STORY.c7_bridge_order_followup, "play").id, "censure_chamber");
  assert.equal(resolveSceneArt(STORY.c7_bridge_human_followup, "play").id, "witness_room");
  assert.equal(resolveSceneArt(STORY.c7_bridge_balanced_followup, "play").id, "reform_blueprint");
  assert.equal(resolveSceneArt(STORY.c3_entry_mixed, "play").id, "evidence_board");
  assert.equal(resolveSceneArt(STORY.c6_review_mixed_entry, "play").id, "evidence_board");
  assert.equal(resolveSceneArt(STORY.c7_bridge_mixed, "play").id, "panel_room");
});

test("chapter one and two choices seed visible route memory", async () => {
  const { STORY, getRouteFlagScores } = await loadStoryModule();

  assert.deepEqual(STORY.c1_case_intro.choices.map((choice) => choice.choiceId), [
    "c1_seed_fact_path",
    "c1_seed_human_path",
    "c1_seed_balance_path",
  ]);
  assert.deepEqual(STORY.c2_maze_split.choices.map((choice) => choice.choiceId), [
    "c2_seed_fact_path",
    "c2_seed_balance_path",
    "c2_seed_human_path",
  ]);
  assert.deepEqual(STORY.c1_case_intro.choices.map((choice) => getRouteFlagScores(choice.setFlags)), [
    { orderRoute: 1, humanRoute: 0, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 1, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 0, balancedRoute: 1 },
  ]);
  assert.deepEqual(STORY.c2_maze_split.choices.map((choice) => getRouteFlagScores(choice.setFlags)), [
    { orderRoute: 1, humanRoute: 0, balancedRoute: 0 },
    { orderRoute: 0, humanRoute: 0, balancedRoute: 1 },
    { orderRoute: 0, humanRoute: 1, balancedRoute: 0 },
  ]);
  assert.deepEqual(getRouteFlagScores({ early_fact_path: true, early_fact_recheck: true }), {
    orderRoute: 2,
    humanRoute: 0,
    balancedRoute: 0,
  });
  assert.deepEqual(getRouteFlagScores({ early_human_path: true, early_human_recheck: true }), {
    orderRoute: 0,
    humanRoute: 2,
    balancedRoute: 0,
  });
  assert.deepEqual(getRouteFlagScores({ early_balance_path: true, early_balance_recheck: true }), {
    orderRoute: 0,
    humanRoute: 0,
    balancedRoute: 2,
  });
});

test("chapter three and four use chapter-specific route memory instead of early flags", async () => {
  const { STORY, getRouteFlagScores } = await loadStoryModule();

  assert.deepEqual(STORY.c3_design_review.choices.map((choice) => choice.setFlags), [
    { c3_design_time_axis_flag: true },
    { c3_design_relation_axis_flag: true },
  ]);
  assert.deepEqual(STORY.c3_final.choices.map((choice) => choice.setFlags), [
    { c3_final_fact_report: true },
    { c3_final_motive_report: true },
    { c3_final_balanced_report: true },
  ]);
  assert.deepEqual(STORY.c4_resolution.choices.map((choice) => choice.setFlags), [
    { c4_resolution_strict: true },
    { c4_resolution_repair: true },
    { c4_resolution_balanced: true },
  ]);
  assert.deepEqual(getRouteFlagScores({ early_fact_path: true, c3_final_fact_report: true, c4_resolution_strict: true }), {
    orderRoute: 3,
    humanRoute: 0,
    balancedRoute: 0,
  });
  assert.deepEqual(getRouteFlagScores({ early_human_path: true, c3_final_motive_report: true, c4_resolution_repair: true }), {
    orderRoute: 0,
    humanRoute: 3,
    balancedRoute: 0,
  });
  assert.deepEqual(getRouteFlagScores({ early_balance_path: true, c3_final_balanced_report: true, c4_resolution_balanced: true }), {
    orderRoute: 0,
    humanRoute: 0,
    balancedRoute: 3,
  });
});

test("story graph references only existing nodes and evidence", async () => {
  const { EARLY_ROUTE_GATE_ROUTE, EVIDENCE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, START_NODE, STORY } = await loadStoryModule();
  const nodeIds = new Set(Object.keys(STORY));
  const evidenceIds = new Set(Object.keys(EVIDENCE));
  const specialRoutes = new Set(["resolve", ROUTE_BRIDGE_ROUTE, EARLY_ROUTE_GATE_ROUTE, MID_ROUTE_GATE_ROUTE]);

  assert.equal(nodeIds.has(START_NODE), true);
  for (const node of Object.values(STORY)) {
    if (node.next && !specialRoutes.has(node.next)) assert.equal(nodeIds.has(node.next), true, `${node.id} next ${node.next}`);
    if (node.evidence) assert.equal(evidenceIds.has(node.evidence), true, `${node.id} evidence ${node.evidence}`);
    for (const choice of node.choices || []) {
      if (!specialRoutes.has(choice.next)) assert.equal(nodeIds.has(choice.next), true, `${node.id} choice next ${choice.next}`);
      if (choice.evidence) assert.equal(evidenceIds.has(choice.evidence), true, `${node.id} choice evidence ${choice.evidence}`);
    }
  }
});

test("multi-choice nodes do not immediately collapse into one destination", async () => {
  const { STORY } = await loadStoryModule();
  const collapsed = Object.values(STORY)
    .filter((node) => (node.choices?.length || 0) > 1)
    .map((node) => ({
      id: node.id,
      nexts: new Set(node.choices.map((choice) => choice.next)),
    }))
    .filter((node) => node.nexts.size === 1)
    .map((node) => node.id);

  assert.deepEqual(collapsed, []);
});

test("new chapter six branch nodes keep Korean-facing copy", async () => {
  const { STORY } = await loadStoryModule();
  const nodeIds = [
    "c6_record_chain_prebrief",
    "c6_witness_circle_prebrief",
    "c6_legal_consult_prebrief",
    "c6_forum_rumor_control",
    "c6_discipline_rumor_control",
  ];

  for (const id of nodeIds) {
    const node = STORY[id];
    assert.ok(node, id);
    assert.doesNotMatch(`${node.location} ${node.speaker} ${node.text}`, /[A-Za-z]{4,}/, id);
  }
});

test("bond contributes to ending resolution", async () => {
  const { getRouteFlagScores, resolveEnding } = await loadStoryModule();

  assert.equal(resolveEnding({ insight: 5, empathy: 5, order: 4, bond: 2 }, 5), "end_balanced");
  assert.equal(resolveEnding({ insight: 3, empathy: 4, order: 4, bond: 4 }, 4), "end_human");
  assert.equal(resolveEnding({ insight: 4, empathy: 2, order: 5, bond: 1 }, 4), "end_order");
  assert.deepEqual(getRouteFlagScores({ verdict_censure: true, verdict_reconciliation: true, verdict_reform: true }), {
    orderRoute: 2,
    humanRoute: 2,
    balancedRoute: 2,
  });
  assert.equal(resolveEnding({ insight: 4, empathy: 3, order: 4, bond: 1 }, 5, {
    early_fact_path: true,
    prebrief_record_chain: true,
    verdict_censure: true,
  }), "end_order");
  assert.equal(resolveEnding({ insight: 3, empathy: 3, order: 3, bond: 2 }, 5, {
    early_human_path: true,
    prebrief_witness_circle: true,
    verdict_reconciliation: true,
  }), "end_human");
  assert.equal(resolveEnding({ insight: 4, empathy: 4, order: 3, bond: 1 }, 5, {
    early_balance_path: true,
    prebrief_rule_review: true,
    verdict_reform: true,
  }), "end_balanced");
  assert.equal(resolveEnding({ insight: 9, empathy: 9, order: 1, bond: 9 }, 5, {
    early_human_path: true,
    prebrief_witness_circle: true,
    verdict_censure: true,
  }), "end_human");
  assert.equal(resolveEnding({ insight: 9, empathy: 1, order: 9, bond: 0 }, 5, {
    early_fact_path: true,
    prebrief_record_chain: true,
    verdict_reconciliation: true,
  }), "end_order");
  assert.equal(resolveEnding({ insight: 2, empathy: 9, order: 1, bond: 9 }, 5, {
    early_human_path: true,
    prebrief_witness_circle: true,
    verdict_reform: true,
  }), "end_human");
});

test("route bridge sends accumulated route memory to distinct chapter seven scenes", async () => {
  const { STORY, resolveRouteBridge } = await loadStoryModule();

  assert.equal(resolveRouteBridge({ early_fact_path: true, prebrief_record_chain: true, rumor_internal_discipline: true }), "c7_bridge_order");
  assert.equal(resolveRouteBridge({ early_human_path: true, prebrief_witness_circle: true, rumor_public_forum: true }), "c7_bridge_human");
  assert.equal(resolveRouteBridge({ early_balance_path: true, prebrief_rule_review: true, rumor_media_strategy: true }), "c7_bridge_balanced");
  assert.equal(STORY.c7_bridge_order.next, "c7_bridge_order_followup");
  assert.equal(STORY.c7_bridge_human.next, "c7_bridge_human_followup");
  assert.equal(STORY.c7_bridge_balanced.next, "c7_bridge_balanced_followup");
  assert.equal(STORY.c7_bridge_mixed.next, "c7_bridge_mixed_followup");
  assert.equal(STORY.c7_bridge_order_followup.next, "c7_prehearing");
  assert.equal(STORY.c7_bridge_human_followup.next, "c7_prehearing");
  assert.equal(STORY.c7_bridge_balanced_followup.next, "c7_prehearing");
  assert.equal(STORY.c7_bridge_mixed_followup.next, "c7_prehearing");
});

test("normal play graph can reach every ending", async () => {
  const { EARLY_ROUTE_GATE_ROUTE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, START_NODE, STORY, getRouteFlagScores, resolveEarlyRouteGate, resolveEnding, resolveMidRouteGate, resolveRouteBridge } = await loadStoryModule();
  const initialStats = { insight: 1, empathy: 1, order: 1, bond: 0 };
  const queue = [{ nodeId: START_NODE, stats: initialStats, evidence: new Set(), flags: {} }];
  const seen = new Set();
  const endings = new Set();
  const expectedEndingCount = Object.values(STORY).filter((node) => node.ending).length;

  function clamp(value) {
    return Math.max(0, Math.min(9, value));
  }

  function applyEffects(stats, effects = {}) {
    const next = { ...stats };
    for (const [key, value] of Object.entries(effects)) {
      next[key] = clamp((next[key] || 0) + value);
    }
    return next;
  }

  function applyFlags(flags, patch = {}) {
    return { ...flags, ...patch };
  }

  function flagSignature(flags) {
    const scores = getRouteFlagScores(flags);
    return `${scores.orderRoute},${scores.humanRoute},${scores.balancedRoute}`;
  }

  function resolveNext(nextId, stats, evidence, flags) {
    if (nextId === "resolve") return resolveEnding(stats, evidence.size, flags);
    if (nextId === EARLY_ROUTE_GATE_ROUTE) return resolveEarlyRouteGate(flags);
    if (nextId === MID_ROUTE_GATE_ROUTE) return resolveMidRouteGate(flags);
    if (nextId === ROUTE_BRIDGE_ROUTE) return resolveRouteBridge(flags);
    return nextId;
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor];
    const key = `${state.nodeId}|${state.stats.insight}|${state.stats.empathy}|${state.stats.order}|${state.stats.bond}|${[...state.evidence].sort().join(",")}|${flagSignature(state.flags)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const node = STORY[state.nodeId];
    const evidence = new Set(state.evidence);
    if (node.evidence) evidence.add(node.evidence);
    const flags = applyFlags(state.flags, node.setFlags);
    if (node.ending) {
      endings.add(node.id);
      if (endings.size === expectedEndingCount) break;
      continue;
    }
    if (node.choices?.length) {
      node.choices.forEach((choice) => {
        const nextStats = applyEffects(state.stats, choice.effects);
        const nextEvidence = new Set(evidence);
        if (choice.evidence) nextEvidence.add(choice.evidence);
        const nextFlags = applyFlags(flags, choice.setFlags);
        queue.push({
          nodeId: resolveNext(choice.next, nextStats, nextEvidence, nextFlags),
          stats: nextStats,
          evidence: nextEvidence,
          flags: nextFlags,
        });
      });
    } else {
      queue.push({
        nodeId: resolveNext(node.next, state.stats, evidence, flags),
        stats: state.stats,
        evidence,
        flags,
      });
    }
  }

  assert.deepEqual([...endings].sort(), ["end_balanced", "end_human", "end_order"]);
});
