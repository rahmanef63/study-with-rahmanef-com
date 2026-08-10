# notion — Block Editor (nested cluster)

> **WIP.** Milestone 1 of the notion-page-clone block-editor port. Ships the
> decoupled **pure core** only. Components + convex land in later milestones.

A nested vertical slice (slice-of-slices). The cluster owns a private shared
layer addressed via `@notion/*`:

```
frontend/slices/notion/
├── config.ts                 # notionConfig (defineFeature)
├── index.ts                  # cluster barrel
├── shared/                   # cluster-private, @notion/*
│   ├── types/blocks.ts       # vendored Block/Page model (DB props decoupled → unknown)
│   └── lib/{uid,inlineMd}     # vendored utils
└── slices/
    └── editor/               # inner slice
        ├── blockSpecs.ts
        ├── lib/adapter.ts    # EditorAdapter seam (inverts 13 cross-slice deps)
        └── lib/*             # block-tree / turn-into / markdown / inline-decorator / synced / layout
```

## Why a cluster + adapter

The source editor reached into ~13 sibling slices (comments, databases,
mentions, cover, block-selection, wiki, …). rr forbids `@/features/<other>`
imports. So those integrations **invert** through `EditorAdapter`
(`slices/editor/lib/adapter.ts`): the host supplies what it has, everything is
optional, and the editor degrades gracefully. Same renderless-adapter pattern
as the `comments` slice.

## Status

| Part | State |
|---|---|
| Block/Page model (vendored, decoupled) | ✅ |
| blockSpecs + slash specs | ✅ |
| Pure utils (tree / turn-into / markdown / inline-decorator / synced / layout / list-ordinals / colors / covers) | ✅ 151 tests |
| EditorAdapter seam — interface + runtime context (`EditorAdapterProvider`/`useEditorAdapter`) | ✅ |
| **M2a** — block rendering: `BlockBody` (text/heading/list/quote/code/callout), special-block registry (image/embed/button/audio/video/divider), built-in `SimpleCodeBlock`, image/media dropzones (uploads via `adapter.page.uploadFile` + `FilePicker`) | ✅ |
| **M2a** — editing layer: SlashMenu, key/input/slash handlers, block-decorate, column layout, selection-toolbar + mention-typeahead helpers, page-action submenus | ✅ |
| **M2b.1** — adapter seam expanded: `EditorDataAdapter` (block+page CRUD, no-op fallback) + revised `SelectionAdapter` (selectOne/range/toggle) + `CommentsAdapter` (hook+popover, no-op default) + `AiAdapter`; context hooks `useEditorData`/`useSelection`/`useComments`/`useAi`. `BlockShell` wired to selection. | ✅ |
| **M2b.2a** — block toolbar: `BlockControls` (hub) + `MenuHierarchy` (action menu) + `QuickButtons`/`GripButton`, wired to data/selection/comments/ai adapters (AI panel optional, comment popover via adapter). | ✅ |
| **M2b.2b** — nested-rendering subtree: `NestedBlock` (recursive dispatcher, self-registers) + `NestedContent` (by-type renderer, database→`adapter.database`, nav→`adapter.page`, icon→`PageIcon`) + `ToggleBlock` + `ColumnBlockEditor` (split → `column/panes`) + `SyncedBlock` (split → `synced/{views,ChildrenList}`, uses `pages`/`workspaceId`) + `NestedBlockControls`. **M2b complete.** | ✅ |
| M2c — page shell (BlockEditor, PageEditor, page-actions) that composes the chrome + nested tree into a working editor; database blocks + live mentions; catalog entry + preview | ⏳ |
| Convex (blocks / blockOps) | ⏳ |
