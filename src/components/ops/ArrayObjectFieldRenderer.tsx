import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { FieldDefinition, ValidationError } from '../../types/config';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';
import { ArrayObjectItemFields } from './ArrayObjectItemFields';

interface ArrayObjectFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  allErrors?: ValidationError[];
}

export const ArrayObjectFieldRenderer: React.FC<ArrayObjectFieldRendererProps> = ({
  field,
  value,
  onChange,
  allErrors,
}) => {
  const { showToast } = useToast();
  const { t, language } = useI18n();
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({
    0: true,
  });
  const items: Array<Record<string, any>> = Array.isArray(value) ? value : [];
  const { itemFields, itemTitleKey } = field;

  const itemErrorsMap: Record<number, ValidationError[]> = {};
  if (allErrors) {
    const escapedPath = field.path.replace(/\./g, '\\.');
    const itemPathPattern = new RegExp(`^${escapedPath}\\[(\\d+)\\]`);
    for (const error of allErrors) {
      const match = error.path.match(itemPathPattern);
      if (!match) continue;
      const index = Number(match[1]);
      itemErrorsMap[index] = [...(itemErrorsMap[index] || []), error];
    }
  }

  const toggleExpand = (index: number) => {
    setExpandedIndices((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const updateItem = (index: number, key: string, nextValue: any) => {
    onChange(items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: nextValue } : item
    ));
  };

  const addItem = () => {
    const newItem: Record<string, any> = {};
    for (const subfield of itemFields || []) {
      newItem[subfield.key] =
        subfield.defaultValue !== undefined
          ? JSON.parse(JSON.stringify(subfield.defaultValue))
          : subfield.type === 'boolean'
          ? false
          : subfield.type === 'number'
          ? 0
          : subfield.type === 'array_string'
          ? []
          : '';
    }
    if (itemTitleKey && !newItem[itemTitleKey]) {
      newItem[itemTitleKey] = language === 'en' ? `Node_${items.length + 1}` : `新服务节点_${items.length + 1}`;
    }
    onChange([...items, newItem]);
    setExpandedIndices((previous) => ({ ...previous, [items.length]: true }));
    showToast(language === 'en' ? 'Added new item' : '已新增一项配置', 'success');
  };

  const duplicateItem = (index: number) => {
    const target = items[index];
    if (!target) return;
    const duplicate = JSON.parse(JSON.stringify(target));
    if (itemTitleKey && duplicate[itemTitleKey]) {
      duplicate[itemTitleKey] = language === 'en'
        ? `${duplicate[itemTitleKey]}_copy`
        : `${duplicate[itemTitleKey]}_副本`;
    }
    const nextItems = [...items];
    nextItems.splice(index + 1, 0, duplicate);
    onChange(nextItems);
    setExpandedIndices((previous) => ({ ...previous, [index + 1]: true }));
    showToast(language === 'en' ? 'Item cloned' : '已克隆复制该配置项', 'success');
  };

  const deleteItem = (index: number) => {
    const title =
      items[index]?.[itemTitleKey || 'ServiceName'] ||
      items[index]?.name ||
      (language === 'en' ? `Item #${index + 1}` : `第 ${index + 1} 项`);
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
    showToast(
      language === 'en' ? `Deleted item "${title}"` : `已删除配置项「${title}」`,
      'info'
    );
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    onChange(nextItems);
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          {language === 'en' ? `${items.length} items configured` : `当前配置了 ${items.length} 个子项`}
        </span>
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.ops.addItem}
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => {
          const itemErrors = itemErrorsMap[index] || [];
          const title =
            item[itemTitleKey || 'ServiceName'] ||
            item.name ||
            item.serviceName ||
            item.NodeName ||
            `配置项 #${index + 1}`;
          const isExpanded = Boolean(expandedIndices[index]) || itemErrors.length > 0;
          const hostPort = item.Host || item.Port || item.host || item.port
            ? `${item.Host || item.host || ''}${item.Port || item.port ? `:${item.Port || item.port}` : ''}`
            : '';
          const roleOrProtocol = item.Role || item.protocol || item.ProbeMode || '';

          return (
            <div
              key={index}
              className={`bg-slate-950 border rounded-xl overflow-hidden transition-all ${
                itemErrors.length > 0 ? 'border-rose-500/70 shadow-xs' : 'border-slate-800'
              }`}
            >
              <div
                onClick={() => toggleExpand(index)}
                className="flex items-center justify-between px-4 py-3 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none border-b border-slate-800/80"
              >
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <span className="w-5 h-5 rounded-md bg-indigo-950 border border-indigo-800/50 text-[10px] font-mono text-indigo-300 flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-white truncate">{title}</span>
                  {hostPort && (
                    <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                      {hostPort}
                    </span>
                  )}
                  {roleOrProtocol && (
                    <span className="hidden sm:inline-block text-[10px] text-indigo-300/80 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/30 truncate">
                      {roleOrProtocol}
                    </span>
                  )}
                  {itemErrors.length > 0 && (
                    <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      待修正 ({itemErrors.length})
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, 'up')}
                    className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                    title="上移"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 'down')}
                    className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                    title="下移"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateItem(index)}
                    className="p-1 text-slate-400 hover:text-indigo-300"
                    title="复制克隆此项"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(index)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="删除此项"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(index)}
                    className="p-1 text-slate-400 hover:text-white ml-1"
                    title={isExpanded ? '收起配置' : '展开配置'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-slate-950/40">
                  {itemFields && itemFields.length > 0 ? (
                    <ArrayObjectItemFields
                      fieldPath={field.path}
                      itemIndex={index}
                      item={item}
                      itemFields={itemFields}
                      itemErrors={itemErrors}
                      onUpdate={(key, nextValue) => updateItem(index, key, nextValue)}
                    />
                  ) : (
                    <div className="text-xs text-slate-500">未定义子项字段模板</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-500">
            当前列表为空，点击上方「新增一项配置」开始配置
          </div>
        )}
      </div>
    </div>
  );
};