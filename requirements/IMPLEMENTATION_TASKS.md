# Implementation Tasks Breakdown

## Overview
This document breaks down the implementation of the Draw.io Diagram Parser into actionable tasks for AI development.

---

## Phase 1: Dependencies and Setup

### Task 1.1: Install Required Dependencies
**File**: `src/package.json`
**Action**: Add dependencies to `dependencies` section
```json
{
  "dependencies": {
    "fast-xml-parser": "^4.5.0",
    "he": "^1.2.0"
  }
}
```
**Command**: `pnpm install`

**Acceptance Criteria**:
- [ ] `fast-xml-parser` installed
- [ ] `he` installed
- [ ] No installation errors

---

## Phase 2: Type Definitions

### Task 2.1: Create Type Definitions File
**File**: `src/types/diagram.ts` (new file)
**Action**: Define TypeScript interfaces for diagram parsing

```typescript
export interface DiagramBlockStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  style: string;  // Raw style string from XML
}

export interface DiagramBlock {
  index: number;              // Sequential number relative to parent (1-based)
  path: string;               // Dot-separated path (e.g., "1.2.3")
  content: string;            // Text content (HTML decoded)
  style: DiagramBlockStyle;  // All styling and geometry properties
  children: DiagramBlock[];   // Nested children array
}

export interface DiagramMetadata {
  filename: string;
  parsedAt: string;
  totalBlocks: number;
  maxDepth: number;
}

export interface DiagramStructure {
  metadata: DiagramMetadata;
  root: DiagramBlock;
  flatList: DiagramBlock[];
}

export interface MxCell {
  id: string;
  parent: string;
  style?: string;
  value?: string;
  vertex?: string;
  edge?: string;
  mxGeometry?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    '@_as'?: string;
  };
}

export interface MxGraphModel {
  root: {
    mxCell: MxCell | MxCell[];
  };
}

export interface Diagram {
  mxGraphModel: MxGraphModel;
}

export interface MxFile {
  mxFile?: {
    diagram?: {
      mxGraphModel?: MxGraphModel;
    } | {
      mxGraphModel?: MxGraphModel;
    }[];
  };
}

// Helper types for internal processing
export interface BlockWithLevel extends DiagramBlock {
  level: number;
  originalX: number;  // Store original x for corridor calculation
}

export interface LevelGroup {
  level: number;
  blocks: BlockWithLevel[];
}
```

**Acceptance Criteria**:
- [ ] All interfaces defined
- [ ] TypeScript compiles without errors
- [ ] Proper type exports

---

## Phase 3: XML Parsing Module

### Task 3.1: Create XML Parser
**File**: `src/parser/xmlParser.ts` (new file)
**Action**: Implement XML parsing with fast-xml-parser

```typescript
import { XMLParser } from 'fast-xml-parser';
import * as he from 'he';
import type { MxFile, MxCell, DiagramBlockStyle } from '../types/diagram';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
});

export function parseDrawioXml(xmlContent: string): MxFile {
  return parser.parse(xmlContent);
}

export function extractVertexCells(mxFile: MxFile): MxCell[] {
  // Navigate to mxCell elements and filter by vertex="1"
  // Handle both single cell and array of cells
  // Return array of vertex cells
  const diagram = mxFile.mxFile?.diagram;
  if (!diagram) return [];

  const graphModel = Array.isArray(diagram)
    ? diagram[0]?.mxGraphModel
    : diagram.mxGraphModel;

  if (!graphModel?.root?.mxCell) return [];

  const cells = Array.isArray(graphModel.root.mxCell)
    ? graphModel.root.mxCell
    : [graphModel.root.mxCell];

  return cells.filter(cell => cell.vertex === '1');
}

export function decodeHtmlEntities(text: string): string {
  return he.decode(text);
}

export function extractStyle(cell: MxCell): DiagramBlockStyle | null {
  const geometry = cell.mxGeometry;
  if (!geometry || geometry.x === undefined || geometry.y === undefined) {
    return null;
  }

  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width || 0,
    height: geometry.height || 0,
    style: cell.style || '',
  };
}

export function extractContent(cell: MxCell): string {
  if (!cell.value) return '';
  return decodeHtmlEntities(cell.value);
}
```

**Acceptance Criteria**:
- [ ] XML parses correctly
- [ ] Vertex cells extracted
- [ ] HTML entities decoded
- [ ] Style and geometry extracted correctly

---

## Phase 4: Hierarchy Algorithm

### Task 4.1: Implement Level Grouping
**File**: `src/parser/levelGrouping.ts` (new file)
**Action**: Group blocks by level based on Y coordinate

```typescript
import type { BlockWithLevel, LevelGroup } from '../types/diagram';

const LEVEL_THRESHOLD = 10; // pixels

export function groupBlocksByLevel(blocks: BlockWithLevel[]): LevelGroup[] {
  if (blocks.length === 0) return [];

  // Sort by Y coordinate ascending
  const sorted = [...blocks].sort((a, b) => a.style.y - b.style.y);

  const groups: LevelGroup[] = [];
  let currentGroup: BlockWithLevel[] = [sorted[0]];
  let currentLevel = 0;
  sorted[0].level = 0;

  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    const prevBlock = sorted[i - 1];
    const yDiff = block.style.y - prevBlock.style.y;

    if (yDiff <= LEVEL_THRESHOLD) {
      // Same level as previous block
      block.level = currentLevel;
      currentGroup.push(block);
    } else {
      // New level
      groups.push({ level: currentLevel, blocks: currentGroup });
      currentLevel++;
      block.level = currentLevel;
      currentGroup = [block];
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push({ level: currentLevel, blocks: currentGroup });
  }

  return groups;
}
```

### Task 4.2: Implement Corridor Algorithm
**File**: `src/parser/corridorAlgorithm.ts` (new file)
**Action**: Implement parent-child relationship detection using corridor principle

```typescript
import type { BlockWithLevel, LevelGroup } from '../types/diagram';

export interface Corridor {
  left: number;
  right: number;
  parentBlock: BlockWithLevel;
}

/**
 * Calculate corridor boundaries for a block on its level.
 * The corridor extends from this level down to the next level.
 * Left boundary: the block's own left edge
 * Right boundary: left edge of the block to the right, or Infinity
 */
export function calculateCorridor(
  block: BlockWithLevel,
  levelBlocks: BlockWithLevel[]
): Corridor {
  // Sort blocks by X coordinate
  const sorted = [...levelBlocks].sort((a, b) => a.style.x - b.style.x);

  const blockIndex = sorted.findIndex(b => b === block);

  // Left boundary: the block's own left edge
  const leftBoundary = block.style.x;

  // Right boundary: left edge of the block to the right, or Infinity
  const rightBoundary = blockIndex < sorted.length - 1
    ? sorted[blockIndex + 1].style.x
    : Infinity;

  return {
    left: leftBoundary,
    right: rightBoundary,
    parentBlock: block,
  };
}

/**
 * Find all corridors for a level
 */
export function calculateAllCorridors(levelGroup: LevelGroup): Corridor[] {
  return levelGroup.blocks.map(block =>
    calculateCorridor(block, levelGroup.blocks)
  );
}

/**
 * Find parent for a block by checking corridors on the level above
 */
export function findParent(
  block: BlockWithLevel,
  upperLevelGroups: LevelGroup[]
): BlockWithLevel | null {
  // Check each level from top to bottom
  for (const group of upperLevelGroups) {
    const corridors = calculateAllCorridors(group);

    for (const corridor of corridors) {
      // Check if block's left edge is within corridor
      if (block.style.x >= corridor.left && block.style.x < corridor.right) {
        return corridor.parentBlock;
      }
    }
  }

  return null;
}

/**
 * Build hierarchical structure using corridor algorithm
 */
export function buildHierarchy(levelGroups: LevelGroup[]): BlockWithLevel {
  if (levelGroups.length === 0) {
    throw new Error('No blocks found');
  }

  // First level, first block is the root
  const root = levelGroups[0].blocks[0];
  root.index = 0;
  root.path = '';
  root.children = [];

  // Process each subsequent level
  for (let level = 1; level < levelGroups.length; level++) {
    const currentLevel = levelGroups[level];
    const upperLevels = levelGroups.slice(0, level);

    for (const block of currentLevel.blocks) {
      const parent = findParent(block, upperLevels);

      if (parent) {
        // Assign sequential index among siblings
        block.index = parent.children.length + 1;
        block.path = parent.path ? `${parent.path}.${block.index}` : `${block.index}`;
        parent.children.push(block);
      } else {
        // No parent found, attach to root
        block.index = root.children.length + 1;
        block.path = `${block.index}`;
        root.children.push(block);
      }
    }
  }

  return root;
}
```

### Task 4.3: Calculate Max Depth
**File**: `src/parser/hierarchyBuilder.ts` (new file)
**Action**: Calculate maximum depth of hierarchy

```typescript
import type { DiagramBlock } from '../types/diagram';

export function calculateMaxDepth(root: DiagramBlock): number {
  if (root.children.length === 0) return 0;

  let maxChildDepth = 0;
  for (const child of root.children) {
    const childDepth = calculateMaxDepth(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth + 1;
}

export function createFlatList(root: DiagramBlock): DiagramBlock[] {
  const result: DiagramBlock[] = [root];

  function traverse(block: DiagramBlock) {
    for (const child of block.children) {
      result.push(child);
      traverse(child);
    }
  }

  traverse(root);
  return result;
}
```

**Acceptance Criteria**:
- [ ] Root identified correctly (smallest Y, first in first level group)
- [ ] Levels grouped correctly (10px threshold)
- [ ] Corridors calculated correctly based on adjacent blocks
- [ ] Parent-child relationships determined by corridor principle
- [ ] Sequential indices assigned correctly
- [ ] Path strings generated correctly (dot-separated)
- [ ] Children arrays populated

---

## Phase 5: Main Parser Service

### Task 5.1: Create Diagram Parser Service
**File**: `src/parser/diagramParser.ts` (new file)
**Action**: Combine XML parsing and hierarchy building

```typescript
import { parseDrawioXml, extractVertexCells, extractStyle, extractContent } from './xmlParser';
import { groupBlocksByLevel } from './levelGrouping';
import { buildHierarchy } from './corridorAlgorithm';
import { calculateMaxDepth, createFlatList } from './hierarchyBuilder';
import type { DiagramStructure, DiagramBlock, MxCell, BlockWithLevel } from '../types/diagram';

function convertCellToBlock(cell: MxCell): BlockWithLevel | null {
  const style = extractStyle(cell);
  if (!style) return null;

  return {
    index: 0,
    path: '',
    content: extractContent(cell),
    style,
    children: [],
    level: 0,
    originalX: style.x,
  };
}

export function parseDiagram(filename: string, xmlContent: string): DiagramStructure {
  // 1. Parse XML
  const mxFile = parseDrawioXml(xmlContent);

  // 2. Extract vertex cells
  const cells = extractVertexCells(mxFile);
  if (cells.length === 0) {
    throw new Error('No vertex blocks found in diagram');
  }

  // 3. Convert to BlockWithLevel objects
  const blocks = cells
    .map(convertCellToBlock)
    .filter((b): b is BlockWithLevel => b !== null);

  if (blocks.length === 0) {
    throw new Error('No valid blocks found');
  }

  // 4. Group by level
  const levelGroups = groupBlocksByLevel(blocks);

  // 5. Build hierarchy
  const root = buildHierarchy(levelGroups);

  // 6. Create flat list
  const flatList = createFlatList(root);

  // 7. Return structure
  return {
    metadata: {
      filename,
      parsedAt: new Date().toISOString(),
      totalBlocks: flatList.length,
      maxDepth: calculateMaxDepth(root),
    },
    root,
    flatList,
  };
}
```

**Acceptance Criteria**:
- [ ] Returns complete DiagramStructure
- [ ] Metadata populated correctly
- [ ] Root with nested children
- [ ] Flat list contains all blocks
- [ ] Index and path fields populated

---

## Phase 6: Extension Integration

### Task 6.1: Add Message Handler to Extension
**File**: `src/extension.ts`
**Action**: Add message listener for diagram upload

```typescript
// Import parser at top of file
import { parseDiagram } from './parser/diagramParser';

// In FeaturesToggleViewProvider class, after resolveWebviewView method:

private handleMessage(message: any) {
  switch (message.type) {
    case 'uploadDiagram':
      this.handleDiagramUpload(message.data);
      break;
  }
}

private async handleDiagramUpload(data: { name: string; content: string }) {
  try {
    const result = parseDiagram(data.name, data.content);
    this.webviewView?.webview.postMessage({
      type: 'diagramParsed',
      data: result
    });
  } catch (error) {
    this.webviewView?.webview.postMessage({
      type: 'diagramParsed',
      data: { error: error instanceof Error ? error.message : String(error) }
    });
  }
}

// Store webviewView reference in class
private webviewView?: vscode.WebviewView;

// In resolveWebviewView method:
public resolveWebviewView(
  webviewView: vscode.WebviewView,
  context: vscode.WebviewViewResolveContext,
  _token: vscode.CancellationToken
) {
  this.webviewView = webviewView;

  webviewView.webview.options = {
    enableScripts: true,
    localResourceRoots: [
      this.context.extensionUri
    ]
  };

  webviewView.webview.html = this.getHtmlContent(webviewView.webview);

  webviewView.webview.onDidReceiveMessage(
    message => this.handleMessage(message),
    undefined,
    this.context.subscriptions
  );
}
```

**Acceptance Criteria**:
- [ ] Message listener registered
- [ ] `uploadDiagram` message handled
- [ ] Parser service called
- [ ] Response sent to frontend
- [ ] Errors caught and returned

---

## Phase 7: Frontend Updates

### Task 7.1: Add File Extension Validation
**File**: `webview-ui/App.tsx`
**Action**: Validate .drawio extension before upload

```typescript
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    // Validate file extension
    if (!file.name.endsWith('.drawio')) {
      vscode.postMessage({
        type: 'error',
        data: { message: 'Please select a .drawio file' }
      });
      return;
    }
    // ... existing code
  }
};
```

**Acceptance Criteria**:
- [ ] File extension validated
- [ ] Error message for invalid files
- [ ] Valid files proceed to upload

### Task 7.2: Handle Parser Response
**File**: `webview-ui/App.tsx`
**Action**: Add response handler for parsed diagram

```typescript
import { useEffect, useState } from 'react';

function App() {
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ... existing code

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'diagramParsed':
          if (message.data.error) {
            setError(message.data.error);
            setParsedData(null);
          } else {
            setParsedData(message.data);
            setError(null);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ... existing code
}
```

**Acceptance Criteria**:
- [ ] Response listener registered
- [ ] Parsed data stored in state
- [ ] Errors handled
- [ ] Cleanup on unmount

---

## Phase 8: Testing

### Task 8.1: Create Unit Tests for Level Grouping
**File**: `src/parser/__tests__/levelGrouping.test.ts` (new file)
**Action**: Test level grouping algorithm

```typescript
import { groupBlocksByLevel } from '../levelGrouping';
import type { BlockWithLevel } from '../../types/diagram';

describe('Level Grouping', () => {
  it('should group blocks with same Y coordinate on same level', () => {
    // Test case: blocks with y=130 and y=135 are same level (diff ≤ 10px)
  });

  it('should create new level when Y difference exceeds threshold', () => {
    // Test case: blocks with y=130 and y=220 are different levels (diff > 10px)
  });

  it('should handle single block', () => {
    // Test case: only one block
  });
});
```

### Task 8.2: Create Unit Tests for Corridor Algorithm
**File**: `src/parser/__tests__/corridorAlgorithm.test.ts` (new file)
**Action**: Test corridor algorithm

```typescript
import { calculateCorridor, findParent, buildHierarchy } from '../corridorAlgorithm';
import type { BlockWithLevel, LevelGroup } from '../../types/diagram';

describe('Corridor Algorithm', () => {
  describe('calculateCorridor', () => {
    it('should calculate corridor with left neighbor', () => {
      // Test case: left boundary is left edge of block to the left
    });

    it('should calculate corridor without left neighbor', () => {
      // Test case: left boundary is block's own left edge
    });

    it('should calculate corridor with right neighbor', () => {
      // Test case: right boundary is left edge of block to the right
    });

    it('should calculate corridor without right neighbor (Infinity)', () => {
      // Test case: right boundary is Infinity
    });
  });

  describe('findParent', () => {
    it('should find parent when block left edge is within corridor', () => {
      // Test case: block.x >= corridor.left && block.x < corridor.right
    });

    it('should return null when no corridor matches', () => {
      // Test case: block outside all corridors
    });

    it('should check levels from top to bottom', () => {
      // Test case: prioritize higher levels
    });
  });

  describe('buildHierarchy', () => {
    it('should identify root as first block of first level', () => {
      // Test case: smallest Y, first in level 0
    });

    it('should assign sequential indices to children', () => {
      // Test case: 1, 2, 3 for first, second, third child
    });

    it('should generate correct path strings', () => {
      // Test case: "1", "2", "1.1", "1.2", "2.1"
    });

    it('should handle edge case: child attaches to root when outside all corridors', () => {
      // Test case: level 2 block outside all level 1 corridors
    });
  });
});
```

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] Edge cases covered
- [ ] Code coverage > 80%

### Task 8.3: Integration Test with Sample File
**File**: `test/sample.drawio` (new file)
**Action**: Test with provided example XML

**Acceptance Criteria**:
- [ ] Sample file parses correctly
- [ ] Hierarchy matches expected structure
- [ ] All blocks present in output
- [ ] Index and path values correct

---

## Phase 9: Documentation

### Task 9.1: Update README
**File**: `README.md` (create if not exists)
**Action**: Document the new feature

```markdown
## Draw.io Diagram Parser

### Usage
1. Click "Загрузить файл" button in the sidebar
2. Select a .drawio file
3. The diagram will be parsed and returned as JSON

### JSON Structure
```json
{
  "metadata": {
    "filename": "diagram.drawio",
    "parsedAt": "2026-02-13T13:00:00.000Z",
    "totalBlocks": 10,
    "maxDepth": 3
  },
  "root": {
    "index": 0,
    "path": "",
    "content": "Root content",
    "style": {
      "x": 40,
      "y": 30,
      "width": 1300,
      "height": 70,
      "style": "rounded=1;whiteSpace=wrap;html=1;"
    },
    "children": [...]
  },
  "flatList": [...]
}
```

### Hierarchy Algorithm
Blocks are organized based on their spatial position:

**Level Detection**:
- Levels determined by Y coordinate (smaller Y = higher level)
- Blocks with Y difference ≤ 10px are on the same level

**Corridor Principle**:
- A corridor is a horizontal space defined by left and right boundaries
- Left boundary: left edge of the block to the left, or the block's own left edge
- Right boundary: left edge of the block to the right, or Infinity
- A lower block belongs to an upper block if its **left edge** is within the corridor

**Index and Path**:
- `index`: Sequential number among siblings (1-based)
- `path`: Dot-separated path from root (e.g., "1.2.3")
```

**Acceptance Criteria**:
- [ ] README updated with feature description
- [ ] Usage instructions included
- [ ] Example output shown
- [ ] Algorithm documented

---

## Implementation Order

1. **Phase 1**: Dependencies and Setup
2. **Phase 2**: Type Definitions
3. **Phase 3**: XML Parsing Module
4. **Phase 4**: Hierarchy Algorithm (Level Grouping, Corridor Algorithm, Helper Functions)
5. **Phase 5**: Main Parser Service
6. **Phase 6**: Extension Integration
7. **Phase 7**: Frontend Updates
8. **Phase 8**: Testing
9. **Phase 9**: Documentation

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1 | 15 min |
| Phase 2 | 30 min |
| Phase 3 | 60 min |
| Phase 4 | 120 min (more complex corridor logic) |
| Phase 5 | 45 min |
| Phase 6 | 30 min |
| Phase 7 | 30 min |
| Phase 8 | 90 min (more test cases needed) |
| Phase 9 | 30 min |
| **Total** | **~7.5 hours** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| XML parsing errors | Add try-catch with detailed error messages |
| Missing geometry | Skip invalid blocks with warnings |
| Ambiguous hierarchy | Document corridor algorithm clearly with examples |
| Level threshold issues | Make LEVEL_THRESHOLD configurable |
| Performance issues | Add file size limits and async processing |
| TypeScript errors | Use strict mode and proper types |
| Corridor edge cases | Add comprehensive unit tests for boundary conditions |
