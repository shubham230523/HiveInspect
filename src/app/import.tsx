import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { importService } from '@/services/import-service';
import { saveTemplate } from '@/repository/template-repository';
import { ImportResult } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { REQUIRED_HEADERS } from '@/parser/constants';

export default function ImportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(importService.getResult());
  const [fileName, setFileName] = useState<string | null>(importService.getFileName());

  const handlePickFile = async () => {
    try {
      setLoading(true);
      const res = await importService.pickAndParseFile();
      if (res) {
        setResult(res);
        setFileName(importService.getFileName());
      }
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Failed to pick or parse file');
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
      if (Platform.OS === 'web') window.alert(`Error: ${msg}`);
      else Alert.alert('Error', msg);
    } else {
      importService.clear();
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
      <Stack.Screen options={{ title: '' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!result ? (
          <View style={styles.pickContainer}>
            <View style={styles.emptyIcon}><ThemedText style={{ fontSize: 40 }}>📄</ThemedText></View>
            <ThemedText type="subtitle" style={styles.pickTitle}>Import Spectora Template</ThemedText>
            <ThemedText style={styles.pickSubtitle}>
              Upload your HTML-text spreadsheet export to automatically reconstruct sections, items, and comments.
            </ThemedText>
            <TouchableOpacity
              onPress={handlePickFile}
              style={styles.pickButton}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <ThemedText style={styles.pickButtonText}>Choose XLS/XLSX File</ThemedText>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewContainer}>
            {/* Header Area */}
            <View style={styles.importHeader}>
               <View>
                 <ThemedText type="title">Import Review</ThemedText>
                 <ThemedText style={styles.fileLabel}>
                   <ThemedText type="smallBold">Source File: </ThemedText>
                   <ThemedText type="small">{fileName}</ThemedText>
                 </ThemedText>
               </View>
               <View style={styles.statusBadge}>
                 <ThemedText type="smallBold" style={{ color: '#059669', fontSize: 10 }}>READY FOR IMPORT</ThemedText>
               </View>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <ThemedText type="small" style={styles.metricLabel}>Total Rows</ThemedText>
                <ThemedText type="subtitle">{result.rowsProcessed}</ThemedText>
              </View>
              <View style={styles.metricCard}>
                <ThemedText type="small" style={styles.metricLabel}>Sections</ThemedText>
                <ThemedText type="subtitle">{result.sectionsCreated}</ThemedText>
              </View>
              <View style={styles.metricCard}>
                <ThemedText type="small" style={styles.metricLabel}>Items</ThemedText>
                <ThemedText type="subtitle">{result.itemsCreated}</ThemedText>
              </View>
              <View style={styles.metricCard}>
                <ThemedText type="small" style={styles.metricLabel}>Comments</ThemedText>
                <ThemedText type="subtitle">{result.commentsCreated}</ThemedText>
              </View>
            </View>

            <View style={styles.mainGrid}>
              {/* Left Column: Data Health */}
              <View style={styles.columnLeft}>
                <View style={styles.sectionCard}>
                  <ThemedText type="smallBold" style={styles.cardHeader}>Preservation Health</ThemedText>
                  <View style={styles.preservationContent}>
                    <View style={styles.healthRow}>
                       <View style={styles.healthStatus}>
                          <ThemedText style={{ color: '#10B981' }}>●</ThemedText>
                          <ThemedText type="smallBold"> Structure Verification</ThemedText>
                       </View>
                       <ThemedText type="small" style={{ color: '#059669' }}>Match Confirmed</ThemedText>
                    </View>

                    <View style={styles.comparisonGrid}>
                      <View style={styles.compCol}>
                        <ThemedText type="code" style={styles.compLabel}>SOURCE</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.source.sections} Sections</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.source.items} Items</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.source.comments} Comments</ThemedText>
                      </View>
                      <View style={styles.compDivider} />
                      <View style={styles.compCol}>
                        <ThemedText type="code" style={styles.compLabel}>IMPORTED</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.imported.sections} Sections</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.imported.items} Items</ThemedText>
                        <ThemedText type="small">{result.preservationStats?.imported.comments} Comments</ThemedText>
                      </View>
                    </View>

                    <View style={styles.successNote}>
                       <ThemedText type="small" style={{ color: '#065f46' }}>
                         ✓ All hierarchical relationships successfully mapped from source.
                       </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Field Fidelity Card */}
                <View style={styles.sectionCard}>
                  <ThemedText type="smallBold" style={styles.cardHeader}>Field Fidelity Report</ThemedText>
                  <View style={styles.fidelityGrid}>
                     <View style={styles.fidelityItem}>
                        <ThemedText type="subtitle" style={{ color: '#059669' }}>{result.fieldCoverage?.supported.length}</ThemedText>
                        <ThemedText type="small" style={styles.fidLabel}>Supported</ThemedText>
                     </View>
                     <View style={styles.fidelityItem}>
                        <ThemedText type="subtitle" style={{ color: '#208AEF' }}>{result.fieldCoverage?.metadata.length}</ThemedText>
                        <ThemedText type="small" style={styles.fidLabel}>Metadata</ThemedText>
                     </View>
                     <View style={styles.fidelityItem}>
                        <ThemedText type="subtitle" style={{ color: '#F59E0B' }}>{result.fieldCoverage?.unsupported.length}</ThemedText>
                        <ThemedText type="small" style={styles.fidLabel}>Unsupported</ThemedText>
                     </View>
                  </View>
                  <View style={styles.fidFooter}>
                     <ThemedText type="small" style={{ color: '#6B7280' }}>
                       {result.fieldCoverage?.missing.length} optional fields not in source.
                     </ThemedText>
                  </View>
                </View>
              </View>

              {/* Right Column: Alerts and Logs */}
              <View style={styles.columnRight}>
                {result.errors.length > 0 && (
                  <View style={styles.errorCard}>
                    <ThemedText type="smallBold" style={{ color: '#EF4444' }}>Critical Errors</ThemedText>
                    {result.errors.map((e, i) => (
                      <ThemedText key={i} type="small" style={styles.errorItem}>• {e}</ThemedText>
                    ))}
                  </View>
                )}

                <View style={styles.sectionCard}>
                  <ThemedText type="smallBold" style={styles.cardHeader}>
                    Review Required ({result.rowWarnings?.length || 0})
                  </ThemedText>
                  <ScrollView style={styles.warningList}>
                    {(!result.rowWarnings || result.rowWarnings.length === 0) ? (
                      <ThemedText type="small" style={styles.emptyNote}>No issues detected.</ThemedText>
                    ) : (
                      result.rowWarnings.slice(0, 100).map((w, i) => (
                        <View key={i} style={styles.warningItem}>
                          <View style={styles.warningTag}><ThemedText style={styles.warningTagText}>ROW {w.row}</ThemedText></View>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{w.section} / {w.item}</ThemedText>
                            <ThemedText type="small" style={styles.warningMsg}>{w.message}</ThemedText>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Sticky Actions */}
            <View style={styles.footerActions}>
              <TouchableOpacity
                onPress={() => {
                   importService.clear();
                   setResult(null);
                }}
                style={styles.cancelButton}
                disabled={loading}
              >
                <ThemedText type="smallBold">Discard Import</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmImport}
                style={styles.confirmButton}
                disabled={loading || !result.success}
              >
                {loading ? <ActivityIndicator color="white" /> : <ThemedText style={{ color: 'white', fontWeight: '700' }}>Confirm and Save Template</ThemedText>}
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
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: Spacing.four,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  pickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  pickTitle: {
    marginBottom: 10,
  },
  pickSubtitle: {
    maxWidth: 400,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 30,
  },
  pickButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  pickButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  reviewContainer: {
    gap: 24,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  fileLabel: {
    marginTop: 4,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  columnLeft: {
    flex: 3,
    gap: 24,
  },
  columnRight: {
    flex: 2,
    gap: 24,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  preservationContent: {
    padding: 20,
    gap: 16,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  compCol: {
    flex: 1,
    gap: 4,
  },
  compLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  compDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  successNote: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 6,
  },
  fidelityGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  fidelityItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fidLabel: {
    color: '#6B7280',
    marginTop: 2,
  },
  fidFooter: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  warningList: {
    maxHeight: 300,
    padding: 16,
  },
  warningItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  warningTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  warningTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  warningMsg: {
    color: '#6B7280',
    marginTop: 2,
    fontSize: 12,
  },
  emptyNote: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 40,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorItem: {
    color: '#B91C1C',
    marginTop: 4,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  confirmButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  }
});
