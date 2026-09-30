## Goal
Transform CrackIt into a polished enterprise-grade desktop OS for AI-assisted cybersecurity research with modular projects, consistent UX, cross-linked data, keyboard shortcuts, universal context menus, and zero dead UI.

## Constraints & Preferences
- Frontend-only, LocalStorage, no backend/database
- All visible elements must perform meaningful actions — no dead UI
- Every page follows same layout: Top Header → Toolbar → Main Content → Optional Right Panel → Status Bar
- Same visual language across all cards, buttons, forms, tables, animations
- Projects are modular — can enable one or more of 36 modules at creation, auto-generates workspace structure
- Everything should be connected — clicking a relationship navigates to the linked object
- Replace large popups with inline panels, context menus, and compact floating "+" menu
- Keyboard shortcut system with searchable reference in Settings
- Prepare UI placeholders for future capabilities (AI agents, plugins, cloud sync, encrypted vault, etc.)

## Progress
### Done
- **Bug fix**: `deleteFromCollection` → `removeFromCollection` in 5 files (files.js, notifications.js, knowledge.js, notes.js ×2) — these would have thrown TypeError on any delete action
- **Enhanced Findings Manager** (`projects.js`) — Full schema: Finding ID, Title, Severity, CVSS Score, Category, CWE, OWASP, Description, Steps to Reproduce, Impact, Recommendation, References, Evidence, Module, Status, Related Files/Chats/Reports. Split-panel layout: table list (clickable rows, searchable) + detail view with all fields. Add Finding modal includes all schema fields. Edit Finding modal for updating. Delete with confirmation. Status toggle cycles open→in-progress→verified→closed→open
- **Assets Manager** (`projects.js`) — New project tab with 9 asset types (Domain, Subdomain, URL, IP, Repository, Application, Server, Mobile App, Cloud Resource). Table display with type/value/category/status/notes. Add/delete assets. Summary grid showing count per type
- **Scope Manager** (`projects.js`) — New project tab with In Scope/Out of Scope lists (editable via textarea). Testing rules section: hours, methods, emergency contacts, credentials, authorization date, status. Edit modal for managing all scope fields
- **Checklist System** (`projects.js`) — New project tab with per-module checklist items. Progress bar showing completion rate. Add/toggle/delete items. Filter by module via dropdown. Module-aware auto-generation
- **Evidence Library** (`projects.js`) — Enhanced evidence tab showing both file-based evidence and finding-linked evidence. Cross-linked: clicking evidence from a finding opens finding detail in the Findings tab
- **Universal Right-Click Context Menus** (`ui.js`) — Every object type now supports right-click with menu: Open, Duplicate, Rename, Move (files), Favorite, Properties, Delete. Types: project, file, note, finding, conversation. Global handler auto-detects `[data-context]`, `[data-project-id]`, `[data-file-id]`, `[data-note-id]`, `[data-finding-id]`, `[data-conv-id]`, `[data-report-id]`
- **Sidebar Tree Navigation** (`navigation.js`) — Rewritten sidebar with 8 collapsible sections (Dashboard, Projects, AI Workspace, Cyber Security, Tools, Reports, Management, System). Sections expand/collapse with smooth animation. State persisted in LocalStorage. Badges show active project count, conversation count
- **Router expanded** (`router.js`) — 14 new page registrations: soc, threats, labs, knowledgecenter, devsecops, cve, cwe, mitre, scanner, codescanner, apiscanner, memai, agents, prompts
- **Keyboard shortcuts** (`navigation.js`, `app.js`) — Ctrl+K (command palette), Ctrl+B (toggle sidebar), Ctrl+J (toggle right panel), Ctrl+` (terminal), Ctrl+1 (dashboard), Ctrl+2 (projects), Ctrl+3 (chat), Ctrl+4 (notes), Ctrl+5 (files), Esc (close dialogs/slides)
- **Dashboard charts** (`dashboard.js`) — Security Trends section with bar chart (project status distribution), donut chart (report severity), line chart (7-day activity trend) via `CrackItCharts` module
- **Dashboard context menus** (`dashboard.js`) — Right-click on project table rows (Open/Duplicate/Archive/Delete) and report list items (Open/Export/Delete)
- **Data collections**: assets, scopes, checklists now supported via `CrackItStorage.getCollection()` (auto-initializes to `[]`)
- **14 new page modules created** (`modules.js`) — CrackItSOC, CrackItThreats, CrackItLabs, CrackItKnowledgeCenter, CrackItDevSecOps, CrackItCVE, CrackItCWE, CrackItMITRE, CrackItScanner, CrackItCodeScanner, CrackItAPIScanner, CrackItAIMemory, CrackItAgents, CrackItPrompts — each renders with mock data, stats cards, tables, breadcrumbs
- **Enterprise mock data generator** (`mockdata.js`) — `CrackItMockData.generate()` creates 35 projects, 15 clients, 300 findings, 75 reports, 50 conversations, 120 notifications, 80 tasks, 350 files, 600 logs, 250 terminal history entries, 500 activity records, 10 workspace snapshots, 8 templates. Uses realistic data (domains, names, CVEs, CWEs, tools). Generated once per settings flag `mockDataGenerated`
- **Professional desktop CSS** (`professional.css`) — Splash screen, loading overlay, floating action button, command palette, task/notification slide panels, workspace switcher, IDE editor features (minimap, gutter, breadcrumbs, toolbar), terminal tabs/split, model selector, AI context panel, metric cards, score rings, collapsible cards, keyboard shortcuts grid, focus/zen modes, progress overlay, responsive breakpoints
- **Splash Screen** (`professional.js`) — 5-stage animated loading sequence (Assets → UI → AI → Security → Workspace) with progress bar and fading status text. Auto-transitions to main UI. Used as first screen after login
- **Workspace Manager** (`professional.js`) — Multi-workspace CRUD: create, switch, persist. Dropdown in topbar. Snapshots (save/restore via LocalStorage). Active workspace tracked per session
- **Command Palette** (`professional.js`) — Ctrl+K universal search across pages, projects, files, chats, reports, and commands (toggle sidebar/panel, open terminal, toggle theme, save snapshot, fullscreen, new project). Arrow key navigation, Enter to select, Esc to dismiss
- **Floating Action Button** (`professional.js`) — "+" button at bottom-right with radial menu: New Project, Quick Scan, AI Chat, Open Terminal, Create Report, Upload Files, New Note. Animated open/close with backdrop dismiss
- **Task Slide Panel** (`professional.js`) — Slide-in panel showing running/pending/completed tasks from `tasks` collection. Grouped by status with badges. Dismiss via overlay click or close button
- **Notification Slide Panel** (`professional.js`) — Slide-in panel replacing old dropdown. Groups notifications by Today/Yesterday/Earlier. Color-coded dots per type (system/security/projects/ai/tasks). Mark all read button
- **Keyboard Shortcuts Manager** (`professional.js`) — `getAllShortcuts()` returns 25+ shortcuts. `renderShortcutsTable()` renders 2-column grid for Settings page
- **Page Loader** (`professional.js`) — `showPageLoader()`/`hidePageLoader()` for async page transitions
- **Status Bar Enhancement** (`professional.js`) — Hover on statusbar sections shows live CPU/RAM/storage readings
- **Global keyboard shortcuts** wired in `app.js:initKeyboardActions()` — Ctrl+K (toggle palette), Esc (close palette/slides), Ctrl+B (toggle sidebar), Ctrl+J (toggle right panel), Ctrl+` (open terminal)
- **Header buttons wired** in `app.js:initGlobalActions()` — notifications→notif slide, command→command palette, tasks→task slide, search→global search

### In Progress
- AI Workspace 2.0 (model selector, context panel, memory)
- Terminal expansion (tabs, profiles, split, themes)
- IDE features (minimap, code folding, multi-cursor, go to definition)
- All new page modules from Phases 3-5 with full enterprise data
- Keyboard shortcut manager in Settings
- Focus/zen modes integration

### Blocked
- Logo image at `C:\Users\AICOE 5\Downloads\ChatGPT Image Jun 28, 2026, 10_49_15 AM.png` cannot be read — user must place it in `assets/` and update favicon/logo in `index.html`

## Key Decisions
- Findings schema: `{ id, projectId, title, severity, cvssScore, category, cweId, owaspCategory, description, stepsToReproduce, impact, recommendation, references, evidence, module, relatedFiles[], relatedChats[], relatedReports[], status, createdAt, updatedAt }`
- Assets schema: `{ id, projectId, type, value, category, status, notes, createdAt }` — types: Domain/Subdomain/URL/IP/Repository/Application/Server/Mobile App/Cloud Resource
- Scope schema: `{ id, projectId, inScope[], outScope[], testingHours, allowedMethods, emergencyContacts, credentialsProvided, status, authorizationDate, createdAt }`
- Checklist schema: `{ id, projectId, title, moduleId, moduleName, completed, createdAt }`
- All collections auto-initialize via `CrackItStorage.getCollection()` — returns `[]` if not in LocalStorage
- Context menu types auto-detected in `ui.js:handleGlobalContextMenu()` — looks for `[data-context]`, then falls back to `[data-project-id]`, `[data-file-id]`, `[data-note-id]`, `[data-finding-id]`, `[data-conv-id]`, `[data-report-id]`
- Sidebar tree state persisted in `crackit_sidebar_expanded` key
- Router fallback: if module not found, logs warning and navigates to dashboard
- `CrackItCharts` is global const in `charts.js` with `drawBarChart`, `drawDonutChart`, `drawLineChart`, `generateRandomData`
- Mock data generated once via `CrackItMockData.generate()` checked by settings flag `mockDataGenerated`
- Login: `admin@crackit.io` / `admin123` (universal bypass)
- Splash screen shown on every authenticated load (5-stage animation, ~2s duration)
- Command palette uses `CrackItRouter.pages` for page entries + `CrackItStorage.getCollection()` for project/file/chat/report entries + hardcoded command list
- Workspace dropdown auto-closes on outside click, state persisted in `workspaces` LocalStorage key
- Floating button state tracked via `fabOpen` boolean, auto-closes on outside click

## Relevant Files
- `assets/js/professional.js`: Splash screen, workspace manager, command palette, FAB, task/notification slide panels, status bar enhancer, shortcuts manager, page loader
- `assets/js/app.js`: Integration of professional module (splash, keyboard shortcuts, global actions), `initKeyboardActions()`, `initGlobalActions()` wired for command/tasks/notif actions
- `assets/js/projects.js`: Enhanced Findings Manager (full schema), Assets Manager, Scope Manager, Checklist System, Evidence Library
- `assets/js/navigation.js`: Sidebar collapsible tree navigation (8 sections), keyboard shortcuts (Ctrl+J, Ctrl+1-5), tree toggle event bindings
- `assets/js/router.js`: 14 new page registrations (soc, threats, labs, knowledgecenter, devsecops, cve, cwe, mitre, scanner, codescanner, apiscanner, memai, agents, prompts)
- `assets/js/modules.js`: 14 new page modules with full mock data rendering
- `assets/js/dashboard.js`: Security Trends charts (bar/donut/line), context menus on project rows + report items
- `assets/js/ui.js`: Universal right-click context menus with auto-detection via data attributes
- `assets/js/charts.js`: Canvas chart engine (bar/donut/line) used by dashboard
- `assets/js/storage.js`: Data layer — collections now include assets, scopes, checklists
- `assets/js/mockdata.js`: Enterprise mock data generator — 35 projects, 300 findings, 75 reports, 50 conversations, 120 notifications, 80 tasks, 350 files, 600 logs, 250 terminal history, 500 activity records, 10 snapshots, 8 templates
- `assets/css/professional.css`: All professional UI styles (splash, command palette, FAB, slide panels, workspace switcher, IDE features, terminal tabs/split, model selector, AI context panel, metric cards, score rings, focus/zen modes, shortcuts grid, page loader)
- `assets/css/sidebar.css`: Sidebar tree CSS (`.sidebar-tree`, `.sidebar-tree-section`, `.sidebar-tree-toggle`, `.sidebar-tree-children`, collapsed state styles)
- `assets/js/utils.js`: All icons including `externalLink` (line 282), `upload` (line 315), `flask` (line 283)
- `index.html`: professional.css link, professional.js script, workspace switcher container in topbar
