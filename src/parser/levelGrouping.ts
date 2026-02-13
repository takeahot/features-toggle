import type { BlockWithLevel, LevelGroup } from '../types/diagram';

const LEVEL_THRESHOLD = 10; // pixels

export function groupBlocksByLevel(blocks: BlockWithLevel[]): LevelGroup[] {
  console.log('[LevelGrouping] Starting with', blocks.length, 'blocks');
  if (blocks.length === 0) return [];

  // Sort by Y coordinate ascending
  const sorted = [...blocks].sort((a, b) => a.style.y - b.style.y);
  console.log('[LevelGrouping] Blocks sorted by Y');

  const groups: LevelGroup[] = [];
  let currentGroup: BlockWithLevel[] = [sorted[0]];
  let currentLevel = 0;
  sorted[0].level = 0;
  console.log('[LevelGrouping] Level 0: first block at Y:', sorted[0].style.y);

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
      console.log('[LevelGrouping] New level', currentLevel + 1, ': Y diff', yDiff, 'from', prevBlock.style.y, 'to', block.style.y);
      groups.push({ level: currentLevel, blocks: currentGroup });
      currentLevel++;
      block.level = currentLevel;
      currentGroup = [block];
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    console.log('[LevelGrouping] Final level', currentLevel, ':', currentGroup.length, 'blocks');
    groups.push({ level: currentLevel, blocks: currentGroup });
  }

  console.log('[LevelGrouping] Total levels created:', groups.length);
  return groups;
}
