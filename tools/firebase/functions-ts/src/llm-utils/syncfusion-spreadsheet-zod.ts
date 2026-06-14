import { z } from 'zod';

// CellStyle schema
const CellStyleSchema = z.object({
  fontFamily: z
    .enum([
      'Arial',
      'Arial Black',
      'Axettac Demo',
      'Batang',
      'Book Antiqua',
      'Calibri',
      'Courier',
      'Courier New',
      'Din Condensed',
      'Georgia',
      'Helvetica',
      'Helvetica New',
      'Roboto',
      'Tahoma',
      'Times New Roman',
      'Verdana',
    ])
    .optional(),
  verticalAlign: z.enum(['bottom', 'middle', 'top']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  textIndent: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontWeight: z.enum(['bold', 'normal']).optional(),
  fontStyle: z.enum(['italic', 'normal']).optional(),
  fontSize: z.string().optional(),
  textDecoration: z
    .enum(['underline', 'line-through', 'underline line-through', 'none'])
    .optional(),
  border: z.string().optional(),
  borderTop: z.string().optional(),
  borderBottom: z.string().optional(),
  borderLeft: z.string().optional(),
  borderRight: z.string().optional(),
});

// Validation schema
const ValidationSchema = z.object({
  type: z.enum([
    'WholeNumber',
    'Decimal',
    'Date',
    'TextLength',
    'List',
    'Time',
  ]),
  operator: z
    .enum([
      'Between',
      'NotBetween',
      'EqualTo',
      'NotEqualTo',
      'LessThan',
      'GreaterThan',
      'GreaterThanOrEqualTo',
      'LessThanOrEqualTo',
    ])
    .optional(),
  value1: z.string().optional(),
  value2: z.string().optional(),
  ignoreBlank: z.boolean().optional(),
  inCellDropDown: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
});

// Image schema
const ImageSchema = z.object({
  src: z.string(),
  id: z.string().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  top: z.number().optional(),
  left: z.number().optional(),
});

// Cell schema
const CellSchema = z.object({
  value: z.string().optional(),
  formula: z.string().optional(),
  format: z.string().optional(),
  hyperlink: z.string().optional(),
  wrap: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  colSpan: z.number().optional(),
  rowSpan: z.number().optional(),
  style: CellStyleSchema.optional(),
  validation: ValidationSchema.optional(),
  image: z.array(ImageSchema).optional(),
});

// Row schema
const RowSchema = z.object({
  height: z.number().optional(),
  customHeight: z.boolean().optional(),
  hidden: z.boolean().optional(),
  cells: z.array(CellSchema).optional(),
});

// Column schema
const ColumnSchema = z.object({
  width: z.number().optional(),
  customWidth: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

// ConditionalFormat schema
const ConditionalFormatSchema = z.object({
  type: z.enum([
    'GreaterThan',
    'LessThan',
    'Between',
    'EqualTo',
    'ContainsText',
    'DateOccur',
    'Duplicate',
    'Unique',
    'Top10Items',
    'Bottom10Items',
    'Top10Percentage',
    'Bottom10Percentage',
    'BelowAverage',
    'AboveAverage',
    'BlueDataBar',
    'GreenDataBar',
    'RedDataBar',
    'OrangeDataBar',
    'LightBlueDataBar',
    'PurpleDataBar',
    'GYRColorScale',
    'RYGColorScale',
    'GWRColorScale',
    'RWGColorScale',
    'BWRColorScale',
    'RWBColorScale',
    'WRColorScale',
    'RWColorScale',
    'GWColorScale',
    'WGColorScale',
    'GYColorScale',
    'YGColorScale',
    'ThreeArrows',
    'ThreeArrowsGray',
    'FourArrowsGray',
    'FourArrows',
    'FiveArrowsGray',
    'FiveArrows',
    'ThreeTrafficLights1',
    'ThreeTrafficLights2',
    'ThreeSigns',
    'FourTrafficLights',
    'FourRedToBlack',
    'ThreeSymbols',
    'ThreeSymbols2',
    'ThreeFlags',
    'FourRating',
    'FiveQuarters',
    'FiveRating',
    'ThreeTriangles',
    'ThreeStars',
    'FiveBoxes',
  ]),
  format: z.string().optional(),
  cFColor: z.enum(['RedFT', 'YellowFT', 'GreenFT', 'RedF', 'RedT']).optional(),
  value: z.string().optional(),
  range: z.string().optional(),
});

// Sheet schema
const SheetSchema = z.object({
  name: z.string(),
  selectedRange: z.string().optional(),
  activeCell: z.string().optional(),
  topLeftCell: z.string().optional(),
  showHeaders: z.boolean().optional(),
  showGridLines: z.boolean().optional(),
  isProtected: z.boolean().optional(),
  state: z.enum(['visible', 'hidden', 'veryHidden']).optional(),
  columns: z.array(ColumnSchema).optional(),
  rows: z.array(RowSchema).optional(),
  conditionalFormats: z.array(ConditionalFormatSchema).optional(),
});

// DefinedName schema
const DefinedNameSchema = z.object({
  name: z.string(),
  scope: z.string().optional(),
  comment: z.string().optional(),
  refersTo: z.string().optional(),
});

// Workbook schema
const WorkbookSchema = z.object({
  activeSheetIndex: z.number(),
  sheets: z.array(SheetSchema),
  definedNames: z.array(DefinedNameSchema).optional(),
});

// Final Schema
export const SyncfusionSpreadsheetSchema = z.object({
  Workbook: WorkbookSchema,
});
