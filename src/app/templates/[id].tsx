import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplateHierarchy, saveTemplate } from '@/repository/template-repository';
import { TemplateWithHierarchy, SectionWithItems, ItemWithComments } from '@/domain/models';
import { Spacing } from '@/constants/theme';
import { generateId } from '@/utils/ids';
import { ItemEditor } from '@/components/item-editor';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function TemplateEditorScreen() {
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
          <View style={{ flexDirection: 'row', gap: 20, marginRight: 20, alignItems: 'center' }}>
            <ThemedText type="small" style={{ color: hasUnsavedChanges ? 'orange' : 'green' }}>{hasUnsavedChanges ? '● Unsaved Changes' : '✓ Saved'}</ThemedText>
            <TouchableOpacity onPress={handleDuplicate} disabled={saving}><ThemedText type="link">Duplicate</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving || !hasUnsavedChanges} style={[styles.saveButton, !hasUnsavedChanges && { opacity: 0.5 }]}><ThemedText style={{ color: 'white' }}>{saving ? 'Saving...' : 'Save'}</ThemedText></TouchableOpacity>
          </View>
        )
      }} />

      <View style={styles.editorShell}>
        <View style={styles.sidebar}>
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
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedSectionId(section.id);
                                setSelectedItemId(null);
                              }}
                              style={[styles.sectionItem, selectedSectionId === section.id && !selectedItemId && styles.activeItem]}
                            >
                              <ThemedText type="defaultSemiBold" style={[styles.sectionText, selectedSectionId === section.id && styles.activeText]}>☰ {section.name}</ThemedText>
                            </TouchableOpacity>
                            {(selectedSectionId === section.id || sidebarSearch) && (
                              <View style={styles.sidebarItems}>
                                {section.items.map(item => (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                      setSelectedSectionId(section.id);
                                      setSelectedItemId(item.id);
                                    }}
                                    style={[styles.itemItem, selectedItemId === item.id && styles.activeItem]}
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

        <View style={styles.mainContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeSection ? (
              <View style={styles.activeArea}>
                <View style={styles.activeHeader}>
                  <ThemedText type="subtitle">{activeSection.name}</ThemedText>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TextInput
                      style={styles.renameInput}
                      placeholder="Rename Section"
                      value={activeSection.name}
                      onChangeText={(val) => {
                        const newSections = [...template.sections];
                        const idx = newSections.findIndex(s => s.id === activeSection.id);
                        newSections[idx].name = val;
                        setTemplate({ ...template, sections: newSections });
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (window.confirm('Delete this entire section?')) {
                          const newSections = template.sections.filter(s => s.id !== activeSection.id);
                          setTemplate({ ...template, sections: newSections });
                          setSelectedSectionId(newSections[0]?.id || null);
                        }
                      }}
                    >
                       <ThemedText style={{ color: 'red' }}>Delete Section</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="items" type="items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
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
                        order: activeSection.items.length,
                        comments: [],
                        metadata: {}
                      };
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

                {selectedItemId && (
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
    width: 300,
    borderRightWidth: 1,
    borderRightColor: 'rgba(128, 128, 128, 0.1)',
    backgroundColor: '#F9F9FB',
  },
  sidebarSearch: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  sidebarSearchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: 'inherit',
  },
  sidebarList: {
    flex: 1,
  },
  sidebarSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.05)',
  },
  sectionItem: {
    padding: 15,
  },
  sectionText: {
    fontSize: 15,
  },
  sidebarItems: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingBottom: 10,
  },
  itemItem: {
    paddingVertical: 8,
    paddingLeft: 30,
    paddingRight: 15,
  },
  itemText: {
    fontSize: 13,
    color: '#60646C',
  },
  activeItem: {
    backgroundColor: '#E6F4FE',
  },
  activeText: {
    color: '#208AEF',
  },
  addSectionButton: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 40,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  activeArea: {
    gap: 30,
  },
  activeHeader: {
    gap: 10,
    marginBottom: 10,
  },
  renameInput: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    padding: 8,
    borderRadius: 4,
    width: '50%',
    color: 'inherit',
  },
  addItemButton: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
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
    paddingVertical: 8,
    borderRadius: 6,
  }
});
