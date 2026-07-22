import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

async function loadSaveStateModule() {
  const [storySource, saveSource] = await Promise.all([
    readFile(new URL("../app/story.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/saveState.ts", import.meta.url), "utf8"),
  ]);
  const dir = await mkdtemp(join(tmpdir(), "save-state-"));
  const storyFile = join(dir, "story.mjs");
  const saveFile = join(dir, "saveState.mjs");
  const compilerOptions = {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  };

  await writeFile(storyFile, ts.transpileModule(storySource, { compilerOptions }).outputText, "utf8");
  await writeFile(
    saveFile,
    ts.transpileModule(saveSource.replaceAll("\"./story\"", "\"./story.mjs\""), { compilerOptions }).outputText,
    "utf8",
  );

  try {
    return await import(`${new URL(`file://${saveFile}`).href}?t=${Date.now()}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("parseSaveData rejects stale schema and content versions", async () => {
  const { CONTENT_VERSION, SAVE_SCHEMA_VERSION, parseSaveData } = await loadSaveStateModule();
  const validShape = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    phase: "play",
    nodeId: "c5_panel_plan",
  };

  assert.equal(parseSaveData(null), null);
  assert.equal(parseSaveData("{not-json"), null);
  assert.equal(parseSaveData(JSON.stringify({ ...validShape, schemaVersion: SAVE_SCHEMA_VERSION - 1 })), null);
  assert.equal(parseSaveData(JSON.stringify({ ...validShape, contentVersion: "legacy" })), null);
  assert.equal(parseSaveData(JSON.stringify({ ...validShape, nodeId: "missing_node" })), null);
});

test("parseSaveData normalizes save history, flags, evidence, and visited nodes", async () => {
  const { CONTENT_VERSION, SAVE_SCHEMA_VERSION, parseSaveData } = await loadSaveStateModule();
  const save = parseSaveData(JSON.stringify({
    schemaVersion: SAVE_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    phase: "ending",
    nodeId: "c5_panel_plan",
    stats: { insight: 12, empathy: "4", order: -3, bond: 2.4 },
    evidence: ["security_camera", "missing_evidence", "security_camera"],
    history: ["c1_open", "missing_node", "c2_arrival"],
    flags: { early_fact_path: true, verdict_censure: false, invalid: "yes" },
    choiceHistory: [
      { nodeId: "c1_case_intro", choiceId: "fact", label: "기록부터 대조한다", next: "c1_logs" },
      { nodeId: "bad" },
    ],
    visitedNodes: ["c1_open", "c5_panel_plan", "c2_arrival"],
  }));

  assert.ok(save);
  assert.equal(save.phase, "play");
  assert.deepEqual(save.stats, { insight: 9, empathy: 4, order: 0, bond: 2 });
  assert.deepEqual(save.evidence, ["security_camera"]);
  assert.deepEqual(save.history, ["c1_open", "c2_arrival"]);
  assert.deepEqual(save.flags, { early_fact_path: true, verdict_censure: false });
  assert.deepEqual(save.choiceHistory, [
    { nodeId: "c1_case_intro", choiceId: "fact", label: "기록부터 대조한다", next: "c1_logs" },
  ]);
  assert.deepEqual(save.visitedNodes, ["c1_open", "c2_arrival", "c5_panel_plan"]);
});
