import type { DiagramBlock } from '../types/diagram';

export function calculateMaxDepth(root: DiagramBlock): number {
  console.log('[HierarchyBuilder] Calculating max depth for block:', root.content);
  if (root.children.length === 0) {
    console.log('[HierarchyBuilder] Block has no children, depth = 0');
    return 0;
  }

  let maxChildDepth = 0;
  for (const child of root.children) {
    const childDepth = calculateMaxDepth(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  const depth = maxChildDepth + 1;
  console.log('[HierarchyBuilder] Block depth:', depth);
  return depth;
}

export function createFlatList(root: DiagramBlock): DiagramBlock[] {
  console.log('[HierarchyBuilder] Creating flat list from root:', root.content);
  const result: DiagramBlock[] = [root];

  function traverse(block: DiagramBlock) {
    for (const child of block.children) {
      result.push(child);
      traverse(child);
    }
  }

  traverse(root);
  console.log('[HierarchyBuilder] Flat list created with', result.length, 'blocks');
  return result;
}
