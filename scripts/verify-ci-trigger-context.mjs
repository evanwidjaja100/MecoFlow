import { validateCiTrigger } from "./ci-trigger-policy.mjs";

const errors = validateCiTrigger(process.env);
if (errors.length > 0) {
  console.error(`CI trigger context is invalid: ${errors.join("; ")}`);
  process.exitCode = 1;
} else {
  console.log("CI trigger context is candidate-bound and attributed.");
}
