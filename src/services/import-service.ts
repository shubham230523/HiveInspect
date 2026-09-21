import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { importSpectoraXls } from '../parser/importer';
import { ImportResult } from '../domain/models';

/**
 * Singleton service to manage the active import state across screens.
 */
class ImportService {
  private currentResult: ImportResult | null = null;
  private currentFileName: string | null = null;

  async pickAndParseFile(): Promise<ImportResult | null> {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) return null;

      const asset = pickerResult.assets[0];
      this.currentFileName = asset.name;

      let buffer: ArrayBuffer;
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        buffer = await response.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        buffer = bytes.buffer;
      }

      this.currentResult = await importSpectoraXls(buffer, asset.name.replace(/\.[^/.]+$/, ""));
      return this.currentResult;
    } catch (e) {
      console.error('Import Error:', e);
      throw e;
    }
  }

  getResult() {
    return this.currentResult;
  }

  getFileName() {
    return this.currentFileName;
  }

  clear() {
    this.currentResult = null;
    this.currentFileName = null;
  }
}

export const importService = new ImportService();
