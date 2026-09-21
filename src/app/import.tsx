import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { importSpectoraXls } from '@/parser/importer';
import { saveTemplate } from '@/repository/template-repository';
import { ImportResult } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { REQUIRED_HEADERS } from '@/parser/constants';

export default function ImportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handlePickFile = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) return;

      const asset = pickerResult.assets[0];
      setFileName(asset.name);
      setLoading(true);
      setResult(null);

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

      const importResult = await importSpectoraXls(buffer, asset.name.replace(/\.[^/.]+$/, ""));
      setResult(importResult);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick or parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result?.template || loading) return;
    setLoading(true);
    const { error } = await saveTemplate(result.template);

    if (error) {
      setLoading(false);
      const msg = error.message || 'Failed to save template to database';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } else {
      // Success
      if (Platform.OS === 'web') {
        window.alert('Template imported successfully');
        router.replace('/dashboard');
      } else {
        Alert.alert('Success', 'Template imported successfully', [
          { text: 'OK', onPress: () => router.replace('/dashboard') }
        ]);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Import Template' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!result ? (
          <View style={styles.pickContainer}>
            <ThemedText type="subtitle">Select a Spectora Export (XLS/XLSX)</ThemedText>
            <TouchableOpacity
              onPress={handlePickFile}
              style={styles.pickButton}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <ThemedText style={{ color: 'white' }}>Choose File</ThemedText>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.importHeader}>
               <ThemedText type="title">Import Review</ThemedText>
               <ThemedText type="defaultSemiBold">File: {fileName}</ThemedText>
            </View>

            <View style={styles.grid}>
              <View style={styles.statsCard}>
                <ThemedText type="defaultSemiBold">Import Summary</ThemedText>
                <View style={styles.statRow}><ThemedText type="small">Rows</ThemedText><ThemedText type="smallBold">{result.rowsProcessed}</ThemedText></View>
                <View style={styles.statRow}><ThemedText type="small">Sections</ThemedText><ThemedText type="smallBold">{result.sectionsCreated}</ThemedText></View>
                <View style={styles.statRow}><ThemedText type="small">Items</ThemedText><ThemedText type="smallBold">{result.itemsCreated}</ThemedText></View>
                <View style={styles.statRow}><ThemedText type="small">Comments</ThemedText><ThemedText type="smallBold">{result.commentsCreated}</ThemedText></View>
              </View>

              {result.preservationStats && (
                <View style={[styles.statsCard, { borderColor: '#10B981' }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: '#059669' }}>✓ Preservation Health</ThemedText>
                  <ThemedText type="small">Comparing source export to imported structure.</ThemedText>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">SOURCE</ThemedText>
                      <ThemedText type="small">{result.preservationStats.source.sections} Sections</ThemedText>
                      <ThemedText type="small">{result.preservationStats.source.items} Items</ThemedText>
                      <ThemedText type="small">{result.preservationStats.source.comments} Comments</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">IMPORTED</ThemedText>
                      <ThemedText type="small">{result.preservationStats.imported.sections} Sections</ThemedText>
                      <ThemedText type="small">{result.preservationStats.imported.items} Items</ThemedText>
                      <ThemedText type="small">{result.preservationStats.imported.comments} Comments</ThemedText>
                    </View>
                  </View>
                  {result.preservationStats.source.comments === result.preservationStats.imported.comments ? (
                    <ThemedText type="small" style={{ color: 'green', marginTop: 5 }}>✓ 100% of rows preserved</ThemedText>
                  ) : (
                    <ThemedText type="small" style={{ color: 'orange', marginTop: 5 }}>⚠ Some rows filtered or grouped</ThemedText>
                  )}
                </View>
              )}
            </View>

            {result.fieldCoverage && (
              <View style={styles.statsCard}>
                <ThemedText type="defaultSemiBold">Field Fidelity Report</ThemedText>
                <View style={styles.coverageGrid}>
                   <View style={styles.coverageItem}>
                      <ThemedText style={{ color: 'green', fontWeight: '700' }}>{result.fieldCoverage.supported.length}</ThemedText>
                      <ThemedText type="small">Supported</ThemedText>
                   </View>
                   <View style={styles.coverageItem}>
                      <ThemedText style={{ color: '#208AEF', fontWeight: '700' }}>{result.fieldCoverage.metadata.length}</ThemedText>
                      <ThemedText type="small">Metadata</ThemedText>
                   </View>
                   <View style={styles.coverageItem}>
                      <ThemedText style={{ color: 'orange', fontWeight: '700' }}>{result.fieldCoverage.unsupported.length}</ThemedText>
                      <ThemedText type="small">Unsupported</ThemedText>
                   </View>
                   <View style={styles.coverageItem}>
                      <ThemedText style={{ color: 'gray', fontWeight: '700' }}>{result.fieldCoverage.missing.length}</ThemedText>
                      <ThemedText type="small">Missing</ThemedText>
                   </View>
                </View>
              </View>
            )}

            {result.errors.length > 0 && (
              <View style={[styles.statsCard, { borderColor: '#ff4444', backgroundColor: '#fffafa' }]}>
                <ThemedText type="defaultSemiBold" style={{ color: '#ff4444' }}>Import Failed:</ThemedText>
                {result.errors.map((e, i) => (
                  <View key={i} style={{ marginTop: 10 }}>
                    <ThemedText style={{ color: '#ff4444' }}>{e}</ThemedText>
                    {e.includes('Missing required headers') && (
                      <ThemedText type="small" style={{ marginTop: 5 }}>
                        Please ensure your spreadsheet includes the following columns:
                        {REQUIRED_HEADERS.join(', ')}.
                      </ThemedText>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setResult(null)}
                  style={[styles.secondaryButton, { marginTop: 15, alignSelf: 'flex-start' }]}
                >
                  <ThemedText>Try Another File</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {result.rowWarnings && result.rowWarnings.length > 0 && (
               <View style={[styles.statsCard, { borderColor: '#ffcc00' }]}>
                 <ThemedText type="defaultSemiBold">Row-Level Warnings ({result.rowWarnings.length}):</ThemedText>
                 <ScrollView style={{ maxHeight: 200, marginTop: 10 }}>
                   {result.rowWarnings.slice(0, 50).map((w, i) => (
                     <View key={i} style={{ marginBottom: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' }}>
                       <ThemedText type="smallBold">Row {w.row}: {w.section} > {w.item}</ThemedText>
                       <ThemedText type="small">{w.message}</ThemedText>
                     </View>
                   ))}
                   {result.rowWarnings.length > 50 && (
                     <ThemedText type="small">... and {result.rowWarnings.length - 50} more warnings.</ThemedText>
                   )}
                 </ScrollView>
               </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setResult(null)}
                style={styles.secondaryButton}
                disabled={loading}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmImport}
                style={styles.primaryButton}
                disabled={loading || !result.success}
              >
                {loading ? <ActivityIndicator color="white" /> : <ThemedText style={{ color: 'white' }}>Confirm Import</ThemedText>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  pickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 20,
  },
  pickButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  importHeader: {
    marginBottom: 10,
    gap: 5,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  coverageGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  coverageItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    minWidth: 80,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
  },
  previewContainer: {
    gap: 20,
  },
  statsCard: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
});
