import React, { useCallback, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplates, deleteTemplate, saveTemplate, getTemplateHierarchy } from '@/repository/template-repository';
import { Template } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { generateId } from '@/utils/ids';
import { importService } from '@/services/import-service';

export default function DashboardScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDuplicate = async (template: Template) => {
    try {
      setLoading(true);
      const { data: fullTemplate, error: fetchError } = await getTemplateHierarchy(template.id);
      if (fetchError || !fullTemplate) throw fetchError || new Error('Failed to fetch template for duplication');

      const newTemplate = {
        ...fullTemplate,
        id: generateId(),
        name: `${fullTemplate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: fullTemplate.sections.map(s => ({
          ...s,
          id: generateId(),
          templateId: '',
          items: s.items.map(i => ({
            ...i,
            id: generateId(),
            sectionId: '',
            comments: i.comments.map(c => ({
              ...c,
              id: generateId(),
              itemId: '',
            }))
          }))
        }))
      };

      newTemplate.sections.forEach(s => {
        s.templateId = newTemplate.id;
        s.items.forEach(i => {
          i.sectionId = s.id;
          i.comments.forEach(c => c.itemId = i.id);
        });
      });

      const { error: saveError } = await saveTemplate(newTemplate);
      if (saveError) throw saveError;

      if (Platform.OS === 'web') {
        window.alert('Template duplicated successfully');
      } else {
        Alert.alert('Success', 'Template duplicated successfully');
      }
      fetchTemplates();
    } catch (e: any) {
      const msg = e.message || 'Failed to duplicate template';
      if (Platform.OS === 'web') window.alert(`Error: ${msg}`);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      const { error } = await deleteTemplate(id);
      if (error) {
        const msg = error.message || 'Failed to delete template';
        if (Platform.OS === 'web') window.alert(`Error: ${msg}`);
        else Alert.alert('Error', msg);
      } else {
        fetchTemplates();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this template?')) performDelete();
    } else {
      Alert.alert('Confirm Delete', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && templates.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        title: '',
        headerRight: () => (
          <TouchableOpacity onPress={handleImport} style={styles.headerButton}>
            <ThemedText type="linkPrimary">+ Import</ThemedText>
          </TouchableOpacity>
        )
      }} />

      <View style={styles.searchContainer}>
        <ThemedText type="title" style={styles.pageTitle}>Templates</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search templates..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filteredTemplates.length === 0 ? (
        <View style={styles.center}>
          <ThemedText>No templates found.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const stats = item.metadata?.stats;
            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <ThemedText type="smallBold" style={styles.cardTitle}>{item.name}</ThemedText>
                  <ThemedText type="small" style={styles.cardSubtitle}>
                    Imported {new Date(item.createdAt).toLocaleDateString()}
                  </ThemedText>
                  {stats && (
                    <ThemedText type="small" style={styles.cardStats}>
                      {stats.sections} Sections · {stats.items} Items · {stats.comments} Fields
                    </ThemedText>
                  )}
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => router.push(`/templates/${item.id}`)} style={styles.actionButton}>
                      <ThemedText type="linkPrimary">Open</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDuplicate(item)} style={styles.actionButton}>
                      <ThemedText type="link">Duplicate</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                      <ThemedText style={{ color: '#EF4444', fontSize: 13, fontWeight: '500' }}>Delete</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          numColumns={Platform.OS === 'web' ? 2 : 1}
          key={Platform.OS === 'web' ? 'web-grid' : 'mobile-list'}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 15,
  },
  pageTitle: {
    marginBottom: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: 'inherit',
  },
  list: {
    paddingHorizontal: Spacing.four,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 15,
  },
  card: {
    flex: 1,
    padding: 16,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardSubtitle: {
    color: '#6B7280',
  },
  cardStats: {
    color: '#208AEF',
    marginTop: 2,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 2,
  },
  headerButton: {
    marginRight: 15,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 4,
  },
});
