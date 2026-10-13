import React from 'react';
import { X } from 'lucide-react';
import { ConfigSchemaPackage } from '../../types/config';
import { useI18n } from '../../i18n';

interface EditSchemaInfoModalProps {
  schemaPackage: ConfigSchemaPackage;
  name: string;
  version: string;
  description: string;
  author: string;
  onNameChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onOutputFormatChange: (value: NonNullable<ConfigSchemaPackage['outputFormat']>) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditSchemaInfoModal: React.FC<EditSchemaInfoModalProps> = ({
  schemaPackage,
  name,
  version,
  description,
  author,
  onNameChange,
  onVersionChange,
  onDescriptionChange,
  onAuthorChange,
  onOutputFormatChange,
  onClose,
  onSave,
}) => {
  const { t, language } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">{t.dev.editBasicInfo}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {t.dev.schemaName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {t.dev.schemaVersion}
            </label>
            <input
              type="text"
              value={version}
              onChange={(event) => onVersionChange(event.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {language === 'en' ? 'Configuration output format' : '配置产出格式'}
            </label>
            <select
              value={schemaPackage.outputFormat || 'json'}
              onChange={(event) =>
                onOutputFormatChange(event.target.value as NonNullable<ConfigSchemaPackage['outputFormat']>)
              }
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML (.yml)</option>
              <option value="properties">Properties</option>
              <option value="env">ENV</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {t.dev.schemaAuthor}
            </label>
            <input
              type="text"
              value={author}
              onChange={(event) => onAuthorChange(event.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {t.dev.schemaDesc}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
};