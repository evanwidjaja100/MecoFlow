import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { join } from "node:path";
import {
  phaseZeroClosureFiles,
  validatePhaseZeroClosure,
} from "./phase-zero-closure-policy.mjs";

const root = process.cwd();
const documents = Object.fromEntries(
  phaseZeroClosureFiles.map((file) => [
    file,
    readFileSync(join(root, file), "utf8"),
  ]),
);
const gitStatus = execFileSync("git", ["status", "--porcelain=v1"], {
  cwd: root,
  encoding: "utf8",
});
const currentHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
let candidateIsAncestor = false;
let postCandidatePaths = [];
try {
  const closure = JSON.parse(
    documents["docs/readiness/phase-zero-closure.json"],
  );
  const candidateSha = closure.candidate?.sourceSha;
  if (/^[0-9a-f]{40}$/u.test(candidateSha ?? "")) {
    execFileSync(
      "git",
      ["merge-base", "--is-ancestor", candidateSha, currentHead],
      {
        cwd: root,
        stdio: "ignore",
      },
    );
    candidateIsAncestor = true;
    postCandidatePaths = execFileSync(
      "git",
      ["diff", "--name-only", `${candidateSha}..${currentHead}`],
      { cwd: root, encoding: "utf8" },
    )
      .split(/\r?\n/u)
      .filter(Boolean);
  }
} catch {
  // The policy reports malformed/missing candidate evidence without leaking it.
}
const errors = validatePhaseZeroClosure({
  documents,
  gitStatus,
  currentHead,
  candidateIsAncestor,
  postCandidatePaths,
});

if (errors.length > 0) {
  console.error("Phase 0 closure check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Phase 0 closure check passed.");
}
