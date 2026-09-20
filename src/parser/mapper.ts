import { SPECTORA_COLUMNS } from './constants';
import { SpectoraRawRow } from './types';
import { NormalizedSpectoraRow } from './normalized-models';
import { AnswerType } from '../domain/enums';

export function mapRawRow(raw: SpectoraRawRow): NormalizedSpectoraRow {
  const getStr = (col: string) => String(raw[col] || '').trim();
  const getNum = (col: string) => {
    const val = raw[col];
    if (typeof val === 'number') return val;
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? 0 : parsed;
  };
  const getBool = (col: string) => {
    const val = String(raw[col]).toLowerCase();
    return val === 'true' || val === '1' || val === 'yes';
  };

  const rawAnswerType = getStr(SPECTORA_COLUMNS.ANSWER_TYPE);
  const normalizedAnswerType = normalizeAnswerType(rawAnswerType);

  return {
    sectionName: getStr(SPECTORA_COLUMNS.SECTION_NAME),
    itemName: getStr(SPECTORA_COLUMNS.ITEM_NAME),
    commentName: getStr(SPECTORA_COLUMNS.COMMENT_NAME),
    commentText: getStr(SPECTORA_COLUMNS.COMMENT_TEXT),
    commentType: getStr(SPECTORA_COLUMNS.COMMENT_TYPE),
    category: getStr(SPECTORA_COLUMNS.CATEGORY),
    multipleChoiceOptions: parseMultipleChoice(getStr(SPECTORA_COLUMNS.MULTIPLE_CHOICE_OPTIONS)),
    unitTypeOptions: getStr(SPECTORA_COLUMNS.UNIT_TYPE_OPTIONS),
    recommendation: getStr(SPECTORA_COLUMNS.RECOMMENDATION),
    order: getNum(SPECTORA_COLUMNS.ORDER),
    answerType: normalizedAnswerType,
    defaultValue: getStr(SPECTORA_COLUMNS.DEFAULT_VALUE),
    defaultValue2: getStr(SPECTORA_COLUMNS.DEFAULT_VALUE_2),
    defaultUnitType: getStr(SPECTORA_COLUMNS.DEFAULT_UNIT_TYPE),
    defaultLocation: getStr(SPECTORA_COLUMNS.DEFAULT_LOCATION),
    defaultEstimateMin: getStr(SPECTORA_COLUMNS.DEFAULT_ESTIMATE_MIN),
    defaultEstimateMax: getStr(SPECTORA_COLUMNS.DEFAULT_ESTIMATE_MAX),
    locked: getBool(SPECTORA_COLUMNS.LOCKED),
    simpleFormat: getBool(SPECTORA_COLUMNS.SIMPLE_FORMAT),
    disablePhotos: getBool(SPECTORA_COLUMNS.DISABLE_PHOTOS),
    uses: getStr(SPECTORA_COLUMNS.USES),
    lastModified: getStr(SPECTORA_COLUMNS.LAST_MODIFIED),
    photos: mapPhotos(raw),
    rawMetadata: { ...raw, originalAnswerType: rawAnswerType },
  };
}

function normalizeAnswerType(type: string): AnswerType | string {
  const t = type.toLowerCase();
  if (Object.values(AnswerType).includes(t as AnswerType)) {
    return t as AnswerType;
  }
  // Common Spectora variations
  if (t === 'multiple choice') return AnswerType.CHECKBOX;

  return type || AnswerType.TEXT;
}

function parseMultipleChoice(optionsStr: string): string[] {
  if (!optionsStr) return [];
  // Spectora typically uses | or newline. We'll handle both.
  return optionsStr.split(/[|\n]/).map(o => o.trim()).filter(Boolean);
}

function mapPhotos(raw: SpectoraRawRow): { url: string; caption: string }[] {
  const photos: { url: string; caption: string }[] = [];
  for (let i = 1; i <= 10; i++) {
    const url = String(raw[`Default Photo ${i}`] || '').trim();
    const caption = String(raw[`Default Photo ${i} Caption`] || '').trim();
    if (url || caption) {
      photos.push({ url, caption });
    }
  }
  return photos;
}
