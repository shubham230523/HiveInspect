import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { importService } from '@/services/import-service';

export default function LandingPage() {
  const router = useRouter();

  const handleImport = async () => {
    try {
      const result = await importService.pickAndParseFile();
      if (result) {
        router.push('/import');
      }
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert('Failed to parse template file.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.logo}>Hive Inspect</ThemedText>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.push('/dashboard')}>
            <ThemedText type="link">Templates</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImport} style={styles.primaryButtonSmall}>
            <ThemedText style={{ color: 'white' }}>Import Template</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <ThemedText type="title" style={styles.heroTitle}>
              Bring your inspection templates with you.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Import your existing Spectora template, preserve the structure you've spent years building, and keep editing it in one place.
            </ThemedText>
            <View style={styles.ctaGroup}>
              <TouchableOpacity onPress={handleImport} style={styles.primaryButton}>
                <ThemedText style={{ color: 'white', fontWeight: '700' }}>Import Template</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.secondaryButton}>
                <ThemedText type="smallBold">View My Templates</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Preview Mock */}
          <View style={styles.previewContainer}>
            <View style={styles.mockEditor}>
              <View style={styles.mockSidebar}>
                <View style={styles.mockSidebarItem}><View style={styles.mockCircle}/><View style={styles.mockLineShort}/></View>
                <View style={[styles.mockSidebarItem, styles.mockActive]}><View style={styles.mockCircleActive}/><View style={styles.mockLineShortActive}/></View>
                <View style={styles.mockSidebarItem}><View style={styles.mockCircle}/><View style={styles.mockLineShort}/></View>
                <View style={styles.mockSidebarItem}><View style={styles.mockCircle}/><View style={styles.mockLineShort}/></View>
              </View>
              <View style={styles.mockMain}>
                <View style={styles.mockHeader}><View style={styles.mockLineLong}/></View>
                <View style={styles.mockCard}><View style={styles.mockLineMed}/><View style={styles.mockLineMed}/></View>
                <View style={styles.mockCard}><View style={styles.mockLineMed}/><View style={styles.mockLineMed}/></View>
              </View>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <ThemedText type="smallBold">✓ Structure Preserved</ThemedText>
            <ThemedText type="small" style={{ color: '#6B7280' }}>Your sections and items remain exactly as you built them.</ThemedText>
          </View>
          <View style={styles.featureCard}>
            <ThemedText type="smallBold">✓ Seamless Editing</ThemedText>
            <ThemedText type="small" style={{ color: '#6B7280' }}>Intuitive tree-based navigation and structured field editing.</ThemedText>
          </View>
          <View style={styles.featureCard}>
            <ThemedText type="smallBold">✓ Deep Copy</ThemedText>
            <ThemedText type="small" style={{ color: '#6B7280' }}>Duplicate templates to create independent variations in seconds.</ThemedText>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorks}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>How it works</ThemedText>
           <View style={styles.steps}>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>01</ThemedText>
                 <ThemedText type="smallBold">Import</ThemedText>
                 <ThemedText type="small" style={{ color: '#6B7280' }}>Upload your Spectora HTML-text export file.</ThemedText>
              </View>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>02</ThemedText>
                 <ThemedText type="smallBold">Review</ThemedText>
                 <ThemedText type="small" style={{ color: '#6B7280' }}>Check the hierarchy and any import warnings.</ThemedText>
              </View>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>03</ThemedText>
                 <ThemedText type="smallBold">Continue</ThemedText>
                 <ThemedText type="small" style={{ color: '#6B7280' }}>Your template is ready to use and edit.</ThemedText>
              </View>
           </View>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.05)',
  },
  logo: {
    fontSize: 18,
    color: '#208AEF',
    letterSpacing: -0.5,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: 40,
    paddingVertical: 80,
    alignItems: 'center',
    gap: 60,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroText: {
    flex: 1,
    gap: 24,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 28,
  },
  ctaGroup: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  primaryButtonSmall: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockEditor: {
    width: '100%',
    aspectRatio: 1.4,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  mockSidebar: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    padding: 15,
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  mockSidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mockActive: {
    backgroundColor: '#E6F4FE',
    borderRadius: 6,
    padding: 5,
    marginHorizontal: -5,
  },
  mockCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  mockCircleActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#208AEF',
  },
  mockLineShort: {
    height: 5,
    width: '50%',
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  mockLineShortActive: {
    height: 5,
    width: '50%',
    backgroundColor: '#208AEF',
    borderRadius: 2,
  },
  mockMain: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  mockHeader: {
    marginBottom: 10,
  },
  mockLineLong: {
    height: 8,
    width: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  mockLineMed: {
    height: 5,
    width: '70%',
    backgroundColor: '#F9FAFB',
    borderRadius: 2,
    marginBottom: 4,
  },
  mockCard: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  features: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    flex: 1,
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  howItWorks: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 60,
  },
  steps: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 80,
    maxWidth: 1000,
  },
  step: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 15,
    flex: 1,
  },
  stepNumber: {
    fontSize: 32,
    color: '#E5E7EB',
    fontWeight: '800',
  }
});
