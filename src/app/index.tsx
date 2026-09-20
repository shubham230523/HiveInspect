import React, { useCallback, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplates, deleteTemplate } from '@/repository/template-repository';
import { Template } from '@/domain/models';
import { Spacing } from '@/constants/theme';

export default function TemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await getTemplates();
    if (error) {
      setError(error.message || 'Failed to load templates');
    } else {
      setTemplates(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTemplates(templates.length === 0);
    }, [])
  );

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      const { error } = await deleteTemplate(id);
      if (error) {
        const msg = error.message || 'Failed to delete template';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${msg}`);
        } else {
          Alert.alert('Error', msg);
        }
      } else {
        fetchTemplates();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this template?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this template?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="defaultSemiBold">{error}</ThemedText>
        <TouchableOpacity onPress={fetchTemplates} style={styles.retryButton}>
          <ThemedText>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        title: 'Templates',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/import')} style={styles.headerButton}>
            <ThemedText type="link">Import Template</ThemedText>
          </TouchableOpacity>
        )
      }} />

      {templates.length === 0 ? (
        <View style={styles.center}>
          <ThemedText>No templates found. Click "Import" to get started.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/templates/${item.id}`)}
            >
              <View style={styles.cardContent}>
                <ThemedText type="subtitle">{item.name}</ThemedText>
                <ThemedText type="small">Source: {item.source}</ThemedText>
                <ThemedText type="small">Created: {new Date(item.createdAt).toLocaleDateString()}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <ThemedText style={{ color: 'red' }}>Delete</ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  list: {
    padding: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  headerButton: {
    marginRight: 10,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 4,
  },
  deleteButton: {
    padding: 10,
  },
});
