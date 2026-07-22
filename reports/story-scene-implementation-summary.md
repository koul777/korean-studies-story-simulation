# Story Scene Implementation Summary

Primary session file: `reports/overnight_sessions/session-20260721-220158.jsonl`
Latest ongoing session file: `reports/overnight_sessions/session-20260722-012411.jsonl`

## Goal

Replace repetitive character sprite movement with static scene imagery, make backgrounds match the story situation, add more varied situations, and make choices lead to visible story differences.

## Implemented

- Replaced the animated character stage with a static scene-art renderer in `app/StoryGame.tsx`.
- Removed runtime dependence on `frameTick`, sprite sheet frame selection, `.actor`, and repeated character breathing animation.
- Removed obsolete `harinPose` and `haechiPose` story metadata after the renderer moved to scene images.
- Added `app/sceneArt.ts` as the scene-art manifest and resolver.
- Added situation-specific SVG wallpapers under `public/game/scenes/`.
- Moved forest-trace, archive-village, and regulation-labyrinth runtime art from legacy top-level PNG paths to static SVG backgrounds under `public/game/scenes/`.
- Replaced the default office/menu background with `office-briefing.svg`, so the base scene is no longer character-centered.
- Updated the base SSR regression expectation so the menu must render `office-briefing.svg` and must not reintroduce `title-art.png`.
- Added story metadata for `BackgroundKey`, `StoryFlag`, `choiceId`, `setFlags`, and node-level `backgroundKey`.
- Added visible consequence nodes across early, middle, and late chapters.
- Eliminated immediate multi-choice collapse points: multi-choice nodes no longer all route directly to one identical destination.
- Updated `resolveEnding()` so `bond` affects ending resolution.
- Hardened save data with `schemaVersion`, `contentVersion`, `phase`, `flags`, `choiceHistory`, and `visitedNodes`.
- Prevented `?scene=` capture routes from overwriting real saved progress.
- Moved `?scene=` capture selection into server-visible initial props so SSR/static inspection routes render the requested scene immediately.
- Added direct capture aliases for office, CCTV/security, rule/archive, and witness/testimony scenes.
- Added direct capture aliases for server/log, press, and board scenes.
- Updated ending capture aliases so `?scene=balanced`, `?scene=human`, and `?scene=order` render the ending panel immediately, not just ending background art.
- Ending capture aliases seed matching route flags, so balanced/human/order captures show REFORM/CARE/PROC route verdicts instead of an empty OPEN state.
- Added a recent scene trail in the case drawer so the player can see the last visited locations, not just a raw visited-node count.
- Added a visible QA capture banner explaining that capture URLs do not autosave.
- Made accumulated branch flags contribute to final ending resolution through procedure, recovery, and reform route scores.
- Weighted final verdict flags more strongly than ordinary route flags so the last hearing choice has visible influence on ending resolution.
- Added decision trail UI in the case drawer and ending route summary in the ending panel.
- Added ending-screen branch milestones so the final panel can show the major route-gate consequences that shaped the ending, not only the latest choices.
- Added visible route-memory UI for procedure, recovery, and reform tendencies in the case drawer and ending panel.
- Added late-chapter route echo text so prior branch tendencies are recalled during later dialogue scenes.
- Route echo now shows a mixed-route message on tied route scores instead of defaulting to the first route.
- Extracted save parsing and normalization into `app/saveState.ts` with direct unit coverage.
- Fixed evidence totals to use the actual `EVIDENCE` count instead of a hard-coded `5`.
- Adjusted desktop, mobile, and low-height mobile layout to avoid major UI overlap.
- Added graph/path report scripts for durable evidence of route structure and ending reachability.
- Extended the graph report script with `branchDepthRows` and `routeGateDepthRows`, so future reports can show how many story beats each branch stays distinct before rejoining.
- Extended the graph report script with reachable-node, unreachable-node, terminal non-ending, and missing-destination sections using expanded special route destinations.
- Added `routeChoiceRows` to the graph report script so flagged choices expose their route-score impact in durable report data.
- Added a `mixed_route` profile to the path report script with per-node choice overrides, so mixed-route behavior is represented by a durable representative playthrough.

## Verification

- `npm test` passed with 15 tests.
- `npm run lint` passed with no errors.
- `scripts/story-graph-report.mjs` reported 122 nodes, 20 choice nodes, 3 endings, 0 collapsed multi-choice nodes, and 15 scene-art keys used.
- `scripts/story-path-report.mjs` proved representative full-chapter paths and confirmed all three endings are reachable from normal play.
- `scripts/story-path-report.mjs` now reports route scores for representative paths: fact/order reaches orderRoute 7, human/recovery reaches humanRoute 8, and balanced/reform reaches balancedRoute 6.
- Server-render test confirmed `/?scene=office`, `/?scene=cctv`, `/?scene=rules`, and `/?scene=witness` render their scene-specific SVG art in the initial HTML body.
- Server-render test confirmed `/?scene=balanced`, `/?scene=human`, and `/?scene=order` render ending panels with route-memory UI.
- Save-state unit tests confirmed stale schema/content versions are rejected and valid saves normalize stats, evidence, flags, choice history, and visited nodes.
- Regression tests confirm `harinPose` and `haechiPose` no longer remain in the story data.
- Browser smoke confirmed `.actor` count is `0` in play, capture, and ending routes.
- Browser smoke confirmed the office/menu scene uses `/game/scenes/office-briefing.svg` instead of a character-centered title image.
- Browser smoke confirmed capture routes for maze, review, hearing, forum, forest, and order scenes.
- Browser smoke confirmed capture routes for office, CCTV, rules, and witness scenes use `office-briefing.svg`, `cctv-room.svg`, `rule-archive.svg`, and `witness-room.svg` with no measured scene/dialogue overlap.
- Browser smoke confirmed capture routes for server, press, and board scenes use `server-room.svg`, `public-forum.svg`, and `hearing-room.svg` with QA capture banners and `.actor` count `0`.
- Browser smoke confirmed late-game choice buttons show PROC, CARE, and REFORM route-impact chips.
- Browser smoke confirmed `?scene=balanced` renders a REFORM route verdict, nonzero route-memory, and `.actor` count `0`.
- Browser smoke confirmed the case drawer renders a reverse-chronological scene trail alongside the decision trail, with `.actor` count `0`.
- Rebalanced overused review-room scenes: `review_room` usage dropped from 29 to 9, while server room, hearing room, public forum, and witness room now cover more situation-specific story beats.
- Fixed Chapter 4 fallback mismatches that had office/pre-hearing scenes resolving to `maze_core`; latest graph report shows `maze_core` usage reduced to 1.
- Changed the Chapter 4 fallback art from `maze_core` to `hearing_room` so future pre-hearing nodes do not accidentally inherit the maze background.
- Moved early staff interview scenes to `witness_room`, the rule-review prebrief to `rule_archive`, and the public-facing Chapter 5 branch to `public_forum`.
- Added dedicated scene art for `evidence_board`, `panel_room`, `reconciliation_desk`, `censure_chamber`, and `reform_blueprint`, so board review, final panel, recovery, censure, and reform-planning beats no longer reuse generic review/hearing/verdict art.
- Added dedicated Chapter 2 branch art for `archive_log`, `map_room`, and `guard_post`, so log reconstruction, waypoint comparison, and guard-shift investigation no longer reuse the same archive village background.
- Added direct capture aliases for `panel`, `evidence`, `censure`, `reconciliation`, and `reform` so the new situation-specific scenes are easy to inspect.
- Added direct capture aliases for `archive-log`, `map-room`, and `guard-post` so the early branch-specific scenes are easy to inspect.
- Disabled default infinite ambient CSS motion for lens sway, focus pulse, drifting pages, grain jitter, epilogue veil, and cursor blink so the game reads as static scene imagery by default.
- Added route flags to Chapter 1 and Chapter 2 choices so early fact, human, and balance decisions immediately become part of route memory.
- Chapter 2 now uses separate early recheck route flags, so repeating the same investigation tendency in Chapter 1 and Chapter 2 accumulates route memory instead of collapsing into one boolean.
- Chapter 3 and Chapter 4 route-affecting choices now use chapter-specific route-memory flags instead of mutating `early_*_path`, so later same-direction choices accumulate without overwriting the original early route memory.
- Added an `early_route_gate` after Chapter 2 so accumulated early route memory now changes the Chapter 3 entry scene before the story rejoins the main investigation.
- Early, mid, and final route gates now use explicit mixed-route scenes when route memory ties instead of silently treating ties as balanced/reform.
- Added direct capture aliases for `entry-mixed`, `review-mixed`, and `bridge-mixed` so mixed-route scenes can be inspected directly.
- Added direct capture aliases and branch milestone metadata for follow-up consequence scenes, so route consequences stay inspectable after the first branch-result scene.
- Added route-memory flags, follow-up scenes, capture aliases, and branch milestone metadata for Chapter 5 question frames and Chapter 7 panel assembly choices.
- Added explicit situation backgrounds and capture-route expectations for the Chapter 5 question-frame and Chapter 7 panel-assembly branch/follow-up scenes.
- Extended Chapter 7 cross-question answers with follow-up scenes, capture aliases, and branch milestone metadata before the final verdict choice.
- Adjusted route-bridge regression expectations to use pre-bridge route-memory flags instead of post-bridge final verdict flags.
- Extended SSR capture-route expectations to mixed and follow-up aliases and defined the missing `--sunset` CSS variable used by branch milestone gradients.
- Extended SSR capture-route expectations to convenience aliases such as log/security/archive/testimony/forest/village/maze/forum/review/hearing, and require `BRANCH RESULT` on branch-result capture scenes.
- Replaced the start-screen right-side abstraction with a static `MENU_SCENE_MONTAGE` of real scene SVGs, so the first screen previews route-specific backgrounds before play begins.
- Restored character presence as non-animated stills: menu mode now uses the provided story reference background, and play mode renders static Harin/Hae-chi character-sheet crops that switch between idle, search, brief, judge, and low poses by speaker and scene context.
- Expanded capture aliases to normalized asset names such as `server-room`, `forest-crossroads`, `review-room`, and underscore variants, and tightened SSR expectations so both the page background and scene frame must use the expected scene SVG.
- Added source-level static SVG checks to keep `public/game/scenes/*.svg` free of embedded animation tags, CSS keyframes, repeat animation attributes, and old character-name markers.
- Removed the release-test expectation that legacy top-level PNG scene files must exist; current checks focus on preventing runtime references to those legacy PNG paths.
- Promoted `backgroundKey` into the rendered scene class via `resolveSceneClassKey`, so the UI can style concrete situations such as `scene-cctv-room`, `scene-panel-room`, and `scene-reform-blueprint` instead of flattening everything into the old generic scene bucket.
- Upgraded ten story nodes from generic `office/village/maze` scene labels into concrete `archive`, `hearing`, `panel`, `cctv`, `witness`, `press`, `censure`, `reconciliation`, and `reform` scene labels, including explicit `backgroundKey` values for the camera and audit rooms.
- Added capture aliases for `entry-fact`, `entry-human`, and `entry-balanced`, and updated graph/path report scripts to understand the new early route gate.
- Added a `mid_route_gate` after Chapter 5 summary choices so procedure, recovery, and reform-heavy routes now enter Chapter 6 through different pre-review briefing scenes.
- Added capture aliases for `review-order`, `review-human`, and `review-balanced`, and updated graph/path report scripts to understand the new mid route gate.
- Added a static in-play `ROUTE NOW` HUD so the current procedure, recovery, and reform tendency is visible during play without opening the case drawer.
- Added route-impact toast feedback so a flagged choice immediately says which procedure, recovery, reform, or mixed route memory it just added.
- Added a static `BRANCH RESULT` badge on early, mid, and final route-gate scenes so route-gated story scenes are visibly marked as accumulated choice consequences.
- Branch result scenes now share a `BRANCH_RESULT_META` table and remain visible in the case drawer as `BRANCH MILESTONES`, so early, mid, and final route decisions persist after the scene changes.
- Extended early, mid, and final route gates with follow-up consequence scenes before they rejoin the common path, so route choices stay visible for more than one story beat.
- Extended Chapter 4 return-result and Chapter 5 resolution-result branches with follow-up consequence scenes before they rejoin the common path.
- Extended `BRANCH RESULT` coverage and capture aliases to the existing Chapter 4 return-result scenes: `return-fact`, `return-human`, and `return-balanced`.
- Final verdict flags now add a strong route weight without directly overriding accumulated stats and route memory, so the last choice cannot erase the earlier story path by itself.
- Changed decision history to store the resolved destination scene after route gates, not only the abstract gate sentinel, so saved decision trails reflect the actual story branch reached.
- Non-choice node advancement now applies node-level flags synchronously before resolving route gates or endings, reducing timing risk between React effects and story routing.
- Updated the case drawer and ending decision route to display the actual destination scene reached by each saved choice.
- Moved route-impact chips from Chapter 5+ to all flagged choices, and route echo from Chapter 5+ to Chapter 3+, so route direction becomes visible closer to the player's early decisions.
- Removed the leftover speaker `focus-ring` overlay and its CSS so the play surface no longer implies character positions behind the dialogue.
- Removed the scene-frame `scene-speaker-chip` overlay so speaker identity lives in the dialogue box instead of on top of the scene image.
- Removed the scene-frame `document-chip` overlay so document status no longer covers the scene image.
- Removed the global `floating-pages` overlay and its CSS so situation-specific scene images are not covered by unrelated decorative paper fragments.
- Removed global `scene-lens`, `scene-transition`, and `story-grain` overlays so scene images are not covered by non-story visual effects or per-node flash transitions.
- Removed the late-chapter `chapter-epilogue-aura` overlay so Chapter 5+ situation art is not covered by an unrelated global veil.
- Removed the full-screen `chapter-splash` overlay so chapter changes no longer cover the scene art with a separate animated title screen.
- Removed remaining static global atmosphere overlays (`scene-aura`, `scene-glow`, `chapter-glow`, `scene-light`, and `scene-vignette`) so scene images are no longer tinted by non-story layers.
- Removed the interval-driven typewriter reveal so dialogue text appears immediately instead of animating on every story node.
- Removed remaining automatic CSS entrance/fade motions for scene cards, choices, ending panels, drawer, toast, cursor blink, and progress/stat bars.
- Removed hover translate movement from primary, continue, and choice buttons so interaction feedback no longer shifts UI elements around the static scene.
- Removed the leftover unused @keyframes scene-card-in definition and kept mobile choice scenes image-first instead of dimming or collapsing the scene art.
- Aligned rendered HTML/CSS regression checks with the no-automatic-motion direction by removing the old requirement that CSS contain `@keyframes` and adding a broad `@keyframes` negative check.
- Shifted the play layout toward an image-first scene card by widening the scene art frame and reducing dark overlays/filters on scene images.
- Added route-impact chips inside late-game choice buttons so players can see whether a choice will be remembered as procedure, recovery, reform, or mixed-route context.
- Added an ending route-verdict summary sentence so the final panel explains how the accumulated route tendency shaped the ending.
- Browser smoke confirmed the mobile case drawer renders route-memory signals and still has `.actor` count `0`.
- Browser smoke confirmed a restored procedure-heavy save shows the `PROC` route echo in Chapter 5 with `.actor` count `0`.
- Browser smoke confirmed `?scene=forest` does not overwrite an existing save.
- Browser smoke confirmed current-version saves restore the ending panel and legacy saves are ignored.
- Browser smoke confirmed normal play choices persist `choiceHistory`, `flags`, and unique `visitedNodes`.
- Mobile smoke at `390x844` and low-height mobile smoke at `390x620` confirmed no measured scene/choice/dialogue overlap.
- Desktop smoke at `1440x900` confirmed the scene frame, dialogue, stats, and chapter status did not overlap.

## Evidence Artifacts

- `reports/visual-first-scene-clear.png`
- `reports/visual-mobile-forest.png`
- `reports/visual-capture-forest.png`
- `reports/visual-capture-forum.png`
- `reports/visual-capture-hearing.png`
- `reports/visual-capture-order.png`
- `reports/visual-capture-cctv.png`
- `reports/visual-mobile-choices-fixed.png`
- `reports/visual-choice-history-drawer.png`
- `reports/visual-ending-route.png`
- `reports/visual-mobile-low-height.png`
- `reports/visual-early-branch.png`
- `reports/visual-normal-save-choice.png`
- `reports/visual-office-briefing-clear.png`
- `reports/visual-route-signals-drawer.png`
- `reports/visual-route-echo.png`
- `reports/visual-choice-route-impact.png`
- `reports/visual-scene-trail-drawer.png`
- `reports/story-graph-report.json`
- `reports/story-path-report.json`

## Remaining Risks

- Static SVG wallpapers cover the missing situation art without external assets, but dedicated raster illustrations would look richer.
- Automated browser checks currently live as session evidence, not as committed Playwright tests, to avoid adding a hard dependency on local Chrome in the project test suite.
- The static SVG scene set is now broad enough for the current routes, but dedicated hand-authored illustrations would still improve production polish.
- Legacy sprite files still exist under `public/game/`, but app/tests/scripts no longer reference them except for negative regression checks.
- Current-turn scene-art and motion reductions have not been revalidated by command in this turn because validation was not explicitly requested.
- Route-gate branches now last longer than before, but early, mid, and bridge gates still eventually rejoin common investigation tracks. A deeper production pass could give each route a longer chapter-specific subplot.
- Some branch choices intentionally converge after follow-up scenes to preserve the seven-chapter spine. If the design target becomes a larger visual novel, these are the next candidates for fully separate arcs.
- The latest source-level changes have not been build/test verified in this turn because validation was not explicitly requested.
