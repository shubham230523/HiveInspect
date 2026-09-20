import * as XLSX from 'xlsx';
import { SPECTORA_COLUMNS } from '../../constants';

export function createAlternativeTemplate(): Buffer {
  const data = [
    {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'Kitchen',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'Sink',
      [SPECTORA_COLUMNS.COMMENT_NAME]: 'Leaking',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: 'The sink is leaking.',
      [SPECTORA_COLUMNS.ORDER]: 1,
      [SPECTORA_COLUMNS.ANSWER_TYPE]: 'text',
    },
    {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'Kitchen',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'Dishwasher',
      [SPECTORA_COLUMNS.COMMENT_NAME]: 'Not draining',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: 'Water stays at bottom.',
      [SPECTORA_COLUMNS.ORDER]: 2,
      [SPECTORA_COLUMNS.ANSWER_TYPE]: 'checkbox',
      [SPECTORA_COLUMNS.MULTIPLE_CHOICE_OPTIONS]: 'Clogged|Pump failure',
    },
    {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'Basement',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'Walls',
      [SPECTORA_COLUMNS.COMMENT_NAME]: 'Dampness',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: 'Evidence of moisture.',
      [SPECTORA_COLUMNS.ORDER]: 1,
      [SPECTORA_COLUMNS.ANSWER_TYPE]: 'boolean',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Templates');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
