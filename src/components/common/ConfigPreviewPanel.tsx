import React from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { ConfigSchemaPackage } from '../../types/config';
import { useI18n } from '../../i18n';

export interface ConfigPreviewResult {
  schemaPackage: ConfigSchemaPackage;
  isStandardSchema: boolean;
  configData: Record<string, any>;
}

interface ConfigPreviewPanelProps {
  result: ConfigPreviewResult | null;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const ConfigPreviewPanel: React.FC<ConfigPreviewPanelProps> = ({
  result,
  name,
  description,
  onNameChange,
  onDescriptionChange,
}) => {
  const { t, format } = useI18n();
  if (!result) return null;

  return (
    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-4 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-800/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            {result.isStandardSchema
              ? t.schemaLoadModal.standardParsed
              : t.schemaLoadModal.inferredParsed}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 font-mono">
            <strong className="text-white">{format(t.schemaLoadModal.fieldCount, { count: result.schemaPackage.fields.length })}</strong>
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <strong className="text-white">{format(t.schemaLoadModal.profileCount, { count: result.schemaPackage.referenceExamples.length })}</strong>
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <strong className="text-white">{format(t.schemaLoadModal.categoryCount, { count: result.schemaPackage.categories.length })}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            {t.dev.schemaName}
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t.schemaLoadModal.namePlaceholder}
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            {t.schemaLoadModal.descriptionLabel}
          </label>
          <input
            type="text"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={t.schemaLoadModal.descriptionPlaceholder}
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>{t.schemaLoadModal.previewNotice}</span>
      </div>
    </div>
  );
};