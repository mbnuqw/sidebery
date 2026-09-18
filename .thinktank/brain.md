# Brain — Persistent Knowledge Base

## Major Decisions
- **2026-09-06**: Implemented Domain Trees feature in Sidebery.
  - **Inline Placeholder vs. Content Root**: Used Sidebery's existing group tab architecture (`isGroup`, `Utils.createGroupUrl()`) with `?dt=<domain>` parameter to create lightweight inline placeholder header tabs in the tab stream instead of designating an arbitrary web page as the root.
  - **2+ Tab Threshold**: A solitary domain tab remains an ordinary top-level tab; the placeholder header tab is spawned only when a 2nd matching tab arrives, parenting both under it.
  - **Priority Resolution**: Panel Tab Move Rules take precedence if configured; otherwise, Domain Tree Priority unifies tabs into an existing domain tree across panels.
  - **Auto-Cleanup**: The placeholder header automatically removes itself when its child tab count drops to 0.
  - **Closure Guard**: Trying to close the placeholder header with living child tabs prompts a confirmation modal before removing tabs.
  - **Category Meta-Roots & Daughter Sub-Trees**:
    - Custom rules (e.g. `Media: youtube|youtu.be|spotify|bandcamp`) act as pre-configured "pinned" meta-roots with a threshold of $\ge 1$ tab (created immediately on 1st matching tab, preserved when down to 1 tab, removed only when count reaches 0).
    - Inside a meta-root, single-domain tabs remain orphaned direct children until 2+ tabs of that domain exist, at which point a daughter sub-tree is spawned.
    - If a daughter sub-tree drops back to 1 tab, it dissolves and promotes the remaining tab back to an orphaned child under the meta-root.
    - Ancestor custom rule checks in `scanSubDomainTrees` ensure tabs belonging to the meta-root remain within its daughter trees without being unparented.
    - Common frontend sub-domain prefixes (`m`, `open`, `web`, `app`) are recognized as part of the parent service.

## User Preferences
- Prefers tab tree hierarchy over separate navbar panels for domain grouping.
- The root tab must not close by accident; requires confirmation if child tabs remain.

## Error Registry

### TS2322 in tabs.fg.domain-trees.ts — 2026-09-06
- **Symptom**: `Type 'ID' is not assignable to type 'string'`.
- **Root Cause**: `rule.id` can be `number | string` (defined as `ID`), while `domainKey` is typed as `string`.
- **Fix**: Wrapped `rule.id` in `String(rule.id || trimmed)`.
- **File(s)**: `src/services/tabs.fg.domain-trees.ts`
