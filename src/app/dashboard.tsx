import React, { useCallback, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplates, deleteTemplate, saveTemplate, getTemplateHierarchy } from '@/repository/template-repository';
import { Template } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { generateId } from '@/utils/ids';

export default function DashboardScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
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

  const handleDuplicate = async (template: Template) => {
    try {
      setLoading(true);
      // Fetch full hierarchy
      const { data: fullTemplate, error: fetchError } = await getTemplateHierarchy(template.id);
      if (fetchError || !fullTemplate) throw fetchError || new Error('Failed to fetch template for duplication');

      // Generate new IDs
      const newTemplate = {
        ...fullTemplate,
        id: generateId(),
        name: `${fullTemplate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: fullTemplate.sections.map(s => ({
          ...s,
          id: generateId(),
          templateId: '', // Fixed below
          items: s.items.map(i => ({
            ...i,
            id: generateId(),
            sectionId: '', // Fixed below
            comments: i.comments.map(c => ({
              ...c,
              id: generateId(),
              itemId: '', // Fixed below
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
        title: 'Templates Dashboard',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/import')} style={styles.headerButton}>
            <ThemedText type="linkPrimary">+ Import</ThemedText>
          </TouchableOpacity>
        )
      }} />

      <View style={styles.searchContainer}>
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
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.name}</ThemedText>
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
                      <ThemedText style={{ color: 'red', fontSize: 14 }}>Delete</ThemedText>
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchContainer: {
    padding: Spacing.four,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    color: 'inherit',
  },
  list: {
    paddingHorizontal: Spacing.four,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },
  card: {
    flex: 1,
    padding: 20,
    margin: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
  },
  cardSubtitle: {
    color: '#60646C',
  },
  cardStats: {
    color: '#208AEF',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.05)',
    paddingTop: 15,
  },
  actionButton: {
    paddingVertical: 4,
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
