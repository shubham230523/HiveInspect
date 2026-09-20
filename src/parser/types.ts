import { SPECTORA_COLUMNS } from './constants';

export type SpectoraRawRow = {
  [K in keyof typeof SPECTORA_COLUMNS as typeof SPECTORA_COLUMNS[K]]: string | number;
} & { [key: string]: string | number };

export interface ParserResult {
  rows: SpectoraRawRow[];
  headers: string[];
  errors: string[];
}
