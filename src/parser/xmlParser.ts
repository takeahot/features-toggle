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
