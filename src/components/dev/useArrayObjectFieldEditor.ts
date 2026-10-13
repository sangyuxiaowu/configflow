import { useI18n } from '../../i18n';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { EnumOption, FieldDefinition, FieldType } from '../../types/config';

export function useArrayObjectFieldEditor(
  formData: FieldDefinition,
  setFormData: Dispatch<SetStateAction<FieldDefinition>>
) {
  const { t, format: formatMessage } = useI18n();
  const [newSubKey, setNewSubKey] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubType, setNewSubType] = useState<FieldType>('string');
  const [expandedSubIndex, setExpandedSubIndex] = useState<number | null>(0);
  const [subNewOptVal, setSubNewOptVal] = useState('');
  const [subNewOptLabel, setSubNewOptLabel] = useState('');
  const [subNewOptDesc, setSubNewOptDesc] = useState('');
  const [subBatchText, setSubBatchText] = useState('');
  const [showSubBatch, setShowSubBatch] = useState(false);

  const handleAddSubField = () => {
    if (!newSubKey.trim()) return;
    const newSub: FieldDefinition = {
      id: `${formData.path}_sub_${newSubKey.trim()}`,
      key: newSubKey.trim(),
      path: newSubKey.trim(),
      label: newSubLabel.trim() || newSubKey.trim(),
      description: formatMessage(t.details.subField, { value0: newSubKey.trim() }),
      category: formData.category,
      type: newSubType,
      required: false,
      defaultValue: newSubType === 'number' ? 0 : newSubType === 'boolean' ? false : '',
      constraints: {
        options: newSubType === 'enum' ? [] : undefined,
      },
    };
    const nextList = [...(formData.itemFields || []), newSub];
    setFormData((prev) => ({ ...prev, itemFields: nextList }));
    setNewSubKey('');
    setNewSubLabel('');
    setExpandedSubIndex(nextList.length - 1);
  };

  const handleRemoveSubField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itemFields: (prev.itemFields || []).filter((_, i) => i !== index),
    }));
    if (expandedSubIndex === index) setExpandedSubIndex(null);
  };

  const handleUpdateSubField = (index: number, patch: Partial<FieldDefinition>) => {
    setFormData((prev) => ({
      ...prev,
      itemFields: (prev.itemFields || []).map((sub, i) =>
        i === index ? { ...sub, ...patch } : sub
      ),
    }));
  };

  const handleAddSubEnumOption = (subIndex: number) => {
    if (!subNewOptVal.trim()) return;
    const targetSub = formData.itemFields?.[subIndex];
    if (!targetSub) return;

    const option: EnumOption = {
      value: subNewOptVal.trim(),
      label: subNewOptLabel.trim() || subNewOptVal.trim(),
      description: subNewOptDesc.trim() || undefined,
    };
    handleUpdateSubField(subIndex, {
      constraints: {
        ...targetSub.constraints,
        options: [...(targetSub.constraints?.options || []), option],
      },
    });
    setSubNewOptVal('');
    setSubNewOptLabel('');
    setSubNewOptDesc('');
  };

  const handleBatchAddSubEnum = (subIndex: number) => {
    if (!subBatchText.trim()) return;
    const targetSub = formData.itemFields?.[subIndex];
    if (!targetSub) return;

    const items = subBatchText
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const options: EnumOption[] = items.map((value) => ({
      value,
      label: value,
      description: formatMessage(t.details.optionValue, { value0: value }),
    }));
    handleUpdateSubField(subIndex, {
      constraints: {
        ...targetSub.constraints,
        options: [...(targetSub.constraints?.options || []), ...options],
      },
    });
    setSubBatchText('');
    setShowSubBatch(false);
  };

  const handleRemoveSubEnumOption = (subIndex: number, optionIndex: number) => {
    const targetSub = formData.itemFields?.[subIndex];
    if (!targetSub) return;
    handleUpdateSubField(subIndex, {
      constraints: {
        ...targetSub.constraints,
        options: (targetSub.constraints?.options || []).filter(
          (_, index) => index !== optionIndex
        ),
      },
    });
  };

  return {
    newSubKey,
    setNewSubKey,
    newSubLabel,
    setNewSubLabel,
    newSubType,
    setNewSubType,
    expandedSubIndex,
    setExpandedSubIndex,
    subNewOptVal,
    setSubNewOptVal,
    subNewOptLabel,
    setSubNewOptLabel,
    subNewOptDesc,
    setSubNewOptDesc,
    subBatchText,
    setSubBatchText,
    showSubBatch,
    setShowSubBatch,
    handleAddSubField,
    handleRemoveSubField,
    handleUpdateSubField,
    handleAddSubEnumOption,
    handleBatchAddSubEnum,
    handleRemoveSubEnumOption,
  };
}