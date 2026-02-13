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
  console.log('[XmlParser] Parsing XML content, length:', xmlContent.length);
  const result = parser.parse(xmlContent);
  console.log('[XmlParser] XML parsed, keys:', Object.keys(result));
  return result;
}

export function extractVertexCells(mxFile: MxFile): MxCell[] {
  console.log('[XmlParser] Extracting vertex cells...');
  // Navigate to mxCell elements and filter by vertex="1"
  // Handle both single cell and array of cells
  // Return array of vertex cells
  const diagram = mxFile.mxFile?.diagram;
  console.log('[XmlParser] Diagram found:', !!diagram);
  if (!diagram) return [];

  const graphModel = Array.isArray(diagram)
    ? diagram[0]?.mxGraphModel
    : diagram.mxGraphModel;
  console.log('[XmlParser] GraphModel found:', !!graphModel);

  if (!graphModel?.root?.mxCell) return [];

  const cells = Array.isArray(graphModel.root.mxCell)
    ? graphModel.root.mxCell
    : [graphModel.root.mxCell];
  console.log('[XmlParser] Total cells before filter:', cells.length);

  const vertexCells = cells.filter(cell => cell.vertex === '1');
  console.log('[XmlParser] Vertex cells found:', vertexCells.length);
  return vertexCells;
}

export function decodeHtmlEntities(text: string): string {
  return he.decode(text);
}

export function extractStyle(cell: MxCell): DiagramBlockStyle | null {
  const geometry = cell.mxGeometry;
  if (!geometry || geometry.x === undefined || geometry.y === undefined) {
    console.log('[XmlParser] Cell has no valid geometry');
    return null;
  }

  const style = {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width || 0,
    height: geometry.height || 0,
    style: cell.style || '',
  };
  console.log('[XmlParser] Extracted style: x=', style.x, 'y=', style.y, 'w=', style.width, 'h=', style.height);
  return style;
}

export function extractContent(cell: MxCell): string {
  if (!cell.value) {
    console.log('[XmlParser] Cell has no value');
    return '';
  }
  const content = decodeHtmlEntities(cell.value);
  console.log('[XmlParser] Extracted content:', content);
  return content;
}
