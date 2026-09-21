import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function LandingPage() {
  const router = useRouter();

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
          <TouchableOpacity onPress={() => router.push('/import')} style={styles.primaryButtonSmall}>
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
              <TouchableOpacity onPress={() => router.push('/import')} style={styles.primaryButton}>
                <ThemedText style={{ color: 'white' }}>Import Template</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.secondaryButton}>
                <ThemedText>View My Templates</ThemedText>
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
            <ThemedText type="defaultSemiBold">✓ Structure Preserved</ThemedText>
            <ThemedText type="small">Your sections and items remain exactly as you built them.</ThemedText>
          </View>
          <View style={styles.featureCard}>
            <ThemedText type="defaultSemiBold">✓ Seamless Editing</ThemedText>
            <ThemedText type="small">Intuitive tree-based navigation and structured field editing.</ThemedText>
          </View>
          <View style={styles.featureCard}>
            <ThemedText type="defaultSemiBold">✓ Deep Copy</ThemedText>
            <ThemedText type="small">Duplicate templates to create independent variations in seconds.</ThemedText>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorks}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>How it works</ThemedText>
           <View style={styles.steps}>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>01</ThemedText>
                 <ThemedText type="defaultSemiBold">Import</ThemedText>
                 <ThemedText type="small">Upload your Spectora HTML-text export file.</ThemedText>
              </View>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>02</ThemedText>
                 <ThemedText type="defaultSemiBold">Review</ThemedText>
                 <ThemedText type="small">Check the hierarchy and any import warnings.</ThemedText>
              </View>
              <View style={styles.step}>
                 <ThemedText type="subtitle" style={styles.stepNumber}>03</ThemedText>
                 <ThemedText type="defaultSemiBold">Continue</ThemedText>
                 <ThemedText type="small">Your template is ready to use and edit.</ThemedText>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  logo: {
    fontSize: 20,
    color: '#208AEF',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    padding: Spacing.six,
    alignItems: 'center',
    gap: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroText: {
    flex: 1,
    gap: 20,
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#60646C',
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
    borderRadius: 8,
  },
  primaryButtonSmall: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockEditor: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mockSidebar: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(128, 128, 128, 0.1)',
    padding: 10,
    gap: 10,
    backgroundColor: '#F9F9FB',
  },
  mockSidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 5,
  },
  mockActive: {
    backgroundColor: '#E6F4FE',
    borderRadius: 4,
  },
  mockCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  mockCircleActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#208AEF',
  },
  mockLineShort: {
    height: 6,
    width: '60%',
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
  },
  mockLineShortActive: {
    height: 6,
    width: '60%',
    backgroundColor: '#208AEF',
    borderRadius: 3,
  },
  mockMain: {
    flex: 1,
    padding: 20,
    gap: 15,
  },
  mockHeader: {
    marginBottom: 10,
  },
  mockLineLong: {
    height: 10,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
  },
  mockLineMed: {
    height: 6,
    width: '80%',
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 5,
  },
  mockCard: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
  },
  features: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    padding: Spacing.six,
    gap: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    gap: 10,
  },
  howItWorks: {
    padding: Spacing.six,
    backgroundColor: '#F9F9FB',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 40,
  },
  steps: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 60,
    maxWidth: 1000,
  },
  step: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    flex: 1,
  },
  stepNumber: {
    fontSize: 40,
    color: 'rgba(32, 138, 239, 0.2)',
    fontWeight: '800',
  }
});
