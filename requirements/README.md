# Requirements Documentation

This folder contains the complete requirements documentation for the Draw.io Diagram Parser feature.

## Document Structure

### 1. [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)
Overview of the existing project tech stack, structure, and current implementation status.

**Contents:**
- Tech stack breakdown (Backend: VS Code Extension, Frontend: React + Vite)
- Project file structure
- Current implementation status
- Key files reference

---

### 2. [FEATURE_REQUIREMENTS.md](FEATURE_REQUIREMENTS.md)
Detailed functional and non-functional requirements for the new feature.

**Contents:**
- User story
- Functional requirements (FR-1 to FR-7)
- Non-functional requirements (Performance, Error Handling, Code Quality)
- Technical implementation notes
- Example input/output
- Success criteria
- Open questions

---

### 3. [IMPLEMENTATION_TASKS.md](IMPLEMENTATION_TASKS.md)
Actionable task breakdown for AI-driven development.

**Contents:**
- Phase 1: Dependencies and Setup
- Phase 2: Type Definitions
- Phase 3: XML Parsing Module
- Phase 4: Hierarchy Algorithm
- Phase 5: Main Parser Service
- Phase 6: Extension Integration
- Phase 7: Frontend Updates
- Phase 8: Testing
- Phase 9: Documentation

Each task includes:
- Target file path
- Code template/implementation guidance
- Acceptance criteria checklist

---

## Quick Reference

### Feature Overview
Parse draw.io (.drawio) files uploaded from the VS Code extension sidebar and convert them into a structured JSON format that preserves:
- Block content (text)
- Styling information
- Hierarchical relationships based on spatial positioning

### Key Algorithm: Corridor Principle
Parent-child relationships are determined by spatial position:
1. A block's center X coordinate must fall within its parent's width range (corridor)
2. The closest block above that satisfies this condition becomes the parent
3. Root is the topmost block (smallest Y coordinate)

### JSON Output Structure
```typescript
{
  metadata: { filename, parsedAt, totalBlocks, maxDepth },
  root: DiagramBlock,      // Nested tree structure
  flatList: DiagramBlock[] // All blocks in flat array
}
```

### Dependencies to Add
- `fast-xml-parser`: ^4.5.0
- `he`: ^1.2.0

---

## Usage for AI Development

When working with an AI assistant:

1. **Start with** [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md) to understand the codebase
2. **Review** [`FEATURE_REQUIREMENTS.md`](FEATURE_REQUIREMENTS.md) for detailed requirements
3. **Follow** [`IMPLEMENTATION_TASKS.md`](IMPLEMENTATION_TASKS.md) for step-by-step implementation

Each task in [`IMPLEMENTATION_TASKS.md`](IMPLEMENTATION_TASKS.md) is designed to be:
- Self-contained
- Actionable
- Has clear acceptance criteria
- Includes code templates

---

## Project Context

**Project Name**: Features Toggle
**Type**: VS Code Extension
**Purpose**: Extension with webview UI for managing features
**Current State**: Basic extension with sidebar and file upload UI

---

## Next Steps

After reviewing these documents:

1. Confirm requirements with stakeholders
2. Address open questions in [`FEATURE_REQUIREMENTS.md`](FEATURE_REQUIREMENTS.md)
3. Begin implementation following [`IMPLEMENTATION_TASKS.md`](IMPLEMENTATION_TASKS.md)
