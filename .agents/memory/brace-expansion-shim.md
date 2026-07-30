---
name: brace-expansion security shim
description: Why brace-expansion v1/v2 are overridden to a local compat package and how to maintain it
---

# brace-expansion security shim

CVE-2026-14257 / CVE-2026-13149 are only fixed in brace-expansion >=5.0.8; the 1.x/2.x "maintenance" releases are still flagged by the audit scanner. v5 renamed the export from a CJS default function to a named `{ expand }`, so a plain version override breaks minimatch.

**How it's solved:** pnpm overrides redirect `brace-expansion@1` and `@2` to the workspace package `lib/brace-expansion-compat`, which wraps v5's `expand` in the legacy default-function API (via alias dep `brace-expansion-v5: npm:brace-expansion@^5.0.8`).

**Why:** audit must report 0 high/critical while minimatch@3/@9 (untouched majors with no patched releases) keep working.

**How to apply:** if minimatch or other consumers upgrade to majors that depend on brace-expansion ^5 natively, the shim and the two overrides can be removed. Also note: `pnpm install` rewrites pnpm-workspace.yaml and can strip comments/quotes — re-check edits after installs.

## Status as of 2026-07-30
Shim still required: Expo SDK 54 toolchain resolves minimatch 9.0.9 and orval/typedoc pull glob 7 -> minimatch 3.1.5, both needing brace-expansion v1/v2. Recheck after Expo SDK / orval upgrades (`pnpm why -r minimatch`). Transitive vuln pins live in pnpm-workspace.yaml overrides (js-yaml v3/v4, shell-quote, tar, undici).
