import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const load = async (name) => JSON.parse(await readFile(resolve(root, name), "utf8"));
const failures = [];
const checks = [];

function check(condition, message) {
  checks.push(message);
  if (!condition) failures.push(message);
}

const [brief, props, layout, openings, reviews, references, dealer, animation, runtime] = await Promise.all([
  load("room-brief.json"),
  load("props.json"),
  load("room-layout.json"),
  load("openings.json"),
  load("milestone-reviews.json"),
  load("reference-images.json"),
  load("specs/dealer-system.json"),
  load("specs/animation-contract.json"),
  load("specs/runtime-contract.json")
]);

check(brief.family === "gameplay-room", "room family is gameplay-room");
check(brief.productionCamera.viewport[0] === 390 && brief.productionCamera.viewport[1] === 844, "portrait reference viewport is 390x844");
check(brief.performanceBudget.maxSceneTriangles <= 180000, "mobile triangle ceiling is at most 180k");
check(brief.creditBudget.approvalRequired === true, "paid-service approval is required");
check(props.generation.status === "blocked-pending-function-approval", "Meshy submissions are blocked pending approval");
check(props.generation.maxChargedAttemptsPerAsset === 2, "charged attempts are capped at two per asset");

const ids = new Set(props.assets.map((asset) => asset.id));
for (const instance of layout.instances) {
  check(ids.has(instance.assetId), `layout asset exists: ${instance.assetId}`);
}

const shoe = layout.instances.find((item) => item.id === "shoe-01");
const dragon = layout.instances.find((item) => item.id === "dragon-card-anchor");
const tiger = layout.instances.find((item) => item.id === "tiger-card-anchor");
check(shoe?.screenSide === "camera-left" && shoe.location[0] < 0, "shoe is locked to camera-left");
check(dragon?.screenSide === "camera-left" && dragon.location[0] < 0, "Dragon anchor is camera-left");
check(tiger?.screenSide === "camera-right" && tiger.location[0] > 0, "Tiger anchor is camera-right");
check(animation.coordinateContract.cardTurnCount === 1, "card reveal turn count is exactly one");
check(animation.hardFailures.includes("second card appears without executing deal-card"), "automatic second-card appearance is a hard failure");

const arrival = openings.openings.find((opening) => opening.id === openings.primaryArrival.openingId);
check(arrival?.type === "door", "primary arrival is a functional door/open passage");
check(arrival?.widthMeters >= 2.4, "primary arrival clear width is at least 2.4m");
check(arrival?.depthMeters >= 0.35, "primary arrival has visible passage depth");
check(openings.openings.filter((opening) => opening.type === "deep_alcove").every((opening) => opening.depthMeters >= Math.max(0.35, opening.heightMeters * 0.15)), "display alcoves meet minimum depth");

check(dealer.baseBodies.length === 2, "female and male dealer base bodies are declared");
check(runtime.authority === "server-round-service", "round authority is server-side by contract");
check(reviews.function.status === "pending", "Function gate remains pending human approval");
check(reviews.form.status === "blocked" && reviews.runtime.status === "blocked", "Form and Runtime gates remain blocked");

for (const item of [...references.assets, ...references.visualTargets]) {
  await access(resolve(root, item.path));
  check(true, `reference file exists: ${item.path}`);
}

if (failures.length) {
  console.error(`Function package failed ${failures.length}/${checks.length} checks:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Function package passed ${checks.length} structural and contract checks.`);
console.log("Gate remains pending explicit human approval; this result does not authorize paid generation.");
