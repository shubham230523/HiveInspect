import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { ItemWithComments } from '@/domain/models';
import { AnswerType } from '@/domain/enums';
import { Spacing, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ItemEditorProps {
  item: ItemWithComments;
  onChange: (updatedItem: ItemWithComments) => void;
}

export function ItemEditor({ item, onChange }: ItemEditorProps) {
  const theme = useTheme();
  const [previewIds, setPreviewIds] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState(false);

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
              type={Platform.OS === 'web' ? 'date' : 'default'}
              onChangeText={(val) => updateItem({ defaultValue: val })}
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
              onChangeText={(val) => updateItem({ defaultValue: val })}
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
        return (
          <View style={styles.typeSelector}>
            <select
              style={StyleSheet.flatten([styles.select, { color: theme.textSecondary }]) as any}
              value={String(type)}
              onChange={(e) => updateItem({ answerType: e.target.value as AnswerType })}
            >
              {Object.values(AnswerType).map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <TextInput
          style={[
            styles.titleInput,
            { color: theme.text, borderBottomColor: focused ? '#208AEF' : 'rgba(128, 128, 128, 0.1)' }
          ]}
          value={item.name}
          placeholder="Item Name"
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
              <div
                style={StyleSheet.flatten([
                  styles.previewBox,
                  {
                    color: theme.text,
                    backgroundColor: theme.canvas,
                    borderColor: theme.border,
                    display: 'block',
                    minHeight: 'auto',
                  }
                ]) as any}
                dangerouslySetInnerHTML={{ __html: `<style>p { margin: 0; padding: 0; } p + p { margin-top: 8px; }</style>${comment.text.trim()}` }}
              />
            ) : (
              <TextInput
                style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                value={comment.text}
                placeholder="Write comment template here..."
                placeholderTextColor={theme.textSecondary}
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
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
      default: {
        elevation: 2,
      }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  typeSelector: {
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  select: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    outlineWidth: 0,
    cursor: 'pointer',
    appearance: 'none',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(128, 128, 128, 0.6)',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  activePill: {
    backgroundColor: 'rgba(32, 138, 239, 0.08)',
    borderColor: '#208AEF',
  },
  optionsContainer: {
    width: '100%',
    gap: 8,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: 'inherit',
    flex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
  },
  addButton: {
    paddingVertical: 8,
  },
  commentsList: {
    gap: 20,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentItem: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.05)',
  },
  previewBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 80,
    fontSize: 14,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 20,
  }
});
