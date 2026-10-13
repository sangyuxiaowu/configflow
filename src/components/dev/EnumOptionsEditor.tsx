import React, { useState } from 'react';
import { List, Plus, Trash2 } from 'lucide-react';
import { EnumOption } from '../../types/config';

interface EnumOptionsEditorProps {
  options: EnumOption[];
  onChange: (options: EnumOption[]) => void;
}

export const EnumOptionsEditor: React.FC<EnumOptionsEditorProps> = ({
  options,
  onChange,
}) => {
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [batchText, setBatchText] = useState('');
  const [showBatch, setShowBatch] = useState(false);

  const handleAdd = () => {
    if (!newValue.trim()) return;
    onChange([
      ...options,
      {
        value: newValue.trim(),
        label: newLabel.trim() || newValue.trim(),
        description: newDescription.trim() || undefined,
      },
    ]);
    setNewValue('');
    setNewLabel('');
    setNewDescription('');
  };

  const handleBatchAdd = () => {
    if (!batchText.trim()) return;
    const addedOptions = batchText
      .split(/[,，\n]/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({
        value,
        label: value,
        description: `可选值: ${value}`,
      }));
    onChange([...options, ...addedOptions]);
    setBatchText('');
    setShowBatch(false);
  };

  const handleUpdate = (index: number, patch: Partial<EnumOption>) => {
    onChange(options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, ...patch } : option
    ));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <List className="w-3.5 h-3.5 text-indigo-400" />
            枚举候选值管理 (运维只能在这些选项中选择)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            为每个选项提供明确的取值、中文名称和场景说明
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBatch(!showBatch)}
          className="text-xs text-indigo-400 hover:underline"
        >
          {showBatch ? '单条添加' : '批量快捷导入'}
        </button>
      </div>

      {showBatch && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <label className="text-xs text-slate-300 block">
            输入多个选项（以逗号或换行分隔，如：round_robin, least_conn, ip_hash）
          </label>
          <textarea
            rows={3}
            value={batchText}
            onChange={(event) => setBatchText(event.target.value)}
            placeholder="例如: dev, test, staging, prod"
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
          />
          <button
            type="button"
            onClick={handleBatchAdd}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
          >
            确认批量添加
          </button>
        </div>
      )}

      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <span className="text-xs font-medium text-slate-300 block">添加新候选值：</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder="* 选项实际值 (如 cluster)"
            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="中文显示名 (如 分布式分片集群)"
            className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="用途说明 (如 适用于生产高可用)"
              className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              添加
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {options.map((option, index) => (
          <div
            key={index}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
          >
            <div className="md:col-span-3">
              <input
                type="text"
                value={String(option.value)}
                onChange={(event) => handleUpdate(index, { value: event.target.value })}
                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded font-mono text-indigo-300"
                placeholder="值"
              />
            </div>
            <div className="md:col-span-4">
              <input
                type="text"
                value={option.label}
                onChange={(event) => handleUpdate(index, { label: event.target.value })}
                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                placeholder="显示名"
              />
            </div>
            <div className="md:col-span-4">
              <input
                type="text"
                value={option.description || ''}
                onChange={(event) => handleUpdate(index, { description: event.target.value })}
                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-300"
                placeholder="说明"
              />
            </div>
            <div className="md:col-span-1 text-right">
              <button
                type="button"
                onClick={() => onChange(options.filter((_, optionIndex) => optionIndex !== index))}
                className="p-1 text-slate-500 hover:text-rose-400"
                title="删除该选项"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {options.length === 0 && (
          <div className="text-center py-6 text-xs text-rose-400 bg-rose-950/20 border border-rose-800/30 rounded-xl">
            ⚠️ 当前尚未配置任何枚举选项，请在上方添加至少一个候选值
          </div>
        )}
      </div>
    </div>
  );
};