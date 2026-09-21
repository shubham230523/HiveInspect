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
  const [selections, setSelections] = useState<Record<string, { start: number; end: number }>>({});

  const togglePreview = (id: string) => {
    setPreviewIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateItem = (updates: Partial<ItemWithComments>) => {
    onChange({ ...item, ...updates });
  };

  const insertTag = (commentIdx: number, tag: string) => {
    const comment = item.comments[commentIdx];
    const selection = selections[comment.id] || { start: comment.text.length, end: comment.text.length };

    const baseTag = tag.split(' ')[0];
    const startTag = `<${tag}>`;
    const endTag = `</${baseTag}>`;

    const textBefore = comment.text.substring(0, selection.start);
    const textSelected = comment.text.substring(selection.start, selection.end);
    const textAfter = comment.text.substring(selection.end);

    const newText = `${textBefore}${startTag}${textSelected}${endTag}${textAfter}`;

    const newComments = [...item.comments];
    newComments[commentIdx] = { ...comment, text: newText };
    updateItem({ comments: newComments });
  };

  const renderAnswerTypeControl = () => {
    const type = item.answerType;

    switch (type) {
      case AnswerType.BOOLEAN:
        return (
          <View style={styles.configGroup}>
            <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: 4 }}>INSPECTOR VIEW (YES/NO)</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={[styles.previewToggle, { backgroundColor: theme.primary }]}>
                <ThemedText style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>YES</ThemedText>
              </View>
              <View style={[styles.previewToggle, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>NO</ThemedText>
              </View>
            </View>
          </View>
        );
      case AnswerType.CHECKBOX:
        return (
          <View style={styles.configGroup}>
            <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: 8 }}>INSPECTOR CHECKLIST OPTIONS</ThemedText>
            <View style={{ gap: 8 }}>
              {(item.options || []).map((opt, idx) => (
                <View key={idx} style={styles.optionRow}>
                  <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: theme.border }} />
                  <TextInput
                    style={[styles.inputSmall, { flex: 1 }]}
                    value={opt || ''}
                    placeholder="Option Label"
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
                    style={{ padding: 4 }}
                  >
                    <ThemedText style={{ color: '#EF4444', fontWeight: '800' }}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => updateItem({ options: [...(item.options || []), 'New Option'] })}
              >
                <ThemedText type="linkPrimary" style={{ fontSize: 13 }}>+ Add Checkbox Option</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );
      case AnswerType.DATE:
        return (
          <View style={styles.configGroup}>
             <ThemedText type="smallBold">Default Value:</ThemedText>
             <TextInput
                style={styles.inputSmall}
                value={item.defaultValue || ''}
                placeholder="YYYY-MM-DD"
                onChangeText={(val) => updateItem({ defaultValue: val })}
              />
          </View>
        );
      case AnswerType.NUMBER:
        return (
          <View style={styles.configGroup}>
             <ThemedText type="smallBold">Default Value:</ThemedText>
             <TextInput
                style={styles.inputSmall}
                value={item.defaultValue || ''}
                placeholder="0.00"
                keyboardType="numeric"
                onChangeText={(val) => updateItem({ defaultValue: val })}
              />
          </View>
        );
      case AnswerType.RANGE:
        return (
          <View style={styles.configGroup}>
             <ThemedText type="smallBold">Range Limits (Min/Max):</ThemedText>
             <View style={styles.optionRow}>
               <TextInput
                  style={styles.inputSmall}
                  value={String(item.metadata?.defaultEstimateMin ?? '')}
                  placeholder="Min"
                  onChangeText={(val) => updateItem({ metadata: { ...item.metadata, defaultEstimateMin: val } })}
                />
                <TextInput
                  style={styles.inputSmall}
                  value={String(item.metadata?.defaultEstimateMax ?? '')}
                  placeholder="Max"
                  onChangeText={(val) => updateItem({ metadata: { ...item.metadata, defaultEstimateMax: val } })}
                />
             </View>
          </View>
        );
      default:
        return null;
    }
  };

  const FormattingToolbar = ({ onInsert }: { onInsert: (tag: string) => void }) => (
    <View style={styles.toolbar}>
      <View style={styles.toolbarGroup}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => onInsert('b')}>
          <ThemedText style={styles.toolbarBtnTextBold}>B</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => onInsert('i')}>
          <ThemedText style={styles.toolbarBtnTextItalic}>I</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => onInsert('u')}>
          <ThemedText style={styles.toolbarBtnTextUnderline}>U</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.toolbarDivider} />
      <View style={styles.toolbarGroup}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => onInsert('li')}>
          <ThemedText style={styles.toolbarBtnText}>• List</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => onInsert('a href=""')}>
          <ThemedText style={styles.toolbarBtnText}>Link</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <TextInput
          style={[
            styles.titleInput,
            { color: theme.text, borderBottomColor: focused ? '#208AEF' : 'rgba(128, 128, 128, 0.1)' }
          ]}
          value={item.name || ''}
          placeholder="Item Name"
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={(val) => updateItem({ name: val })}
        />
        <View style={styles.typeSelector}>
          <select
            style={StyleSheet.flatten([styles.select, { color: theme.textSecondary }]) as any}
            value={String(item.answerType || AnswerType.TEXT)}
            onChange={(e) => updateItem({ answerType: e.target.value as AnswerType })}
          >
            {Object.values(AnswerType).map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        {renderAnswerTypeControl()}
      </View>

      <View style={styles.commentsList}>
        {item.comments.map((comment, idx) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>{comment.name.toUpperCase()}</ThemedText>
                {!previewIds[comment.id] && <FormattingToolbar onInsert={(tag) => insertTag(idx, tag)} />}
              </View>
              <TouchableOpacity onPress={() => togglePreview(comment.id)}>
                <ThemedText type="linkPrimary">{previewIds[comment.id] ? 'Edit Source' : 'Preview HTML'}</ThemedText>
              </TouchableOpacity>
            </View>

            {previewIds[comment.id] && Platform.OS === 'web' ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  minHeight: 32,
                  fontSize: 14,
                  lineHeight: '1.5',
                  color: theme.text,
                  backgroundColor: theme.canvas,
                  borderColor: theme.border,
                  display: 'block',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                } as any}
                dangerouslySetInnerHTML={{
                  __html: `
                    <style>
                      .preview-content p { margin: 0; padding: 0; }
                      .preview-content p + p { margin-top: 8px; }
                      .preview-content br + br { display: none; }
                    </style>
                    <div class="preview-content">
                      ${comment.text
                        .replace(/<p>\s*<br\s*\/?>\s*<\/p>\s*$/gi, '')
                        .replace(/<br\s*\/?>\s*$/gi, '')
                        .replace(/\n\s*\n/g, '\n')
                        .trim()}
                    </div>
                  `
                }}
              />
            ) : (
              <TextInput
                style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                value={comment.text || ''}
                placeholder="Write comment template here..."
                placeholderTextColor={theme.textSecondary}
                multiline
                onSelectionChange={(e) => {
                  setSelections(prev => ({ ...prev, [comment.id]: e.nativeEvent.selection }));
                }}
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
  configGroup: {
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  previewToggle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: 6,
    padding: 2,
  },
  toolbarGroup: {
    flexDirection: 'row',
    gap: 2,
  },
  toolbarDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginHorizontal: 4,
  },
  toolbarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toolbarBtnText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  toolbarBtnTextBold: {
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.8,
  },
  toolbarBtnTextItalic: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  toolbarBtnTextUnderline: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    opacity: 0.8,
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
