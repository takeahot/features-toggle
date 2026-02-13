# Project Analysis

## Tech Stack

### Backend (VS Code Extension)
- **Language**: TypeScript
- **Runtime**: Node.js >= 20.19.2
- **Platform**: VS Code Extension API
- **Build Tool**: esbuild
- **Build System**: Turborepo 2.8.7
- **Package Manager**: pnpm 10.8.1

### Frontend (Webview UI)
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Build Tool**: Vite 6.0.7
- **Styling**: CSS

### Project Structure
```
features_toggle/
├── src/                          # Extension backend code
│   ├── extension.ts              # Main extension entry point
│   ├── package.json              # Extension manifest
│   ├── tsconfig.json             # TypeScript config
│   └── esbuild.mjs               # Build script
├── webview-ui/                   # Frontend webview
│   ├── App.tsx                   # Main React component
│   ├── styles.css                # Styles
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite config
├── package.json                  # Root package (workspaces)
└── turbo.json                    # Turbo build config
```

### Current Implementation Status
- ✅ VS Code extension with webview sidebar panel
- ✅ React frontend with file upload button
- ✅ File selection functionality
- ❌ Backend file processing logic (missing)
- ❌ Draw.io XML parsing (missing)
- ❌ Hierarchical structure generation (missing)
- ❌ JSON output format (missing)

### Key Files
- [`src/extension.ts`](../src/extension.ts) - Extension provider and webview setup
- [`webview-ui/App.tsx`](../webview-ui/App.tsx) - React UI with file upload
- [`src/package.json`](../src/package.json) - Extension manifest (commands, views)
