import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "app/story.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { EARLY_ROUTE_GATE_ROUTE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, START_NODE, STORY, getRouteFlagScores, resolveEarlyRouteGate, resolveEnding, resolveMidRouteGate, resolveRouteBridge } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const profiles = [
  { name: "fact_order", choice: 0 },
  { name: "human_recovery", choice: 1 },
  { name: "balanced_reform", choice: 2 },
  {
    name: "mixed_route",
    choice: 0,
    choiceByNode: {
      c1_case_intro: 0,
      c2_maze_split: 1,
      c5_panel_plan: 0,
      c5_resolution_summary: 1,
      c6_data_review: 2,
      c6_boarding_call: 1,
      c7_final_resolution: 2,
    },
  },
];

const initialStats = { insight: 1, empathy: 1, order: 1, bond: 0 };

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

function walk(profile) {
  let nodeId = START_NODE;
  let stats = { ...initialStats };
  let flags = {};
  const evidence = new Set();
  const choices = [];
  const nodes = [];
  const chapters = new Set();

  for (let guard = 0; guard < 300; guard += 1) {
    const node = STORY[nodeId];
    if (!node) throw new Error(`Missing node ${nodeId}`);
    nodes.push(nodeId);
    chapters.add(node.chapter);
    if (node.evidence) evidence.add(node.evidence);
    flags = applyFlags(flags, node.setFlags);
    if (node.ending) {
      return {
        profile: profile.name,
        ending: nodeId,
        endingType: node.ending,
        nodeCount: nodes.length,
        chapters: [...chapters].sort((a, b) => a - b),
        evidenceCount: evidence.size,
        stats,
        flags,
        routeScores: getRouteFlagScores(flags),
        choices,
        nodes,
      };
    }
    if (node.choices?.length) {
      const requestedIndex = profile.choiceByNode?.[nodeId] ?? profile.choice;
      const index = Math.min(requestedIndex, node.choices.length - 1);
      const choice = node.choices[index];
      choices.push({
        nodeId,
        choiceId: choice.choiceId || `${nodeId}:${index}`,
        label: choice.label,
        next: choice.next,
      });
      stats = applyEffects(stats, choice.effects);
      if (choice.evidence) evidence.add(choice.evidence);
      flags = applyFlags(flags, choice.setFlags);
      nodeId = resolveNext(choice.next, stats, evidence, flags);
    } else {
      nodeId = resolveNext(node.next, stats, evidence, flags);
    }
    if (!nodeId) throw new Error(`Node ${node.id} has no next route`);
  }
  throw new Error(`Path ${profile.name} exceeded guard limit`);
}

function stateKey(state) {
  return [
    state.nodeId,
    state.stats.insight,
    state.stats.empathy,
    state.stats.order,
    state.stats.bond,
    [...state.evidence].sort().join(","),
    flagSignature(state.flags),
  ].join("|");
}

function findReachableEndings() {
  const queue = [{
    nodeId: START_NODE,
    stats: { ...initialStats },
    evidence: new Set(),
    flags: {},
    nodeCount: 0,
    choiceCount: 0,
  }];
  const seen = new Set();
  const endings = {};
  const expectedEndingCount = Object.values(STORY).filter((node) => node.ending).length;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor];
    const key = stateKey(state);
    if (seen.has(key)) continue;
    seen.add(key);

    const node = STORY[state.nodeId];
    if (!node) throw new Error(`Missing node ${state.nodeId}`);
    const evidence = new Set(state.evidence);
    if (node.evidence) evidence.add(node.evidence);
    const flags = applyFlags(state.flags, node.setFlags);
    const nodeCount = state.nodeCount + 1;

    if (node.ending) {
      endings[node.id] ||= {
        endingType: node.ending,
        stats: state.stats,
        evidenceCount: evidence.size,
        flags,
        routeScores: getRouteFlagScores(flags),
        nodeCount,
        choiceCount: state.choiceCount,
      };
      if (Object.keys(endings).length === expectedEndingCount) break;
      continue;
    }

    if (node.choices?.length) {
      node.choices.forEach((choice) => {
        const nextStats = applyEffects(state.stats, choice.effects);
        const nextEvidence = new Set(evidence);
        if (choice.evidence) nextEvidence.add(choice.evidence);
        const nextFlags = applyFlags(flags, choice.setFlags);
        const nextId = resolveNext(choice.next, nextStats, nextEvidence, nextFlags);
        queue.push({
          nodeId: nextId,
          stats: nextStats,
          evidence: nextEvidence,
          flags: nextFlags,
          nodeCount,
          choiceCount: state.choiceCount + 1,
        });
      });
    } else {
      const nextId = resolveNext(node.next, state.stats, evidence, flags);
      if (!nextId) throw new Error(`Node ${node.id} has no next route`);
      queue.push({
        nodeId: nextId,
        stats: state.stats,
        evidence,
        flags,
        nodeCount,
        choiceCount: state.choiceCount,
      });
    }
  }

  return endings;
}

const paths = profiles.map(walk);
const reachableEndings = findReachableEndings();
const report = {
  generatedAt: new Date().toISOString(),
  paths,
  reachableEndings,
  summary: paths.map((path) => ({
    profile: path.profile,
    ending: path.ending,
    nodeCount: path.nodeCount,
    chapters: path.chapters,
    choices: path.choices.length,
    evidenceCount: path.evidenceCount,
    routeScores: path.routeScores,
  })),
  reachableEndingIds: Object.keys(reachableEndings).sort(),
};

await mkdir(resolve(root, "reports"), { recursive: true });
await writeFile(resolve(root, "reports/story-path-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  summary: report.summary,
  reachableEndingIds: report.reachableEndingIds,
}, null, 2));
