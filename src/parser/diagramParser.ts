import { parseDrawioXml, extractVertexCells, extractStyle, extractContent } from './xmlParser';
import { groupBlocksByLevel } from './levelGrouping';
import { buildHierarchy } from './corridorAlgorithm';
import { calculateMaxDepth, createFlatList } from './hierarchyBuilder';
import type { DiagramStructure, DiagramBlock, MxCell, BlockWithLevel } from '../types/diagram';

function convertCellToBlock(cell: MxCell): BlockWithLevel | null {
  const style = extractStyle(cell);
  if (!style) {
    console.log('[DiagramParser] Cell has no valid style, skipping');
    return null;
  }

  const content = extractContent(cell);
  const block = {
    index: 0,
    path: '',
    content,
    style,
    children: [],
    level: 0,
    originalX: style.x,
  };
  console.log('[DiagramParser] Converted cell to block:', content, 'at', style.x, ',', style.y);
  return block;
}

export function parseDiagram(filename: string, xmlContent: string): DiagramStructure {
  console.log('[DiagramParser] Starting parseDiagram for:', filename);
  
  // 1. Parse XML
  console.log('[DiagramParser] Step 1: Parsing XML...');
  const mxFile = parseDrawioXml(xmlContent);
  console.log('[DiagramParser] XML parsed successfully');

  // 2. Extract vertex cells
  console.log('[DiagramParser] Step 2: Extracting vertex cells...');
  const cells = extractVertexCells(mxFile);
  console.log('[DiagramParser] Found', cells.length, 'vertex cells');
  if (cells.length === 0) {
    throw new Error('No vertex blocks found in diagram');
  }

  // 3. Convert to BlockWithLevel objects
  console.log('[DiagramParser] Step 3: Converting to BlockWithLevel...');
  const blocks = cells
    .map(convertCellToBlock)
    .filter((b): b is BlockWithLevel => b !== null);
  console.log('[DiagramParser] Converted to', blocks.length, 'valid blocks');

  if (blocks.length === 0) {
    throw new Error('No valid blocks found');
  }

  // 4. Group by level
  console.log('[DiagramParser] Step 4: Grouping by level...');
  const levelGroups = groupBlocksByLevel(blocks);
  console.log('[DiagramParser] Created', levelGroups.length, 'level groups');

  // 5. Build hierarchy
  console.log('[DiagramParser] Step 5: Building hierarchy...');
  const root = buildHierarchy(levelGroups);
  console.log('[DiagramParser] Hierarchy built, root path:', root.path);

  // 6. Create flat list
  console.log('[DiagramParser] Step 6: Creating flat list...');
  const flatList = createFlatList(root);
  console.log('[DiagramParser] Flat list created with', flatList.length, 'items');

  // 7. Return structure
  const result = {
    metadata: {
      filename,
      parsedAt: new Date().toISOString(),
      totalBlocks: flatList.length,
      maxDepth: calculateMaxDepth(root),
    },
    root,
    flatList,
  };
  console.log('[DiagramParser] Parsing complete, maxDepth:', result.metadata.maxDepth);
  return result;
}
