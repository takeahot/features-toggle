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
