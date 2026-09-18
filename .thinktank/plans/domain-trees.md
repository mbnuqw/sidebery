# Plan: Domain Trees (Inline Accordion Panels)

**Status**: ✅ Complete
**Created**: 2026-09-06
**Updated**: 2026-09-06

## Phases

### Phase 1: Types, Settings & Translations
- [x] Step 1: Define Domain Tree Types (`src/types/settings.ts`)
- [x] Step 2: Add Default Settings & Configs (`src/defaults/settings.ts`)
- [x] Step 3: Add Localization Strings (`src/_locales/dict.sidebar.ts` & `src/_locales/dict.setup-page.ts`)

### Phase 2: Core Domain Tree Service
- [x] Step 4: Create Domain Tree Service (`src/services/tabs.fg.domain-trees.ts`)

### Phase 3: Integration with Handlers & Tab Lifecycle
- [x] Step 5: Hook into Tab Creation, Navigation & Removal (`src/services/tabs.fg.handlers.ts`)
- [x] Step 6: Guard Tab Removal Against Accidental Closure (`src/services/tabs.fg.rm.ts` & `src/sidebar/components/tab.vue`)

### Phase 4: Settings UI
- [x] Step 7: Build Domain Trees Settings Section (`src/page.setup/components/settings.tabs.vue`)

### Phase 5: Verification & Testing
- [x] Step 8: Verify Syntax and Type Checking (`vue-tsc --noemit` passes with 0 errors)
- [x] Step 9: Functional Flow Verification (vitest unit tests pass 10/10 files, 89/89 tests; `npm run build` succeeds)
