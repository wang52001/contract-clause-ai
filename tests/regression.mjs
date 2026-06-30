import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const contractsDir = join(__dirname, "fixtures/contracts");
const expectedDir = join(__dirname, "fixtures/expected");

const BASE_URL = process.env.BASE_URL ?? "";

async function loadCases() {
  const files = await readdir(contractsDir);
  const cases = [];
  for (const f of files.sort()) {
    if (!f.endsWith(".txt")) continue;
    const name = f.replace(/\.txt$/, "");
    const text = await readFile(join(contractsDir, f), "utf8");
    let expected;
    try {
      expected = JSON.parse(await readFile(join(expectedDir, `${name}.json`), "utf8"));
    } catch {
      throw new Error(`Missing expected JSON for ${name}`);
    }
    cases.push({ name, file: f, text, expected });
  }
  return cases;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFixtures(cases) {
  let pass = 0;
  for (const c of cases) {
    assert(c.text.trim().length >= 80, `${c.file}: text too short (<80 chars), API will reject`);
    assert(Array.isArray(c.expected.expectedClauses), `${c.name}: expectedClauses must be array`);
    assert(Array.isArray(c.expected.expectedMissingAnyOf), `${c.name}: expectedMissingAnyOf must be array`);
    assert(Array.isArray(c.expected.expectedRiskLevelIn), `${c.name}: expectedRiskLevelIn must be array`);
    for (const cl of c.expected.expectedClauses) {
      assert(
        Array.isArray(cl.severityIn) && cl.severityIn.length > 0,
        `${c.name}: clause ${cl.type} severityIn must be non-empty array`
      );
    }
    console.log(`  ✓ ${c.name} fixture OK (${c.text.length} chars)`);
    pass++;
  }
  return pass;
}

async function runOnline(cases) {
  let pass = 0;
  let fail = 0;
  for (const c of cases) {
    process.stdout.write(`  → ${c.name} ... `);
    try {
      const res = await fetch(`${BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: c.text, mode: "basic" }),
      });
      const data = await res.json();
      if (!res.ok || !data.result || !data.risk) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { result, risk } = data;

      for (const exp of c.expected.expectedClauses) {
        const found = result.clauses.find((cl) => cl.type === exp.type);
        if (!found) throw new Error(`missing clause: ${exp.type}`);
        if (!exp.severityIn.includes(found.severity)) {
          throw new Error(
            `clause ${exp.type} severity '${found.severity}' not in ${JSON.stringify(exp.severityIn)}`
          );
        }
      }

      const missingTypes = (result.missing_protections ?? []).map((m) => m.type);
      if (c.expected.expectedMissingAnyOf.length > 0) {
        const hasAny = c.expected.expectedMissingAnyOf.some((t) => missingTypes.includes(t));
        if (!hasAny) {
          throw new Error(
            `expected missing any of ${JSON.stringify(c.expected.expectedMissingAnyOf)}, got ${JSON.stringify(missingTypes)}`
          );
        }
      } else if (missingTypes.length > 0) {
        throw new Error(`expected no missing, got ${JSON.stringify(missingTypes)}`);
      }

      if (!c.expected.expectedRiskLevelIn.includes(risk.level)) {
        throw new Error(
          `risk level '${risk.level}' not in ${JSON.stringify(c.expected.expectedRiskLevelIn)} (score ${risk.totalScore})`
        );
      }

      console.log(`✓ (score ${risk.totalScore}, ${risk.level})`);
      pass++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      fail++;
    }
  }
  return { pass, fail };
}

(async () => {
  console.log("Loading fixtures...");
  const cases = await loadCases();
  console.log(`Loaded ${cases.length} cases\n`);

  console.log("Phase 1: Fixture integrity check");
  const fixturesPass = checkFixtures(cases);
  console.log(`  ${fixturesPass}/${cases.length} fixtures OK\n`);

  if (!BASE_URL) {
    console.log("Phase 2: Online regression — SKIPPED");
    console.log("  Set BASE_URL=http://localhost:3000 (and run `npm run dev` + DEEPSEEK_API_KEY) to enable.");
    process.exit(0);
  }

  console.log(`Phase 2: Online regression against ${BASE_URL}`);
  const { pass, fail } = await runOnline(cases);
  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
