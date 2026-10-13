import { useI18n } from '../../i18n';
import React, { useState } from 'react';
import { X, Download, Copy, Check, FileJson, Package, ShieldCheck } from 'lucide-react';
import { ConfigSchemaPackage } from '../../types/config';
import { useToast } from '../common/Toast';
import { ConfigFormat, configFileExtension, stringifyConfig } from '../../utils/configFormats';

interface SchemaExportModalProps {
  schemaPackage: ConfigSchemaPackage;
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaExportModal: React.FC<SchemaExportModalProps> = ({
  schemaPackage,
  isOpen,
  onClose,
}) => {
  const { t, format: formatMessage } = useI18n();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'schema' | 'template'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const schemaJsonString = JSON.stringify(schemaPackage, null, 2);
  const outputFormat: ConfigFormat = schemaPackage.outputFormat || 'json';
  let templateString = '';
  let templateError: string | null = null;
  try {
    templateString = stringifyConfig(schemaPackage.defaultConfig, outputFormat);
  } catch (error) {
    templateError = error instanceof Error ? error.message : String(error);
  }
  const activeContent = activeTab === 'schema' ? schemaJsonString : templateString;

  const handleCopy = () => {
    if (activeTab === 'template' && templateError) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    showToast(
      activeTab === 'schema'
        ? t.details.schemaPackageJsonCopied
        : formatMessage(t.details.defaultConfigurationCopied, { value0: outputFormat.toUpperCase() }),
      'success'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeTab === 'template' && templateError) return;
    const filename =
      activeTab === 'schema'
        ? `${schemaPackage.id || 'config-schema'}.json`
        : `config.default.${configFileExtension(outputFormat)}`;
    const mimeType = activeTab === 'schema' || outputFormat === 'json'
      ? 'application/json'
      : outputFormat === 'yaml'
        ? 'application/yaml'
        : 'text/plain';
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(formatMessage(t.details.downloadStarted, { value0: filename }), 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">{t.details.exportSchemaConfigurationTemplate}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t.details.packageFieldRulesRangesUnitsAndReference}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {formatMessage(t.details.schemaPackage, { fields: schemaPackage.fields.length, profiles: schemaPackage.referenceExamples.length })}
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'template'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />{t.details.defaultConfigurationConfigDefault}{configFileExtension(outputFormat)})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={activeTab === 'template' && Boolean(templateError)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t.details.copied : activeTab === 'schema' ? t.details.copySchemaJson : formatMessage(t.details.copy2, { value0: outputFormat.toUpperCase() })}
            </button>
            <button
              onClick={handleDownload}
              disabled={activeTab === 'template' && Boolean(templateError)}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              {activeTab === 'schema' ? t.details.downloadSchemaJson : formatMessage(t.details.downloadConfiguration, { value0: outputFormat.toUpperCase() })}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
          <pre className={`text-xs font-mono ${activeTab === 'template' && templateError ? 'text-rose-400' : 'text-indigo-200/90'} leading-relaxed overflow-x-auto whitespace-pre selection:bg-indigo-700/50`}>
            {activeTab === 'template' && templateError ? templateError : activeContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>{formatMessage(t.details.fileSize, { size: (new Blob([activeContent]).size / 1024).toFixed(1), format: activeTab === 'schema' ? 'Schema JSON' : outputFormat.toUpperCase() })}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >{t.details.doneClose}</button>
        </div>
      </div>
    </div>
  );
};
