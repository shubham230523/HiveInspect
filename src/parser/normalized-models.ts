export interface NormalizedSpectoraRow {
  sectionName: string;
  itemName: string;
  commentName: string;
  commentText: string;
  commentType: string;
  category: string;
  multipleChoiceOptions: string[];
  unitTypeOptions: string;
  recommendation: string;
  order: number;
  answerType: string;
  defaultValue: string;
  defaultValue2: string;
  defaultUnitType: string;
  defaultLocation: string;
  defaultEstimateMin: string;
  defaultEstimateMax: string;
  locked: boolean;
  simpleFormat: boolean;
  disablePhotos: boolean;
  uses: string;
  lastModified: string;
  photos: {
    url: string;
    caption: string;
  }[];
  rawMetadata: Record<string, any>;
}
