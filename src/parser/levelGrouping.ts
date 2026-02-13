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
