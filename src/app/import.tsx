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
        router.replace('/');
      } else {
        Alert.alert('Success', 'Template imported successfully', [
          { text: 'OK', onPress: () => router.replace('/') }
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
            <ThemedText type="title">Import Preview</ThemedText>
            <ThemedText type="defaultSemiBold">File: {fileName}</ThemedText>

            <View style={styles.statsCard}>
              <ThemedText type="defaultSemiBold">Import Statistics:</ThemedText>
              <ThemedText>• Rows Processed: {result.rowsProcessed}</ThemedText>
              <ThemedText>• Sections: {result.sectionsCreated}</ThemedText>
              <ThemedText>• Items: {result.itemsCreated}</ThemedText>
              <ThemedText>• Comments: {result.commentsCreated}</ThemedText>
            </View>

            {result.preservationStats \u0026\u0026 (
              <View style={[styles.statsCard, { borderColor: \u0027green\u0027 }]}>
                <ThemedText type="defaultSemiBold">Preservation Check:</ThemedText>
                <View style={styles.row}>
                   <View style={{ flex: 1 }}>
                     <ThemedText type="smallBold">SOURCE</ThemedText>
                     <ThemedText type="small">Sections: {result.preservationStats.source.sections}</ThemedText>
                     <ThemedText type="small">Items: {result.preservationStats.source.items}</ThemedText>
                     <ThemedText type="small">Comments: {result.preservationStats.source.comments}</ThemedText>
                   </View>
                   <View style={{ flex: 1 }}>
                     <ThemedText type="smallBold">IMPORTED</ThemedText>
                     <ThemedText type="small">Sections: {result.preservationStats.imported.sections}</ThemedText>
                     <ThemedText type="small">Items: {result.preservationStats.imported.items}</ThemedText>
                     <ThemedText type="small">Comments: {result.preservationStats.imported.comments}</ThemedText>
                   </View>
                </View>
                {result.preservationStats.source.comments === result.preservationStats.imported.comments ? (
                  <ThemedText type="small" style={{ color: \u0027green\u0027, marginTop: 5 }}>✓ 100% of rows preserved</ThemedText>
                ) : (
                  <ThemedText type="small" style={{ color: \u0027orange\u0027, marginTop: 5 }}>⚠ Some rows filtered or grouped</ThemedText>
                )}
              </View>
            )}

            {result.fieldCoverage && (
              <View style={styles.statsCard}>
                <ThemedText type="defaultSemiBold">Field Fidelity:</ThemedText>
                <ThemedText type="small" style={{ color: 'green' }}>✓ {result.fieldCoverage.supported.length} Fields Supported</ThemedText>
                <ThemedText type="small" style={{ color: '#208AEF' }}>ℹ {result.fieldCoverage.metadata.length} Fields Preserved as Metadata</ThemedText>

                {result.fieldCoverage.unsupported.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <ThemedText type="smallBold" style={{ color: 'orange' }}>Unsupported populated data detected in:</ThemedText>
                    {result.fieldCoverage.unsupported.map((f, i) => (
                      <ThemedText key={i} type="small">• {f}</ThemedText>
                    ))}
                  </View>
                )}

                {result.fieldCoverage.missing.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <ThemedText type="smallBold" style={{ color: 'gray' }}>Fields not present in source:</ThemedText>
                    <ThemedText type="small">• {result.fieldCoverage.missing.length} fields</ThemedText>
                  </View>
                )}
              </View>
            )}

            {result.warnings.length > 0 && (
              <View style={[styles.statsCard, { borderColor: 'orange' }]}>
                <ThemedText type="defaultSemiBold" style={{ color: 'orange' }}>Warnings:</ThemedText>
                {result.warnings.map((w, i) => (
                  <ThemedText key={i} type="small">• {w}</ThemedText>
                ))}
              </View>
            )}

            {result.errors.length > 0 && (
              <View style={[styles.statsCard, { borderColor: 'red' }]}>
                <ThemedText type="defaultSemiBold" style={{ color: 'red' }}>Errors:</ThemedText>
                {result.errors.map((e, i) => (
                  <ThemedText key={i} type="small">• {e}</ThemedText>
                ))}
              </View>
            )}

            {result.rowWarnings && result.rowWarnings.length > 0 && (
               <View style={[styles.statsCard, { borderColor: \u0027#ffcc00\u0027 }]}>
                 <ThemedText type="defaultSemiBold">Row-Level Warnings ({result.rowWarnings.length}):</ThemedText>
                 <ScrollView style={{ maxHeight: 200, marginTop: 10 }}>
                   {result.rowWarnings.slice(0, 50).map((w, i) =\u003e (
                     <View key={i} style={{ marginBottom: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: \u0027rgba(128,128,128,0.1)\u0027 }}>
                       <ThemedText type="smallBold">Row {w.row}: {w.section} \u003e {w.item}</ThemedText>
                       <ThemedText type="small">{w.message}</ThemedText>
                     </View>
                   ))}
                   {result.rowWarnings.length \u003e 50 \u0026\u0026 (
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
    backgroundColor: \u0027#208AEF\u0027,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  row: {
    flexDirection: \u0027row\u0027,
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
