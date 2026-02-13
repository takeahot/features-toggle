# Feature Requirements: Draw.io Diagram Parser

## Overview
Implement a draw.io (.drawio) file parser that converts XML diagram data into a structured JSON format with hierarchical relationships based on spatial positioning.

## User Story
As a user of the VS Code extension, I want to upload a drawio diagram file from the sidebar panel and receive a structured JSON representation that preserves the diagram's content, styling, and hierarchical relationships, so that I can programmatically work with the diagram data.

## Functional Requirements

### FR-1: File Upload UI
- **Location**: Sidebar webview panel (Features Toggle view)
- **Component**: Upload button with label "Загрузить файл" (Load file)
- **File Type**: .drawio files only
- **Trigger**: Click on button opens file picker dialog
- **Current Status**: ✅ Already implemented in [`webview-ui/App.tsx`](../webview-ui/App.tsx)

### FR-2: File Transmission to Backend
- **Direction**: Frontend → Backend (VS Code extension)
- **Protocol**: VSCode Webview message passing (`vscode.postMessage`)
- **Message Format**:
  ```typescript
  {
    type: 'uploadDiagram',
    data: {
      name: string,      // filename
      content: string    // XML content as string
    }
  }
  ```
- **Current Status**: ✅ Already implemented

### FR-3: XML Parsing
- **Dependencies**:
  - `fast-xml-parser` - for XML parsing
  - `he` - for HTML entity decoding
- **Input**: XML string from drawio file
- **Output**: Parsed JavaScript object
- **Installation Required**: Add to `src/package.json`

### FR-4: Hierarchical Structure Detection

#### FR-4.1: Root Identification
- **Criteria**: The topmost block (smallest `y` coordinate) becomes the root
- **Uniqueness**: Only one root element exists

#### FR-4.2: Parent-Child Relationship Algorithm (Corridor Principle)
For each block, determine its parent by checking blocks above it using the corridor method.

**Corridor Definition**:
A corridor is a horizontal space defined by left and right boundaries. A lower-level block belongs to an upper-level block if the lower block's **left edge** falls within the corridor boundaries of the upper block.

**Algorithm Steps**:

1. **Sort all blocks by Y coordinate ascending** (smallest Y = highest level)

2. **For each block (starting from the second)**, find its parent:

3. **Determine the corridor for the upper block (potential parent)**:
   - The corridor extends from the upper level down to the lower level
   - **Left boundary of corridor**: The left edge of the upper block itself
   - **Right boundary of corridor**:
     - If there is a block to the right of the upper block (on the same level): use the left edge of that right block
     - Otherwise: the corridor extends to the full width of the lower level (infinity)

4. **Check if current block belongs to the upper block**:
   ```
   currentBlockLeft = currentBlock.x
   isWithinCorridor = (corridorLeft <= currentBlockLeft < corridorRight)
   ```

5. **If the block is within the corridor**, it becomes a child of the upper block

6. **If the block is NOT within the corridor**, recursively check the next level up

**Visual Example**:
```
Level 0:  [Root Block - wide corridor]
          x=40, width=1300
          Corridor: 40 → ∞ (no block to the right)

Level 1:  [Block A]    [Block B]    [Block C]
          x=40         x=1080       x=1215
          width=120    width=120     width=120
          
          Block A's corridor: 40 → 1080 (left edge of Block B)
          Block B's corridor: 1080 → 1215 (left edge of Block C)
          Block C's corridor: 1215 → ∞ (no block to the right)

Level 2:  [Child 1]    [Child 2]    [Child 3]
          x=40         x=300        x=430
          
          Child 1 (x=40) is in Block A's corridor (40 ≤ 40 < 1080) → Child of Block A
          Child 2 (x=300) is in Block A's corridor (40 ≤ 300 < 1080) → Child of Block A
          Child 3 (x=430) is in Block A's corridor (40 ≤ 430 < 1080) → Child of Block A
```

**Edge Cases**:
- If a block's left edge is outside all corridors on its level, it becomes a child of the root
- Multiple blocks can share the same parent
- A parent can have multiple children
- Blocks at the same level are determined by Y coordinate proximity

#### FR-4.3: Level Detection
- **Level determination**: Based on Y coordinate (smaller Y = higher level)
- **Same-level threshold**: Blocks whose top Y coordinates differ by ≤10px are considered on the same level
- **Level 0**: Root block (smallest Y coordinate)
- **Level 1**: Blocks on the next level (Y > root Y, within 10px of each other)
- **Level N**: Recursively determined based on Y coordinate differences

**Example**:
```
Block A: y=30   → Level 0 (root)
Block B: y=130  → Level 1
Block C: y=135  → Level 1 (difference from B is 5px ≤ 10px)
Block D: y=220  → Level 2 (difference from C is 85px > 10px)
```

### FR-5: JSON Output Format

#### FR-5.1: Schema Definition
```typescript
interface DiagramBlockStyle {
  x: number;                   // X coordinate
  y: number;                   // Y coordinate
  width: number;               // Block width
  height: number;              // Block height
  style: string;               // Original style attribute from XML
}

interface DiagramBlock {
  index: number;               // Sequential number relative to parent (1-based)
  path: string;                // Parent path with dots (e.g., "1.2.3" for 3rd child of 2nd child of 1st root child)
  content: string;             // Text content (HTML decoded)
  style: DiagramBlockStyle;    // All styling and geometry properties
  children: DiagramBlock[];    // Nested children array
}

interface DiagramStructure {
  metadata: {
    filename: string;
    parsedAt: string;          // ISO timestamp
    totalBlocks: number;
    maxDepth: number;
  };
  root: DiagramBlock;          // The root block with all children
  flatList: DiagramBlock[];   // All blocks in flat array
}
```

#### FR-5.2: Style Separation
- All styling and geometry properties are grouped under the `style` key
- The `style.style` property contains the raw style string from the XML
- Example: `style.style = "rounded=1;whiteSpace=wrap;html=1;"`
- Style is separate from `content` (text content)
- This allows reconstruction without parsing styles

#### FR-5.3: Content Preservation
- `content` contains the block's text content
- HTML entities should be decoded using `he.decode()`
- HTML tags within content should be preserved as-is
- Example: `"создать пустое расширение с ts"`

#### FR-5.4: Index and Path
- `index`: Sequential number (1-based) indicating the child's position among its siblings
- `path`: Dot-separated path from root, e.g.:
  - Root's first child: `"1"`
  - First child's second child: `"1.2"`
  - Second child's third child's first child: `"2.3.1"`

### FR-6: Backend Message Handling
- **Location**: [`src/extension.ts`](../src/extension.ts)
- **Event Listener**: `webviewView.webview.onDidReceiveMessage`
- **Message Type**: `uploadDiagram`
- **Processing Flow**:
  1. Receive message with file data
  2. Parse XML using `fast-xml-parser`
  3. Extract all vertex blocks (mxCell with `vertex="1"`)
  4. Group blocks by level (Y coordinate with 10px threshold)
  5. Build hierarchical structure using corridor algorithm
  6. Generate JSON output with index and path
  7. Send response back to frontend

### FR-7: Response to Frontend
- **Direction**: Backend → Frontend
- **Protocol**: `webviewView.webview.postMessage`
- **Message Format**:
  ```typescript
  {
    type: 'diagramParsed',
    data: DiagramStructure | { error: string }
  }
  ```

## Non-Functional Requirements

### NFR-1: Performance
- Parse files up to 1MB within 2 seconds
- Handle diagrams with up to 500 blocks

### NFR-2: Error Handling
- Invalid XML: Return error message to frontend
- Missing root: Return error (at least one block required)
- Malformed geometry: Skip block with warning

### NFR-3: Code Quality
- TypeScript strict mode
- Proper type definitions for all interfaces
- Unit tests for corridor algorithm
- Comments explaining complex logic

## Technical Implementation Notes

### XML Structure Reference
Drawio files contain mxGraphModel with mxCell elements:
```xml
<mxCell id="BWrl4CKagiNaTvZXqafX-2"
        parent="1"
        style="rounded=1;whiteSpace=wrap;html=1;"
        value="text content"
        vertex="1">
  <mxGeometry height="70" width="1300" x="40" y="30" as="geometry" />
</mxCell>
```

### Parsing Steps
1. Parse XML to JavaScript object
2. Navigate to `mxfile > diagram > mxGraphModel > root > mxCell`
3. Filter cells where `vertex="1"` (ignore edges and other elements)
4. Extract `value`, `style`, and geometry (`x`, `y`, `width`, `height`)
5. Group blocks by level (Y coordinate with 10px threshold)
6. First group (smallest Y) becomes level 0, first block is root
7. For each subsequent level, assign parents using corridor algorithm
8. Assign sequential indices to children
9. Build path strings (dot-separated indices)
10. Build tree structure

### Dependencies to Add
```json
{
  "dependencies": {
    "fast-xml-parser": "^4.5.0",
    "he": "^1.2.0"
  }
}
```

## Example Input/Output

### Input (simplified XML)
```xml
<mxCell id="root" value="Main Feature" vertex="1">
  <mxGeometry x="40" y="30" width="1300" height="70" />
</mxCell>
<mxCell id="child1" value="Subtask 1" vertex="1">
  <mxGeometry x="40" y="130" width="120" height="60" />
</mxCell>
<mxCell id="child2" value="Subtask 2" vertex="1">
  <mxGeometry x="1080" y="130" width="120" height="60" />
</mxCell>
<mxCell id="grandchild1" value="Detail 1" vertex="1">
  <mxGeometry x="40" y="220" width="120" height="60" />
</mxCell>
```

### Output (JSON)
```json
{
  "metadata": {
    "filename": "diagram.drawio",
    "parsedAt": "2026-02-13T13:00:00.000Z",
    "totalBlocks": 4,
    "maxDepth": 2
  },
  "root": {
    "index": 0,
    "path": "",
    "content": "Main Feature",
    "style": {
      "x": 40,
      "y": 30,
      "width": 1300,
      "height": 70,
      "style": "rounded=1;whiteSpace=wrap;html=1;"
    },
    "children": [
      {
        "index": 1,
        "path": "1",
        "content": "Subtask 1",
        "style": {
          "x": 40,
          "y": 130,
          "width": 120,
          "height": 60,
          "style": "..."
        },
        "children": [
          {
            "index": 1,
            "path": "1.1",
            "content": "Detail 1",
            "style": {
              "x": 40,
              "y": 220,
              "width": 120,
              "height": 60,
              "style": "..."
            },
            "children": []
          }
        ]
      },
      {
        "index": 2,
        "path": "2",
        "content": "Subtask 2",
        "style": {
          "x": 1080,
          "y": 130,
          "width": 120,
          "height": 60,
          "style": "..."
        },
        "children": []
      }
    ]
  },
  "flatList": [...]
}
```

## Success Criteria
- ✅ User can upload .drawio file from sidebar
- ✅ Backend receives and parses the file
- ✅ Hierarchical structure is correctly determined using corridor algorithm
- ✅ JSON output preserves all necessary data for reconstruction
- ✅ Frontend receives and can display the parsed structure
- ✅ Error cases are handled gracefully

## Open Questions
- Should the frontend display the parsed JSON or use it for other purposes?
- Should we add file validation (check for .drawio extension) before sending to backend?
- Should we support multiple diagrams within one .drawio file?
