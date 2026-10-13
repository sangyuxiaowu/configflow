import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  FieldDefinition,
  ReferenceExample,
  ValidationError,
} from '../../types/config';
import { getValueByPath } from '../../utils/schemaInfer';
import { useI18n } from '../../i18n';
import { OpsFieldRenderer } from './OpsFieldRenderer';

interface OpsFieldsWorkspaceProps {
  fields: FieldDefinition[];
  currentConfig: Record<string, any>;
  initialConfig: Record<string, any>;
  uploadedOriginalConfig: Record<string, any> | null;
  activeReference?: ReferenceExample;
  errors: ValidationError[];
  activeCategory: string;
  searchQuery: string;
  filterMode: FilterMode;
  onActiveCategoryChange: (category: string) => void;
  onSearchQueryChange: (query: string) => void;
  onFilterModeChange: (mode: FilterMode) => void;
  onChangeConfig: (path: string, value: any) => void;
}

type FilterMode = 'all' | 'modified' | 'errors' | 'dangerous';

export const OpsFieldsWorkspace: React.FC<OpsFieldsWorkspaceProps> = ({
  fields,
  currentConfig,
  initialConfig,
  uploadedOriginalConfig,
  activeReference,
  errors,
  activeCategory,
  searchQuery,
  filterMode,
  onActiveCategoryChange,
  onSearchQueryChange,
  onFilterModeChange,
  onChangeConfig,
}) => {
  const { t, language } = useI18n();
  const categories = Array.from(new Set(fields.map((field) => field.category)));

  const getFieldForError = (errorPath: string): FieldDefinition | undefined => {
    const exactMatch = fields.find((field) => field.path === errorPath);
    if (exactMatch) return exactMatch;
    return fields.find(
      (field) =>
        errorPath.startsWith(`${field.path}[`) || errorPath.startsWith(`${field.path}.`)
    );
  };

  const getErrorsForField = (field: FieldDefinition) =>
    errors.filter(
      (error) =>
        error.path === field.path ||
        error.path.startsWith(`${field.path}[`) ||
        error.path.startsWith(`${field.path}.`)
    );

  const categoryErrorCounts: Record<string, number> = {};
  for (const category of categories) categoryErrorCounts[category] = 0;
  for (const error of errors) {
    const field = getFieldForError(error.path);
    if (field && categoryErrorCounts[field.category] !== undefined) {
      categoryErrorCounts[field.category]++;
    }
  }

  const changedCount = fields.reduce((count, field) => {
    const currentValue = getValueByPath(currentConfig, field.path);
    const baseline = uploadedOriginalConfig
      ? getValueByPath(uploadedOriginalConfig, field.path)
      : activeReference?.config
      ? getValueByPath(activeReference.config, field.path)
      : getValueByPath(initialConfig, field.path);
    return count + (JSON.stringify(currentValue) !== JSON.stringify(baseline) ? 1 : 0);
  }, 0);

  const filteredFields = fields.filter((field) => {
    if (activeCategory !== 'all' && field.category !== activeCategory) return false;
    const query = searchQuery.toLowerCase();
    if (
      query &&
      !field.label.toLowerCase().includes(query) &&
      !field.path.toLowerCase().includes(query) &&
      !field.description.toLowerCase().includes(query)
    ) {
      return false;
    }

    if (filterMode === 'errors') return getErrorsForField(field).length > 0;
    if (filterMode === 'dangerous') return Boolean(field.isDangerous);
    if (filterMode === 'modified') {
      const currentValue = getValueByPath(currentConfig, field.path);
      const baseline = uploadedOriginalConfig
        ? getValueByPath(uploadedOriginalConfig, field.path)
        : activeReference?.config
        ? getValueByPath(activeReference.config, field.path)
        : getValueByPath(initialConfig, field.path);
      return JSON.stringify(currentValue) !== JSON.stringify(baseline);
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 space-y-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 block">
            {t.dev.categoriesTitle}
          </span>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onActiveCategoryChange('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>{t.ops.allCategories}</span>
              </div>
              <span className="tabular-nums text-[11px] opacity-75">{fields.length}</span>
            </button>
            {categories.map((category) => {
              const isSelected = activeCategory === category;
              const fieldCount = fields.filter((field) => field.category === category).length;
              const errorCount = categoryErrorCounts[category] || 0;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onActiveCategoryChange(category)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{category}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {errorCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-950" />
                    )}
                    <span className="tabular-nums text-[11px] opacity-75">{fieldCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'en' ? 'Ops Safety Guardrails' : '运维防呆保护机制'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {language === 'en' ? (
              <>
                • Port and numeric boundaries strictly enforced
                <br />
                • Passwords & tokens automatically masked
                <br />
                • Cluster nodes support card expand, clone & reorder
                <br />
                • Instant access to developer architectural baselines
              </>
            ) : (
              <>
                • 端口与数值均在开发设定的安全边界内
                <br />
                • 密码与凭据自动脱敏显示
                <br />
                • 对象列表可卡片化展开、克隆与排序
                <br />
                • 随时可查阅开发架构考量并一键采纳
              </>
            )}
          </p>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={t.ops.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            {(['all', 'modified', 'dangerous', 'errors'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onFilterModeChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterMode === mode
                    ? mode === 'dangerous' || mode === 'errors'
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'all' && t.ops.filterAll}
                {mode === 'modified' && `${t.ops.filterModified} (${changedCount})`}
                {mode === 'dangerous' && t.ops.filterDangerous}
                {mode === 'errors' && `${t.ops.filterErrors} (${errors.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          {filteredFields.map((field) => {
            const fieldErrors = getErrorsForField(field);
            return (
              <OpsFieldRenderer
                key={field.id}
                field={field}
                value={getValueByPath(currentConfig, field.path)}
                onChange={(value) => onChangeConfig(field.path, value)}
                error={fieldErrors[0]}
                allErrors={fieldErrors}
                referenceValue={activeReference
                  ? getValueByPath(activeReference.config, field.path)
                  : undefined}
                referenceName={activeReference?.name}
              />
            );
          })}
          {filteredFields.length === 0 && (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <p className="text-sm text-slate-400">{t.ops.noMatchFields}</p>
              <button
                onClick={() => {
                  onSearchQueryChange('');
                  onFilterModeChange('all');
                }}
                className="mt-2 text-xs text-indigo-400 hover:underline"
              >
                {t.ops.resetFilter}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};