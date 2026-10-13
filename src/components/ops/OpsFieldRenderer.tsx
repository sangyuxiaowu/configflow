import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { FieldDefinition, ValidationError } from '../../types/config';
import { ArrayObjectFieldRenderer } from './ArrayObjectFieldRenderer';
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
  } = field;

  const isModifiedFromDefault =
    JSON.stringify(value) !== JSON.stringify(defaultValue);
  const isDifferentFromRef =
    referenceValue !== undefined &&
    JSON.stringify(value) !== JSON.stringify(referenceValue);

  // Render the input control based on field type
  const renderControl = () => {
    switch (type) {
      case 'array_object': {
        return (
          <ArrayObjectFieldRenderer
            field={field}
            value={value}
            onChange={onChange}
            allErrors={allErrors}
          />
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
