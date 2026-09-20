import { SPECTORA_COLUMNS, FIELD_COVERAGE } from '../constants';

describe('Field Coverage', () => {
  test('all 42 source fields should have a classification', () => {
    const allFields = Object.values(SPECTORA_COLUMNS);
    expect(allFields.length).toBe(42);

    allFields.forEach(field => {
      expect(FIELD_COVERAGE).toHaveProperty(field);
    });
  });

  test('no undocumented fields should be in coverage', () => {
    const allFields = Object.values(SPECTORA_COLUMNS);
    const coveredFields = Object.keys(FIELD_COVERAGE);

    coveredFields.forEach(field => {
      expect(allFields).toContain(field);
    });
  });
});
