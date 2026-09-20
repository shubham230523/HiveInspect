import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { ItemWithComments } from '@/domain/models';
import { AnswerType } from '@/domain/enums';
import { Spacing } from '@/constants/theme';

interface ItemEditorProps {
  item: ItemWithComments;
  onChange: (updatedItem: ItemWithComments) => void;
}

export function ItemEditor({ item, onChange }: ItemEditorProps) {
  const [previewIds, setPreviewIds] = useState<Record<string, boolean>>({});

  const togglePreview = (id: string) => {
    setPreviewIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateItem = (updates: Partial<ItemWithComments>) => {
    onChange({ ...item, ...updates });
  };

  const renderAnswerTypeControl = () => {
    const type = item.answerType;

    switch (type) {
      case AnswerType.BOOLEAN:
        return (
          <View style={styles.controlRow}>
            <View style={[styles.pill, styles.activePill]}>
              <ThemedText type="smallBold">Boolean (Yes/No)</ThemedText>
            </View>
          </View>
        );
      case AnswerType.CHECKBOX:
        return (
          <View style={styles.optionsContainer}>
            <ThemedText type="smallBold">Options:</ThemedText>
            {(item.options || []).map((opt, idx) => (
              <View key={idx} style={styles.optionRow}>
                <TextInput
                  style={styles.inputSmall}
                  value={opt}
                  onChangeText={(val) => {
                    const newOpts = [...(item.options || [])];
                    newOpts[idx] = val;
                    updateItem({ options: newOpts });
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const newOpts = (item.options || []).filter((_, i) => i !== idx);
                    updateItem({ options: newOpts });
                  }}
                >
                  <ThemedText style={{ color: 'red' }}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => updateItem({ options: [...(item.options || []), 'New Option'] })}
            >
              <ThemedText type="linkPrimary">+ Add Option</ThemedText>
            </TouchableOpacity>
          </View>
        );
      case AnswerType.DATE:
        return (
          <View style={styles.controlRow}>
            <TextInput
              style={styles.inputSmall}
              value={item.defaultValue}
              placeholder="YYYY-MM-DD"
              // @ts-ignore
              type={Platform.OS === \u0027web\u0027 ? \u0027date\u0027 : \u0027default\u0027}
              onChangeText={(val) =\u003e updateItem({ defaultValue: val })}
            />
          </View>
        );
      case AnswerType.NUMBER:
        return (
          <View style={styles.controlRow}>
            <TextInput
              style={styles.inputSmall}
              value={item.defaultValue}
              placeholder="0.00"
              keyboardType="numeric"
              onChangeText={(val) =\u003e updateItem({ defaultValue: val })}
            />
          </View>
        );
      case AnswerType.RANGE:
        return (
          <View style={styles.rangeContainer}>
             <ThemedText type="small">Min: {item.metadata?.defaultEstimateMin || 'N/A'}</ThemedText>
             <ThemedText type="small">Max: {item.metadata?.defaultEstimateMax || 'N/A'}</ThemedText>
          </View>
        );
      default:
        return <ThemedText type="small">Type: {String(type)}</ThemedText>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.titleInput}
          value={item.name}
          onChangeText={(val) => updateItem({ name: val })}
        />
        {renderAnswerTypeControl()}
      </View>

      <View style={styles.commentsList}>
        {item.comments.map((comment, idx) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <ThemedText type="smallBold">{comment.name}</ThemedText>
              <TouchableOpacity onPress={() => togglePreview(comment.id)}>
                <ThemedText type="linkPrimary">{previewIds[comment.id] ? 'Edit Source' : 'Preview HTML'}</ThemedText>
              </TouchableOpacity>
            </View>

            {previewIds[comment.id] && Platform.OS === 'web' ? (
              <View
                style={styles.previewBox}
                // @ts-ignore
                dangerouslySetInnerHTML={{ __html: comment.text }}
              />
            ) : (
              <TextInput
                style={styles.textArea}
                value={comment.text}
                multiline
                onChangeText={(val) => {
                  const newComments = [...item.comments];
                  newComments[idx] = { ...comment, text: val };
                  updateItem({ comments: newComments });
                }}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.two,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 8,
    marginVertical: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
    flexWrap: 'wrap',
    gap: 10,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: 'inherit',
    minWidth: 200,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  activePill: {
    backgroundColor: 'rgba(32, 138, 239, 0.1)',
    borderColor: '#208AEF',
  },
  optionsContainer: {
    width: '100%',
    gap: 5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 4,
    padding: 5,
    fontSize: 14,
    color: 'inherit',
    flex: 1,
  },
  addButton: {
    paddingVertical: 5,
  },
  commentsList: {
    gap: Spacing.two,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentItem: {
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
    paddingBottom: 10,
  },
  previewBox: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    minHeight: 60,
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 4,
    padding: 10,
    color: 'inherit',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    minHeight: 60,
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 20,
  }
});
