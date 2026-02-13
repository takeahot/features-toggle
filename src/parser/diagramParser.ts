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
