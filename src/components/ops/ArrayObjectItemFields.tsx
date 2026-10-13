import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { FieldDefinition, ValidationError } from '../../types/config';

interface ArrayObjectItemFieldsProps {
  fieldPath: string;
  itemIndex: number;
  item: Record<string, any>;
  itemFields: FieldDefinition[];
  itemErrors: ValidationError[];
  onUpdate: (key: string, value: any) => void;
}

export const ArrayObjectItemFields: React.FC<ArrayObjectItemFieldsProps> = ({
  fieldPath,
  itemIndex,
  item,
  itemFields,
  itemErrors,
  onUpdate,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
    {itemFields.map((sub) => {
      const value = item[sub.key];
      const error = itemErrors.find(
        (itemError) => itemError.path === `${fieldPath}[${itemIndex}].${sub.key}`
      );
      const errorMessage = error && (
        <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error.message}
        </p>
      );
      const inputClassName = `w-full px-3 py-1.5 text-xs bg-slate-900 border rounded-lg text-white font-mono focus:outline-hidden ${
        error
          ? 'border-rose-500 ring-1 ring-rose-500/30'
          : 'border-slate-700 focus:border-indigo-500'
      }`;

      return (
        <div
          key={sub.key}
          className={`space-y-1 ${sub.type === 'array_string' ? 'md:col-span-2' : ''}`}
        >
          <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              {sub.label}
              {sub.required && <span className="text-rose-400 font-normal">*</span>}
            </span>
            <span className="font-mono text-[10px] text-slate-500">{sub.key}</span>
          </label>

          {sub.type === 'boolean' ? (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(value)}
                onClick={() => onUpdate(sub.key, !Boolean(value))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  value ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    value ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-400">{value ? '已启用' : '已停用'}</span>
            </div>
          ) : sub.type === 'port' ? (
            <div>
              <input
                type="number"
                min={1}
                max={65535}
                value={value ?? ''}
                onChange={(event) =>
                  onUpdate(sub.key, event.target.value === '' ? '' : Number(event.target.value))
                }
                className={inputClassName}
                placeholder="8080"
              />
              {errorMessage}
            </div>
          ) : sub.type === 'number' ? (
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="number"
                  value={value ?? ''}
                  onChange={(event) =>
                    onUpdate(sub.key, event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={inputClassName}
                />
                {sub.constraints?.unit && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                    {sub.constraints.unit}
                  </span>
                )}
              </div>
              {errorMessage}
            </div>
          ) : sub.type === 'enum' && sub.constraints?.options ? (
            <div>
              <select
                value={value ?? ''}
                onChange={(event) => onUpdate(sub.key, event.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs bg-slate-900 border rounded-lg text-white focus:outline-hidden ${
                  error
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-slate-700 focus:border-indigo-500'
                }`}
              >
                {sub.constraints.options.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errorMessage}
            </div>
          ) : sub.type === 'array_string' ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg bg-slate-900 border border-slate-800 min-h-[36px]">
                {(Array.isArray(value) ? value : []).map((tag: string, tagIndex: number) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate(
                          sub.key,
                          (value || []).filter((_: any, index: number) => index !== tagIndex)
                        )
                      }
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="输入标签后按回车添加..."
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    const input = event.currentTarget;
                    if (!input.value.trim()) return;
                    onUpdate(sub.key, [
                      ...(Array.isArray(value) ? value : []),
                      input.value.trim(),
                    ]);
                    input.value = '';
                  }}
                  className="text-xs bg-transparent text-white placeholder-slate-500 focus:outline-hidden min-w-[120px] font-mono px-1"
                />
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={value ?? ''}
                onChange={(event) => onUpdate(sub.key, event.target.value)}
                className={inputClassName}
              />
              {errorMessage}
            </div>
          )}

          {sub.description && (
            <p className="text-[10px] text-slate-500 leading-tight">{sub.description}</p>
          )}
        </div>
      );
    })}
  </div>
);