# CrackIt

**AI-Powered Cybersecurity & Research Operating System**

CrackIt is a premium desktop-style frontend application designed for cybersecurity professionals and researchers. It unifies AI assistance, project management, knowledge management, file management, and security tooling into one seamless workspace.

## Features

- **Desktop Application Layout** — Top bar, collapsible sidebar, workspace tabs, right inspector panel, status bar
- **Command Palette** — `Ctrl+K` for quick navigation and actions
- **Global Search** — `Ctrl+Shift+F` to search projects, notes, files, reports, and commands
- **Dashboard** — Live widgets, charts, activity timeline, threat feed, calendar
- **Project Management** — Grid/list views, kanban workspace, filters, drag-and-drop
- **AI Chat** — Conversation history, streaming simulation, prompt library placeholder
- **Notes** — Markdown editor appearance with autosave to LocalStorage
- **File Manager** — Tree navigation, grid/list views, favorites, recycle bin
- **Reports** — Security report cards with severity levels and export placeholders
- **Terminal** — Multi-tab fake terminal with command history
- **Automation** — Workflow cards with execution statistics
- **Settings** — Full settings panel with persistent preferences
- **Cybersecurity Modules** — Targets, Recon, Enumeration, Scans, Evidence, Scripts, Logs

## Tech Stack

- HTML5
- CSS3 (modular architecture with CSS variables)
- Vanilla JavaScript (ES6+ modules)
- LocalStorage / SessionStorage for data persistence
- Mock JSON datasets

**No frameworks. No backend. No build step required.**

## Getting Started

1. Open the project folder
2. Serve `index.html` with any static file server, or open directly in a browser

```bash
# Using Python
python -m http.server 8080

# Using npx (if available)
npx serve .
```

3. Navigate to `http://localhost:8080`

> **Note:** A local server is recommended for JSON data loading. Opening `index.html` directly may fall back to JavaScript-generated mock data.

## User

This is a private single-user application:

- **Name:** Admin
- **Role:** Administrator
- No authentication required

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command Palette |
| `Ctrl+Shift+F` | Global Search |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Right Panel |
| `Ctrl+1-5` | Navigate to pages |
| `Ctrl+`` | Open Terminal |
| `Ctrl+,` | Settings |
| `Escape` | Close overlays |

## Project Structure

```
CrackIt/
├── index.html              # Main application shell
├── assets/
│   ├── css/                # Modular stylesheets
│   ├── js/                 # JavaScript modules
│   ├── data/               # Mock JSON datasets
│   └── images/             # Icons and assets
├── pages/                  # Page templates (for future use)
├── components/             # Reusable component templates
└── README.md
```

## Data Storage

All data is stored in the browser's LocalStorage. Mock JSON files in `assets/data/` provide seed data on first load. The architecture is designed for easy backend API integration — replace `CrackItStorage` methods with fetch calls.

## Future Integration

The codebase is structured for:

- Backend API integration (replace storage service)
- Database connectivity
- AI model integration (chat, analysis, automation)
- Desktop packaging (Electron/Tauri wrapper)
- Real authentication when needed

## Version

**CrackIt v2.0.0** — Frontend-only demonstration

© 2025 CrackIt. Built for Admin.
