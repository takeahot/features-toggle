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
