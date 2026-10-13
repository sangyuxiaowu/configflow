import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Server,
  Layers,
  Sparkles,
  ToggleLeft,
} from 'lucide-react';
import { FieldDefinition, ValidationError } from '../../types/config';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';

interface OpsFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (val: any) => void;
  error?: ValidationError;
  allErrors?: ValidationError[];
  referenceValue?: any;
  referenceName?: string;
}

export const OpsFieldRenderer: React.FC<OpsFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  allErrors,
  referenceValue,
  referenceName,
}) => {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();
  const [showSecret, setShowSecret] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({
    0: true, // 默认展开第1项
  });

  const effectiveError = error || (allErrors && allErrors.length > 0 ? allErrors[0] : undefined);

  const {
    label,
    description,
    type,
    required,
    constraints,
    defaultValue,
    isDangerous,
    requiresRestart,
    isSensitive,
    itemFields,
    itemTitleKey,
  } = field;

  const isModifiedFromDefault =
    JSON.stringify(value) !== JSON.stringify(defaultValue);
  const isDifferentFromRef =
    referenceValue !== undefined &&
    JSON.stringify(value) !== JSON.stringify(referenceValue);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Render the input control based on field type
  const renderControl = () => {
    switch (type) {
      // 1. 对象数组专属可视化编辑器 (例如 Nodes, Services)
      case 'array_object': {
        const items: Array<Record<string, any>> = Array.isArray(value) ? value : [];

        // Build a mapping of item index -> ValidationError[]
        const itemErrorsMap: Record<number, ValidationError[]> = {};
        if (allErrors) {
          for (const err of allErrors) {
            const escapedPath = field.path.replace(/\./g, '\\.');
            const match = err.path.match(new RegExp(`^${escapedPath}\\[(\\d+)\\]`));
            if (match) {
              const itemIdx = Number(match[1]);
              if (!itemErrorsMap[itemIdx]) itemErrorsMap[itemIdx] = [];
              itemErrorsMap[itemIdx].push(err);
            }
          }
        }

        const handleUpdateItem = (index: number, subKey: string, subVal: any) => {
          const nextItems = items.map((item, i) =>
            i === index ? { ...item, [subKey]: subVal } : item
          );
          onChange(nextItems);
        };

        const handleAddItem = () => {
          const newItem: Record<string, any> = {};
          if (itemFields) {
            for (const sub of itemFields) {
              newItem[sub.key] =
                sub.defaultValue !== undefined
                  ? JSON.parse(JSON.stringify(sub.defaultValue))
                  : sub.type === 'boolean'
                  ? false
                  : sub.type === 'number'
                  ? 0
                  : sub.type === 'array_string'
                  ? []
                  : '';
            }
          }
          if (itemTitleKey && !newItem[itemTitleKey]) {
            newItem[itemTitleKey] = language === 'en' ? `Node_${items.length + 1}` : `新服务节点_${items.length + 1}`;
          }
          onChange([...items, newItem]);
          setExpandedIndices((prev) => ({ ...prev, [items.length]: true }));
          showToast(language === 'en' ? 'Added new item' : '已新增一项配置', 'success');
        };

        const handleDuplicateItem = (index: number) => {
          const target = items[index];
          if (!target) return;
          const cloned = JSON.parse(JSON.stringify(target));
          if (itemTitleKey && cloned[itemTitleKey]) {
            cloned[itemTitleKey] = language === 'en' ? `${cloned[itemTitleKey]}_copy` : `${cloned[itemTitleKey]}_副本`;
          }
          const next = [...items];
          next.splice(index + 1, 0, cloned);
          onChange(next);
          setExpandedIndices((prev) => ({ ...prev, [index + 1]: true }));
          showToast(language === 'en' ? 'Item cloned' : '已克隆复制该配置项', 'success');
        };

        const handleDeleteItem = (index: number) => {
          const title =
            items[index]?.[itemTitleKey || 'ServiceName'] ||
            items[index]?.name ||
            (language === 'en' ? `Item #${index + 1}` : `第 ${index + 1} 项`);
          onChange(items.filter((_, i) => i !== index));
          showToast(
            language === 'en' ? `Deleted item "${title}"` : `已删除配置项「${title}」`,
            'info'
          );
        };

        const handleMoveItem = (index: number, direction: 'up' | 'down') => {
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= items.length) return;
          const next = [...items];
          const temp = next[index];
          next[index] = next[targetIndex];
          next[targetIndex] = temp;
          onChange(next);
        };

        return (
          <div className="space-y-3 pt-1">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {language === 'en' ? `${items.length} items configured` : `当前配置了 ${items.length} 个子项`}
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.ops.addItem}
              </button>
            </div>

            {/* List of item cards */}
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const itemErrors = itemErrorsMap[idx] || [];
                const titleVal =
                  item[itemTitleKey || 'ServiceName'] ||
                  item.name ||
                  item.serviceName ||
                  item.NodeName ||
                  `配置项 #${idx + 1}`;
                const isExpanded = Boolean(expandedIndices[idx]) || itemErrors.length > 0;
                const hostPort =
                  item.Host || item.Port || item.host || item.port
                    ? `${item.Host || item.host || ''}${item.Port || item.port ? `:${item.Port || item.port}` : ''}`
                    : '';
                const roleOrProtocol = item.Role || item.protocol || item.ProbeMode || '';

                return (
                  <div
                    key={idx}
                    className={`bg-slate-950 border rounded-xl overflow-hidden transition-all ${
                      itemErrors.length > 0 ? 'border-rose-500/70 shadow-xs' : 'border-slate-800'
                    }`}
                  >
                    {/* Item Card Header */}
                    <div
                      onClick={() => toggleExpand(idx)}
                      className="flex items-center justify-between px-4 py-3 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none border-b border-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1">
                        <span className="w-5 h-5 rounded-md bg-indigo-950 border border-indigo-800/50 text-[10px] font-mono text-indigo-300 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {titleVal}
                        </span>
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

                      {/* Header Actions */}
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                          title="上移"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                          title="下移"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          className="p-1 text-slate-400 hover:text-indigo-300"
                          title="复制克隆此项"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="删除此项"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="p-1 text-slate-400 hover:text-white ml-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Item Card Body */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-slate-950/40">
                        {itemFields && itemFields.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {itemFields.map((sub) => {
                              const subVal = item[sub.key];
                              const subErr = itemErrors.find(
                                (e) => e.path === `${field.path}[${idx}].${sub.key}`
                              );

                              return (
                                <div
                                  key={sub.key}
                                  className={`space-y-1 ${
                                    sub.type === 'array_string' ? 'md:col-span-2' : ''
                                  }`}
                                >
                                  <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      {sub.label}
                                      {sub.required && (
                                        <span className="text-rose-400 font-normal">
                                          *
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">
                                      {sub.key}
                                    </span>
                                  </label>

                                  {/* Sub control based on sub.type */}
                                  {sub.type === 'boolean' ? (
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={Boolean(subVal)}
                                        onClick={() =>
                                          handleUpdateItem(idx, sub.key, !Boolean(subVal))
                                        }
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                          subVal ? 'bg-indigo-600' : 'bg-slate-800'
                                        }`}
                                      >
                                        <span
                                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            subVal ? 'translate-x-4' : 'translate-x-0'
                                          }`}
                                        />
                                      </button>
                                      <span className="text-xs text-slate-400">
                                        {subVal ? '已启用' : '已停用'}
                                      </span>
                                    </div>
                                  ) : sub.type === 'port' ? (
                                    <div>
                                      <input
                                        type="number"
                                        min={1}
                                        max={65535}
                                        value={subVal ?? ''}
                                        onChange={(e) =>
                                          handleUpdateItem(
                                            idx,
                                            sub.key,
                                            e.target.value === ''
                                              ? ''
                                              : Number(e.target.value)
                                          )
                                        }
                                        className={`w-full px-3 py-1.5 text-xs bg-slate-900 border rounded-lg text-white font-mono focus:outline-hidden ${
                                          subErr
                                            ? 'border-rose-500 ring-1 ring-rose-500/30'
                                            : 'border-slate-700 focus:border-indigo-500'
                                        }`}
                                        placeholder="8080"
                                      />
                                      {subErr && (
                                        <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                          {subErr.message}
                                        </p>
                                      )}
                                    </div>
                                  ) : sub.type === 'number' ? (
                                    <div className="space-y-1">
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={subVal ?? ''}
                                          onChange={(e) =>
                                            handleUpdateItem(
                                              idx,
                                              sub.key,
                                              e.target.value === ''
                                                ? ''
                                                : Number(e.target.value)
                                            )
                                          }
                                          className={`w-full px-3 py-1.5 text-xs bg-slate-900 border rounded-lg text-white font-mono focus:outline-hidden ${
                                            subErr
                                              ? 'border-rose-500 ring-1 ring-rose-500/30'
                                              : 'border-slate-700 focus:border-indigo-500'
                                          }`}
                                        />
                                        {sub.constraints?.unit && (
                                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                                            {sub.constraints.unit}
                                          </span>
                                        )}
                                      </div>
                                      {subErr && (
                                        <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                          {subErr.message}
                                        </p>
                                      )}
                                    </div>
                                  ) : sub.type === 'enum' && sub.constraints?.options ? (
                                    <div>
                                      <select
                                        value={subVal ?? ''}
                                        onChange={(e) =>
                                          handleUpdateItem(idx, sub.key, e.target.value)
                                        }
                                        className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-white focus:outline-hidden ${
                                          subErr
                                            ? 'border-rose-500 ring-1 ring-rose-500/30'
                                            : 'border-slate-700 focus:border-indigo-500'
                                        }`}
                                      >
                                        {sub.constraints.options.map((opt) => (
                                          <option key={String(opt.value)} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                      {subErr && (
                                        <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                          {subErr.message}
                                        </p>
                                      )}
                                    </div>
                                  ) : sub.type === 'array_string' ? (
                                    <div className="space-y-1.5">
                                      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg bg-slate-900 border border-slate-800 min-h-[36px]">
                                        {(Array.isArray(subVal) ? subVal : []).map(
                                          (tag: string, tagIdx: number) => (
                                            <span
                                              key={tagIdx}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-200"
                                            >
                                              {tag}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newArr = (subVal || []).filter(
                                                    (_: any, i: number) => i !== tagIdx
                                                  );
                                                  handleUpdateItem(idx, sub.key, newArr);
                                                }}
                                                className="text-slate-500 hover:text-rose-400 p-0.5"
                                              >
                                                <X className="w-2.5 h-2.5" />
                                              </button>
                                            </span>
                                          )
                                        )}
                                        <input
                                          type="text"
                                          placeholder="输入标签后按回车添加..."
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const target = e.currentTarget;
                                              if (target.value.trim()) {
                                                const currentArr = Array.isArray(subVal)
                                                  ? subVal
                                                  : [];
                                                handleUpdateItem(idx, sub.key, [
                                                  ...currentArr,
                                                  target.value.trim(),
                                                ]);
                                                target.value = '';
                                              }
                                            }
                                          }}
                                          className="text-xs bg-transparent text-white placeholder-slate-500 focus:outline-hidden min-w-[120px] font-mono px-1"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="text"
                                        value={subVal ?? ''}
                                        onChange={(e) =>
                                          handleUpdateItem(idx, sub.key, e.target.value)
                                        }
                                        className={`w-full px-3 py-1.5 text-xs bg-slate-900 border rounded-lg text-white font-mono focus:outline-hidden ${
                                          subErr
                                            ? 'border-rose-500 ring-1 ring-rose-500/30'
                                            : 'border-slate-700 focus:border-indigo-500'
                                        }`}
                                      />
                                      {subErr && (
                                        <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                                          <AlertCircle className="w-3 h-3 shrink-0" />
                                          {subErr.message}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {sub.description && (
                                    <p className="text-[10px] text-slate-500 leading-tight">
                                      {sub.description}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
      }

      // 2. 网络端口
      case 'port': {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  min={constraints.min ?? 1}
                  max={constraints.max ?? 65535}
                  value={value ?? ''}
                  onChange={(e) =>
                    onChange(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={`w-full px-3.5 py-2 text-sm bg-slate-950 border rounded-xl text-white font-mono focus:outline-hidden ${
                    error
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  }`}
                  placeholder="8080"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  TCP/UDP
                </span>
              </div>

              {/* Quick port suggestions */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                <span className="text-slate-500">常见端口:</span>
                {[8080, 8000, 3000, 9001, 3306, 6379].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              有效端口区间: 1024 ~ 65535 (1024 以下为操作系统特权端口)
            </p>
          </div>
        );
      }

      // 3. 数字与范围滑块
      case 'number': {
        const numVal = typeof value === 'number' ? value : Number(value || 0);
        const hasRange =
          constraints.min !== undefined && constraints.max !== undefined;
        const min = constraints.min ?? 0;
        const max = constraints.max ?? 10000;
        const step = constraints.step ?? 1;

        return (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              {hasRange && (
                <div className="flex-1 max-w-md hidden sm:block">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={numVal}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>{min} {constraints.unit || ''}</span>
                    <span>{max} {constraints.unit || ''}</span>
                  </div>
                </div>
              )}

              <div className="relative w-44">
                <input
                  type="number"
                  min={constraints.min}
                  max={constraints.max}
                  step={constraints.step ?? 1}
                  value={value ?? ''}
                  onChange={(e) =>
                    onChange(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={`w-full px-3.5 py-2 text-sm bg-slate-950 border rounded-xl text-white font-mono focus:outline-hidden ${
                    error
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  }`}
                />
                {constraints.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    {constraints.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 4. 布尔开关 (直接安全切换，不调用已在 iframe 中被阻断的 window.confirm)
      case 'boolean': {
        const isChecked = Boolean(value);
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isChecked}
              onClick={() => {
                if (isDangerous && !isChecked) {
                  showToast(`提示：「${label}」为高危敏感策略，请注意线上影响`, 'info');
                }
                onChange(!isChecked);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isChecked
                  ? isDangerous
                    ? 'bg-rose-600'
                    : 'bg-indigo-600'
                  : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isChecked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold ${
                isChecked
                  ? isDangerous
                    ? 'text-rose-400'
                    : 'text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              {isChecked ? '已启用 (Enabled)' : '已关闭 (Disabled)'}
            </span>
          </div>
        );
      }

      // 5. 枚举单选
      case 'enum': {
        const options = constraints.options || [];
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt) => {
                const isSelected = String(value) === String(opt.value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => onChange(opt.value)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {options.length === 0 && (
              <input
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            )}
          </div>
        );
      }

      // 6. 安全秘钥/密码
      case 'secret': {
        return (
          <div className="relative max-w-md">
            <input
              type={showSecret ? 'text' : 'password'}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full pl-3.5 pr-10 py-2 text-sm bg-slate-950 border rounded-xl text-white font-mono focus:outline-hidden ${
                error
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-indigo-500'
              }`}
              placeholder="请输入密码或密钥凭据..."
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              title={showSecret ? '隐藏凭证' : '显示明文凭证'}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );
      }

      // 7. 字符串数组标签增删
      case 'array_string': {
        const arrVal: string[] = Array.isArray(value) ? value : [];

        const handleAddTag = () => {
          if (!newTagInput.trim()) return;
          if (arrVal.includes(newTagInput.trim())) return;
          onChange([...arrVal, newTagInput.trim()]);
          setNewTagInput('');
        };

        const handleRemoveTag = (index: number) => {
          onChange(arrVal.filter((_, i) => i !== index));
        };

        return (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 min-h-[44px]">
              {arrVal.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入条目后按回车添加..."
                  className="w-full px-2 py-1 text-xs bg-transparent text-white placeholder-slate-500 focus:outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-medium shrink-0"
                >
                  添加
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              已配置 {arrVal.length} 项 · 支持按回车快速添加多项
            </p>
          </div>
        );
      }

      default: {
        return (
          <div className="max-w-xl">
            <input
              type="text"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-slate-950 border rounded-xl text-white font-mono focus:outline-hidden ${
                error
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-indigo-500'
              }`}
              placeholder={field.placeholder || `例如: ${JSON.stringify(defaultValue)}`}
            />
          </div>
        );
      }
    }
  };

  return (
    <div
      id={`field-card-${field.path.replace(/\./g, '_')}`}
      className={`bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-xs ${
        effectiveError
          ? 'border-rose-500/80 bg-rose-950/10 ring-1 ring-rose-500/30'
          : 'border-slate-800 hover:border-slate-700/80'
      }`}
    >
      {/* Header: Label, Badges, Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {label}
            </h3>

            {required && (
              <span className="text-[11px] text-rose-400 font-medium">
                *({t.common.required})
              </span>
            )}

            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              {field.path}
            </span>

            {isDangerous && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                {t.ops.filterDangerous}
              </span>
            )}

            {requiresRestart && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                <Clock className="w-3 h-3 text-amber-400" />
                {t.ops.restartRequired}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        {/* Quick action buttons: reset to default, adopt reference */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          {referenceValue !== undefined && isDifferentFromRef && (
            <button
              type="button"
              onClick={() => {
                onChange(referenceValue);
                showToast(
                  language === 'en' ? 'Adopted baseline reference value' : '已采纳参考值',
                  'success'
                );
              }}
              className="text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              title={`${t.ops.resetToBaseline} (${referenceName || 'Baseline'})`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              {t.ops.resetToBaseline}
            </button>
          )}

          {isModifiedFromDefault && (
            <button
              type="button"
              onClick={() => {
                onChange(defaultValue);
                showToast(
                  language === 'en' ? 'Reset to default value' : '已恢复默认值',
                  'info'
                );
              }}
              className="text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
              title={t.ops.resetToDefault}
            >
              <RotateCcw className="w-3 h-3" />
              {t.ops.resetToDefault}
            </button>
          )}
        </div>
      </div>

      {/* Control Area */}
      <div className="pt-2">{renderControl()}</div>

      {/* Inline Validation Error Banner */}
      {effectiveError && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            {allErrors && allErrors.length > 1
              ? `共发现 ${allErrors.length} 处规范校验错误，首个错误: ${effectiveError.message}`
              : effectiveError.message}
          </span>
        </div>
      )}
    </div>
  );
};
