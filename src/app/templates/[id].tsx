import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplateHierarchy, saveTemplate } from '@/repository/template-repository';
import { TemplateWithHierarchy } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { generateId } from '@/utils/ids';
import { ItemEditor } from '@/components/item-editor';

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateWithHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await getTemplateHierarchy(id);
      if (error) {
        Alert.alert('Error', 'Failed to load template');
      } else {
        setTemplate(data);
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [id]);

  const handleSave = async () => {
    if (!template || saving) return;
    setSaving(true);
    const { error } = await saveTemplate(template);
    setSaving(false);

    if (error) {
      const msg = error.message || 'Failed to save changes';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Changes saved successfully');
      } else {
        Alert.alert('Success', 'Changes saved successfully');
      }
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    setSaving(true);

    // Independent duplication: generate all new IDs
    const newTemplate: TemplateWithHierarchy = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: template.sections.map(s => ({
        ...s,
        id: generateId(),
        templateId: '', // Will be set by save
        items: s.items.map(i => ({
          ...i,
          id: generateId(),
          sectionId: '', // Will be set by save
          comments: i.comments.map(c => ({
            ...c,
            id: generateId(),
            itemId: '', // Will be set by save
          }))
        }))
      }))
    };
    // Fix IDs
    newTemplate.sections.forEach(s => {
      s.templateId = newTemplate.id;
      s.items.forEach(i => {
        i.sectionId = s.id;
        i.comments.forEach(c => c.itemId = i.id);
      });
    });

    const { error } = await saveTemplate(newTemplate);
    setSaving(false);

    if (error) {
      const msg = error.message || 'Failed to duplicate template';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Template duplicated successfully');
        router.push(`/templates/${newTemplate.id}`);
      } else {
        Alert.alert('Success', 'Template duplicated successfully', [
          { text: 'OK', onPress: () => router.push(`/templates/${newTemplate.id}`) }
        ]);
      }
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!template) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Template not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        title: template.name,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleDuplicate} disabled={saving}>
              <ThemedText type="link">Duplicate</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <ThemedText type="link">Save</ThemedText>
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.field}>
          <ThemedText type="small">Template Name</ThemedText>
          <TextInput
            style={styles.input}
            value={template.name}
            onChangeText={(val) => setTemplate({...template, name: val})}
          />
        </View>

        {template.sections.map((section, sIdx) => (
          <View key={section.id} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Section: {section.name}</ThemedText>
              <TextInput
                style={styles.inputSmall}
                value={section.name}
                onChangeText={(val) => {
                  const newSections = [...template.sections];
                  newSections[sIdx].name = val;
                  setTemplate({...template, sections: newSections});
                }}
              />
            </View>

            {section.items.map((item, iIdx) => (
              <ItemEditor
                key={item.id}
                item={item}
                onChange={(updatedItem) => {
                  const newSections = [...template.sections];
                  newSections[sIdx].items[iIdx] = updatedItem;
                  setTemplate({ ...template, sections: newSections });
                }}
              />
            ))}
          </View>
        ))}
      </ScrollView>
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
  },
  scrollContent: {
    padding: Spacing.four,
    gap: 20,
  },
  field: {
    gap: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 4,
    padding: 10,
    color: 'inherit',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 4,
    padding: 5,
    fontSize: 14,
    color: 'inherit',
    width: 200,
  },
  sectionContainer: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    gap: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContainer: {
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#208AEF',
    gap: 10,
  },
  commentContainer: {
    gap: 5,
  },
});
