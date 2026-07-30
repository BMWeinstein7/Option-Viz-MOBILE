---
name: pnpm catalog gaps break new artifact scaffolds
description: New artifact scaffolds can reference catalog deps missing from pnpm-workspace.yaml
---
New artifact scaffolds (e.g. slides) may declare deps as `"catalog:"` that are absent from the `catalog:` block in `pnpm-workspace.yaml`, making `pnpm install` fail with ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC (seen with `wouter` for a slides deck).

**Why:** The workspace catalog was trimmed/customized before the scaffold type was first used.

**How to apply:** If install fails right after `createArtifact`, add the missing entry to the workspace `catalog:` block and rerun `pnpm install`.
