import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const TRIAGE_PROMPT_VERSION = "v1";

const here = path.dirname(fileURLToPath(import.meta.url));
export const TRIAGE_PROMPT = readFileSync(
  path.join(here, "..", "..", "config", `triage-prompt.${TRIAGE_PROMPT_VERSION}.md`),
  "utf-8",
);
