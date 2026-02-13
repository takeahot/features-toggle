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
  parent?: string;
  style?: string;
  value?: string;
  vertex?: string;
  edge?: string;
  mxGeometry?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    as?: string;
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
  mxfile?: {
    host?: string;
    agent?: string;
    version?: string;
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
