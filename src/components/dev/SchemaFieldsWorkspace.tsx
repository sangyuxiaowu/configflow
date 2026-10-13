import React from 'react';
import { Edit3, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { FieldDefinition } from '../../types/config';
import { useI18n } from '../../i18n';

interface SchemaFieldsWorkspaceProps {
  fields: FieldDefinition[];
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  onSelectCategory: (category: string) => void;
  onSearchQueryChange: (query: string) => void;
  onAddField: () => void;
  onEditField: (field: FieldDefinition) => void;
  onDeleteField: (fieldId: string, label: string) => void;
}

export const SchemaFieldsWorkspace: React.FC<SchemaFieldsWorkspaceProps> = ({
  fields,
  categories,
  selectedCategory,
  searchQuery,
  onSelectCategory,
  onSearchQueryChange,
  onAddField,
  onEditField,
  onDeleteField,
}) => {
  const { t } = useI18n();
  const query = searchQuery.toLowerCase();
  const filteredFields = fields.filter((field) => {
    const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
    const matchesSearch =
      !query ||
      field.label.toLowerCase().includes(query) ||
      field.path.toLowerCase().includes(query) ||
      field.key.toLowerCase().includes(query) ||
      field.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
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
              onClick={() => onSelectCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>{t.dev.allFields}</span>
              </div>
              <span className="tabular-nums text-[11px] opacity-75">{fields.length}</span>
            </button>
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              const fieldCount = fields.filter((field) => field.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{category}</span>
                  <span className="tabular-nums text-[11px] opacity-75">{fieldCount}</span>
                </button>
              );
            })}
          </div>
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
              placeholder={t.dev.searchFieldPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <button
            onClick={onAddField}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.dev.addFieldBtn}</span>
          </button>
        </div>

        <div className="space-y-3">
          {filteredFields.map((field) => (
            <div
              key={field.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white">{field.label}</span>
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                    {field.path}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                      {t.common.required}
                    </span>
                  )}
                  {field.isDangerous && (
                    <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                      {t.ops.filterDangerous}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">
                  {field.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEditField(field)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.common.edit}</span>
                </button>
                <button
                  onClick={() => onDeleteField(field.id, field.label)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title={t.common.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredFields.length === 0 && (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-sm text-slate-300 font-semibold">{t.dev.emptyFieldsTitle}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.dev.emptyFieldsDesc}</p>
              <button
                onClick={onAddField}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.dev.addFieldBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};