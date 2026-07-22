import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const storySource = await readFile(resolve(root, "app/story.ts"), "utf8");
const sceneArtSource = await readFile(resolve(root, "app/sceneArt.ts"), "utf8");

const combinedSource = `${storySource}\n${sceneArtSource.replace(/import type[^\n]+\n/g, "")}`;
const compiled = ts.transpileModule(combinedSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { EARLY_ROUTE_GATE_ROUTE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, START_NODE, STORY, getRouteFlagScores, resolveEarlyRouteGate, resolveMidRouteGate, resolveRouteBridge, resolveSceneArt } = await import(moduleUrl);

const nodes = Object.values(STORY);
const choiceNodes = nodes.filter((node) => node.choices?.length);
const collapsedChoiceNodes = choiceNodes.filter((node) => new Set(node.choices.map((choice) => choice.next)).size === 1);
const artCounts = {};
const chapterCounts = {};
const branchingRows = [];
const branchDepthRows = [];
const routeChoiceRows = [];
const earlyRouteGateSources = [];
const midRouteGateSources = [];
const routeBridgeSources = [];

const specialRouteIds = new Set([EARLY_ROUTE_GATE_ROUTE, MID_ROUTE_GATE_ROUTE, ROUTE_BRIDGE_ROUTE, "resolve"]);
const endingIds = nodes.filter((node) => node.ending).map((node) => node.id);
const specialRouteDestinations = {
  [EARLY_ROUTE_GATE_ROUTE]: [
    resolveEarlyRouteGate({ early_fact_path: true }),
    resolveEarlyRouteGate({ early_human_path: true }),
    resolveEarlyRouteGate({ early_balance_path: true }),
    resolveEarlyRouteGate({ early_fact_path: true, early_human_path: true }),
  ],
  [MID_ROUTE_GATE_ROUTE]: [
    resolveMidRouteGate({ panel_censure: true, summary_internal_notice: true }),
    resolveMidRouteGate({ panel_reconciliation: true, summary_public_trust: true }),
    resolveMidRouteGate({ panel_reform: true, summary_followup_schedule: true }),
    resolveMidRouteGate({ panel_censure: true, panel_reconciliation: true }),
  ],
  [ROUTE_BRIDGE_ROUTE]: [
    resolveRouteBridge({ early_fact_path: true, prebrief_record_chain: true }),
    resolveRouteBridge({ early_human_path: true, prebrief_witness_circle: true }),
    resolveRouteBridge({ early_balance_path: true, prebrief_rule_review: true }),
    resolveRouteBridge({ early_fact_path: true, early_human_path: true }),
  ],
  resolve: endingIds,
};

function expandDestination(nextId) {
  return specialRouteDestinations[nextId] || (nextId ? [nextId] : []);
}

function outgoingNodeIds(node) {
  const destinations = node.choices?.length ? node.choices.map((choice) => choice.next) : [node.next];
  return [...new Set(destinations.flatMap(expandDestination))];
}

function traceLinearPath(startId, maxNodes = 18) {
  const path = [];
  const seen = new Set();
  let currentId = startId;
  while (currentId && !specialRouteIds.has(currentId) && STORY[currentId] && !seen.has(currentId) && path.length < maxNodes) {
    const node = STORY[currentId];
    path.push(currentId);
    seen.add(currentId);
    if (node.ending || node.choices?.length || !node.next) break;
    currentId = node.next;
  }
  return path;
}

function findFirstCommonNode(paths) {
  const [firstPath = []] = paths;
  return firstPath.find((nodeId) => paths.every((path) => path.includes(nodeId))) || null;
}

function summarizeBranchDepth(id, chapter, destinations) {
  const uniqueDestinations = [...new Set(destinations)];
  const paths = uniqueDestinations.map((destination) => traceLinearPath(destination));
  const firstCommonNode = findFirstCommonNode(paths);
  const stepsBeforeJoin = paths.map((path) => firstCommonNode ? path.indexOf(firstCommonNode) : path.length);
  return {
    id,
    chapter,
    destinations: uniqueDestinations,
    firstCommonNode,
    minStepsBeforeJoin: stepsBeforeJoin.length ? Math.min(...stepsBeforeJoin) : 0,
    maxStepsBeforeJoin: stepsBeforeJoin.length ? Math.max(...stepsBeforeJoin) : 0,
    paths,
  };
}

for (const node of nodes) {
  const artId = resolveSceneArt(node, "play").id;
  artCounts[artId] = (artCounts[artId] || 0) + 1;
  chapterCounts[node.chapter] = (chapterCounts[node.chapter] || 0) + 1;
  if (node.choices?.length) {
    branchingRows.push({
      id: node.id,
      chapter: node.chapter,
      choices: node.choices.length,
      destinations: [...new Set(node.choices.map((choice) => choice.next))],
    });
    branchDepthRows.push(summarizeBranchDepth(node.id, node.chapter, node.choices.map((choice) => choice.next)));
    for (const choice of node.choices) {
      if (!choice.setFlags) continue;
      routeChoiceRows.push({
        nodeId: node.id,
        choiceId: choice.choiceId || `${node.id}:unknown`,
        next: choice.next,
        setFlags: choice.setFlags,
        routeScores: getRouteFlagScores(choice.setFlags),
      });
    }
  }
  if (node.next === EARLY_ROUTE_GATE_ROUTE) earlyRouteGateSources.push(node.id);
  if (node.next === MID_ROUTE_GATE_ROUTE) midRouteGateSources.push(node.id);
  if (node.next === ROUTE_BRIDGE_ROUTE) routeBridgeSources.push(node.id);
}

const routeGateDepthRows = [
  summarizeBranchDepth("early_route_gate", 3, specialRouteDestinations[EARLY_ROUTE_GATE_ROUTE]),
  summarizeBranchDepth("mid_route_gate", 6, specialRouteDestinations[MID_ROUTE_GATE_ROUTE]),
  summarizeBranchDepth("route_bridge", 7, specialRouteDestinations[ROUTE_BRIDGE_ROUTE]),
];

const reachableIds = new Set();
const queue = [START_NODE];
for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const id = queue[cursor];
  if (reachableIds.has(id) || !STORY[id]) continue;
  reachableIds.add(id);
  for (const nextId of outgoingNodeIds(STORY[id])) {
    if (!reachableIds.has(nextId)) queue.push(nextId);
  }
}

const unreachableNodeIds = Object.keys(STORY).filter((id) => !reachableIds.has(id));
const terminalNonEndingNodeIds = nodes
  .filter((node) => !node.ending && !node.choices?.length && !node.next)
  .map((node) => node.id);
const missingDestinationRefs = nodes.flatMap((node) =>
  outgoingNodeIds(node)
    .filter((nextId) => !STORY[nextId])
    .map((nextId) => ({ from: node.id, to: nextId })),
);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    nodes: nodes.length,
    choiceNodes: choiceNodes.length,
    endings: nodes.filter((node) => node.ending).length,
    collapsedChoiceNodes: collapsedChoiceNodes.length,
    artKeysUsed: Object.keys(artCounts).length,
    routeGateDepthRows: routeGateDepthRows.length,
    routeChoiceRows: routeChoiceRows.length,
    reachableNodes: reachableIds.size,
    unreachableNodes: unreachableNodeIds.length,
    terminalNonEndingNodes: terminalNonEndingNodeIds.length,
    missingDestinationRefs: missingDestinationRefs.length,
  },
  artCounts,
  chapterCounts,
  collapsedChoiceNodeIds: collapsedChoiceNodes.map((node) => node.id),
  earlyRouteGateSources,
  midRouteGateSources,
  routeBridgeSources,
  branchingRows,
  branchDepthRows,
  routeChoiceRows,
  routeGateDepthRows,
  unreachableNodeIds,
  terminalNonEndingNodeIds,
  missingDestinationRefs,
};

await mkdir(resolve(root, "reports"), { recursive: true });
await writeFile(resolve(root, "reports/story-graph-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report.totals, null, 2));
