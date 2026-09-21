import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplateHierarchy, saveTemplate } from '@/repository/template-repository';
import { TemplateWithHierarchy, SectionWithItems, ItemWithComments } from '@/domain/models';
import { AnswerType } from '@/domain/enums';
import { Spacing, Colors } from '@/constants/theme';
import { generateId } from '@/utils/ids';
import { ItemEditor } from '@/components/item-editor';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTheme } from '@/hooks/use-theme';

export default function TemplateEditorScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [template, setTemplate] = useState<TemplateWithHierarchy | null>(null);
  const [initialTemplate, setInitialTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor State
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [headerFocused, setHeaderFocused] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await getTemplateHierarchy(id);
      if (error) {
        if (Platform.OS === 'web') window.alert('Failed to load template');
        else Alert.alert('Error', 'Failed to load template');
      } else if (data) {
        setTemplate(data);
        setInitialTemplate(JSON.stringify(data));
        if (data.sections.length > 0) {
          setSelectedSectionId(data.sections[0].id);
        }
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [id]);

  const hasUnsavedChanges = initialTemplate !== JSON.stringify(template);

  useEffect(() => {
    const handleBeforeRemove = (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      const msg = 'You have unsaved changes. Are you sure you want to leave?';
      if (Platform.OS === 'web') {
        if (window.confirm(msg)) navigation.dispatch(e.data.action);
      } else {
        Alert.alert('Unsaved Changes', msg, [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }
    };

    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    navigation.addListener('beforeRemove', handleBeforeRemove);
    if (Platform.OS === 'web') window.addEventListener('beforeunload', beforeUnload);

    return () => {
      navigation.removeListener('beforeRemove', handleBeforeRemove);
      if (Platform.OS === 'web') window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [hasUnsavedChanges, navigation]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !template) return;

    if (result.type === 'sections') {
      const newSections = Array.from(template.sections);
      const [reorderedSection] = newSections.splice(result.source.index, 1);
      newSections.splice(result.destination.index, 0, reorderedSection);

      const updatedSections = newSections.map((s, idx) => ({ ...s, order: idx }));
      setTemplate({ ...template, sections: updatedSections });
    } else if (result.type === 'items') {
      const sIdx = template.sections.findIndex(s => s.id === selectedSectionId);
      if (sIdx === -1) return;

      const newItems = Array.from(template.sections[sIdx].items);
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);

      const updatedItems = newItems.map((i, idx) => ({ ...i, order: idx }));
      const newSections = [...template.sections];
      newSections[sIdx] = { ...newSections[sIdx], items: updatedItems };
      setTemplate({ ...template, sections: newSections });
    }
  };

  const handleSave = async () => {
    if (!template || saving) return;
    setSaving(true);
    const { error } = await saveTemplate(template);
    setSaving(false);

    if (error) {
      const msg = error.message || 'Failed to save changes';
      if (Platform.OS === 'web') window.alert(`Error: ${msg}`);
      else Alert.alert('Error', msg);
    } else {
      setInitialTemplate(JSON.stringify(template));
      if (Platform.OS === 'web') window.alert('Changes saved successfully');
      else Alert.alert('Success', 'Changes saved successfully');
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    setSaving(true);

    const newTemplate: TemplateWithHierarchy = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: template.sections.map(s => ({
        ...s,
        id: generateId(),
        templateId: template.id,
        items: s.items.map(i => ({
          ...i,
          id: generateId(),
          sectionId: s.id,
          comments: i.comments.map(c => ({
            ...c,
            id: generateId(),
            itemId: i.id,
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

    const { error } = await saveTemplate(newTemplate);
    setSaving(false);

    if (error) {
      const msg = error.message || 'Failed to duplicate template';
      if (Platform.OS === 'web') window.alert(`Error: ${msg}`);
      else Alert.alert('Error', msg);
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

  const filteredSections = useMemo(() => {
    if (!template) return [];
    if (!sidebarSearch) return template.sections;

    const search = sidebarSearch.toLowerCase();
    return template.sections.filter(s => {
      const sectionMatch = s.name.toLowerCase().includes(search);
      const itemsMatch = s.items.some(i => i.name.toLowerCase().includes(search));
      return sectionMatch || itemsMatch;
    });
  }, [template, sidebarSearch]);

  const activeSection = template?.sections.find(s => s.id === selectedSectionId);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
        <ThemedText style={{ marginTop: 20 }}>Loading Template...</ThemedText>
      </ThemedView>
    );
  }

  if (!template) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Template not found</ThemedText>
        <TouchableOpacity onPress={() => router.replace('/dashboard')} style={{ marginTop: 20 }}>
          <ThemedText type="linkPrimary">Back to Dashboard</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        title: template.name,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 20, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hasUnsavedChanges ? '#F59E0B' : '#10B981' }} />
              <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: '500' }}>
                {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={handleDuplicate}
              disabled={saving}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: 'rgba(128, 128, 128, 0.05)' }}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>Duplicate</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !hasUnsavedChanges}
              style={[styles.saveButton, !hasUnsavedChanges && { opacity: 0.4, shadowOpacity: 0 }]}
            >
              <ThemedText style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )
      }} />

      <View style={[styles.editorShell, { backgroundColor: theme.background }]}>
        <View style={[styles.sidebar, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.sidebarSearch}>
            <TextInput
              style={styles.sidebarSearchInput}
              placeholder="Search..."
              value={sidebarSearch}
              onChangeText={setSidebarSearch}
            />
          </View>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections" type="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging ? '#f0f0f0' : 'transparent'
                          }}
                        >
                          <View style={styles.sidebarSection}>
                            <View style={[styles.activeIndicator, selectedSectionId === section.id && !selectedItemId && styles.activeIndicatorVisible]} />
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedSectionId(section.id);
                                setSelectedItemId(null);
                              }}
                              style={[
                                styles.sectionItem,
                                selectedSectionId === section.id && !selectedItemId && { backgroundColor: theme.backgroundSelected }
                              ]}
                            >
                              <ThemedText type="defaultSemiBold" style={[styles.sectionText, selectedSectionId === section.id && styles.activeText]}>☰ {section.name}</ThemedText>
                            </TouchableOpacity>
                            {!!(selectedSectionId === section.id || sidebarSearch) && (
                              <View style={styles.sidebarItems}>
                                {section.items.map(item => (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                      setSelectedSectionId(section.id);
                                      setSelectedItemId(item.id);
                                    }}
                                    style={[styles.itemItem, selectedItemId === item.id && { backgroundColor: theme.backgroundSelected }]}
                                  >
                                    <ThemedText type="small" style={[styles.itemText, selectedItemId === item.id && styles.activeText]}>• {item.name}</ThemedText>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <TouchableOpacity
            style={styles.addSectionButton}
            onPress={() => {
              const newSection: SectionWithItems = {
                id: generateId(),
                templateId: template.id,
                name: 'New Section',
                order: template.sections.length,
                items: [],
                metadata: {}
              };
              setTemplate({ ...template, sections: [...template.sections, newSection] });
              setSelectedSectionId(newSection.id);
            }}
          >
             <ThemedText type="linkPrimary">+ Add Section</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.mainContent, { backgroundColor: theme.canvas }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeSection ? (
              <View style={styles.activeArea}>
                <View style={styles.activeHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: 8, letterSpacing: 1, opacity: 0.6 }}>SECTION</ThemedText>
                    <TextInput
                      style={[
                        styles.renameInput,
                        { color: theme.text, borderBottomWidth: 2, borderBottomColor: headerFocused ? '#208AEF' : 'transparent' }
                      ]}
                      placeholder="Section Name"
                      value={activeSection.name}
                      onFocus={() => setHeaderFocused(true)}
                      onBlur={() => setHeaderFocused(false)}
                      onChangeText={(val) => {
                        const newSections = [...template.sections];
                        const idx = newSections.findIndex(s => s.id === activeSection.id);
                        newSections[idx].name = val;
                        setTemplate({ ...template, sections: newSections });
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteSectionButton}
                    onPress={() => {
                      if (window.confirm('Delete this entire section?')) {
                        const newSections = template.sections.filter(s => s.id !== activeSection.id);
                        setTemplate({ ...template, sections: newSections });
                        setSelectedSectionId(newSections[0]?.id || null);
                      }
                    }}
                  >
                    <ThemedText style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Delete Section</ThemedText>
                  </TouchableOpacity>
                </View>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="items" type="items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                      >
                        {activeSection.items.map((item, iIdx) => {
                          if (selectedItemId && selectedItemId !== item.id) return null;
                          return (
                            <Draggable key={item.id} draggableId={item.id} index={iIdx} isDragDisabled={!!selectedItemId}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    backgroundColor: snapshot.isDragging ? '#f9f9f9' : 'transparent',
                                    marginBottom: snapshot.isDragging ? 20 : 0
                                  }}
                                >
                                  <ItemEditor
                                    item={item}
                                    onChange={(updatedItem) => {
                                      const newSections = [...template.sections];
                                      const sIdx = newSections.findIndex(s => s.id === activeSection.id);
                                      newSections[sIdx].items[iIdx] = updatedItem;
                                      setTemplate({ ...template, sections: newSections });
                                    }}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {!selectedItemId && (
                   <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => {
                      const newItem: ItemWithComments = {
                        id: generateId(),
                        sectionId: activeSection.id,
                        name: 'New Item',
                        answerType: AnswerType.TEXT,
                        order: activeSection.items.length,
                        comments: [
                          {
                            id: generateId(),
                            itemId: '', // Set below
                            name: 'Description',
                            text: '',
                            order: 0,
                            metadata: {}
                          }
                        ],
                        metadata: {}
                      };
                      newItem.comments[0].itemId = newItem.id;

                      const newSections = [...template.sections];
                      const sIdx = newSections.findIndex(s => s.id === activeSection.id);
                      newSections[sIdx].items.push(newItem);
                      setTemplate({ ...template, sections: newSections });
                      setSelectedItemId(newItem.id);
                    }}
                   >
                      <ThemedText type="linkPrimary">+ Add Item</ThemedText>
                   </TouchableOpacity>
                )}

                {!!selectedItemId && (
                   <TouchableOpacity
                    onPress={() => setSelectedItemId(null)}
                    style={styles.backButton}
                   >
                      <ThemedText type="link">← Back</ThemedText>
                   </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText>Select a section to begin.</ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
  editorShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: 'rgba(128, 128, 128, 0.1)',
  },
  sidebarSearch: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.05)',
  },
  sidebarSearchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: 'inherit',
  },
  sidebarSection: {
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 3,
    backgroundColor: '#208AEF',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0,
  },
  activeIndicatorVisible: {
    opacity: 1,
  },
  sectionItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarItems: {
    paddingBottom: 10,
  },
  itemItem: {
    paddingVertical: 6,
    paddingLeft: 40,
    paddingRight: 20,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  itemText: {
    fontSize: 13,
  },
  activeItem: {
    backgroundColor: 'rgba(32, 138, 239, 0.08)',
  },
  activeText: {
    color: '#208AEF',
    fontWeight: '600',
  },
  addSectionButton: {
    padding: 20,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.05)',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 100,
  },
  activeArea: {
    gap: 12,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.08)',
  },
  renameInput: {
    fontSize: 28,
    fontWeight: '800',
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
    letterSpacing: -0.5,
  },
  deleteSectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    marginBottom: 4,
  },
  addItemButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.2)',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
  },
  saveButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  }
});
