import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileCode,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ConfigPreviewPanel, type ConfigPreviewResult } from './ConfigPreviewPanel';
import { resolveSchemaPackageFromJson } from '../../utils/schemaInfer';
import { fetchRemoteJson } from '../../utils/remoteConfig';
import { ConfigSchemaPackage, FieldDefinition, ConfigCategory } from '../../types/config';
import { getPresetSchemaSnippets } from '../../data/configLoadPresets';
import { useI18n } from '../../i18n';

export interface ConfigLoadResult {
  schemaPackage: ConfigSchemaPackage;
  fields: FieldDefinition[];
  categories: ConfigCategory[];
  rawJson: Record<string, any>;
  name: string;
  description: string;
  sourceType: 'file' | 'paste' | 'remote';
  sourceUrl?: string;
  isStandardSchema: boolean;
}

interface ConfigLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ConfigLoadResult) => void;
  hasExistingSchema?: boolean;
  initialTab?: 'upload' | 'paste' | 'remote';
  initialUrl?: string;
}

export const ConfigLoadModal: React.FC<ConfigLoadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  hasExistingSchema = false,
  initialTab = 'upload',
  initialUrl = '',
}) => {
  const { t, language, format: formatMessage } = useI18n();
  const presetSchemas = getPresetSchemaSnippets(language);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'remote'>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Paste state
  const [jsonText, setJsonText] = useState('');

  // Remote URL state
  const [remoteUrl, setRemoteUrl] = useState(initialUrl);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedUrl, setLastFetchedUrl] = useState<string | null>(null);

  // Parsed schema & config state
  const [resolvedResult, setResolvedResult] = useState<ConfigPreviewResult | null>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [configName, setConfigName] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'paste' | 'remote'>('file');

  // Copy shareable link state & dynamic host URL detection
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [actualAppUrl, setActualAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualAppUrl(`${window.location.origin}${window.location.pathname}`);
    }
  }, []);

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialUrl) {
        setRemoteUrl(initialUrl);
        setActiveTab('remote');
      }
    }
  }, [isOpen, initialTab, initialUrl]);

  // Synchronize JSON parsing and resolve schema package
  const handleParseJsonString = (
    text: string,
    fallbackName?: string,
    source: 'file' | 'paste' | 'remote' = 'paste',
    srcUrl?: string
  ) => {
    if (!text.trim()) {
      setResolvedResult(null);
      setParseError(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError(t.details.theRootMustBeAJsonObject);
        setResolvedResult(null);
        return;
      }

      const res = resolveSchemaPackageFromJson(parsed, fallbackName, srcUrl, language);
      setResolvedResult(res);
      setParseError(null);
      setSourceType(source);
      setConfigName(res.schemaPackage.name);
      setConfigDesc(res.schemaPackage.description);
    } catch (err: any) {
      setParseError(formatMessage(t.details.jsonSyntaxError, { value0: err.message }));
      setResolvedResult(null);
    }
  };

  if (!isOpen) return null;

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      handleParseJsonString(content, formatMessage(t.details.schema, { value0: baseName }), 'file');
    };
    reader.onerror = () => {
      setParseError(t.details.unableToReadTheLocalFileCheck);
      setResolvedResult(null);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Paste handlers
  const handlePasteChange = (val: string) => {
    setJsonText(val);
    handleParseJsonString(val, t.details.pastedConfigurationSchema, 'paste');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonText(text);
        handleParseJsonString(text, t.details.clipboardSchema, 'paste');
      }
    } catch {
      setParseError(t.details.unableToAccessTheClipboardPasteInto);
    }
  };

  const handleFormatJson = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: any) {
      setParseError(formatMessage(t.details.unableToFormatInvalidJson, { value0: err.message }));
    }
  };

  const handleApplyPreset = (snippet: typeof presetSchemas[number]) => {
    const formatted = JSON.stringify(snippet.package, null, 2);
    setJsonText(formatted);
    handleParseJsonString(formatted, snippet.name, 'paste');
  };

  // Remote URL fetching
  const handleFetchRemote = async (targetUrl?: string) => {
    const url = (targetUrl || remoteUrl).trim();
    if (!url) {
      setFetchError(t.details.enterAValidRemoteSchemaUrl);
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setFetchError(t.details.theUrlMustStartWithHttpOr);
      return;
    }

    setIsFetchingRemote(true);
    setFetchError(null);

    try {
      const data = await fetchRemoteJson(url, 8000);

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error(t.details.theRemoteResponseMustBeAJson);
      }

      setLastFetchedUrl(url);
      const urlFileName = url.split('/').pop()?.replace(/\.json$/i, '') || t.details.remoteSchema;
      const autoName = formatMessage(t.details.schema, { value0: urlFileName.charAt(0).toUpperCase() + urlFileName.slice(1) });

      const res = resolveSchemaPackageFromJson(data, autoName, url, language);
      setResolvedResult(res);
      setParseError(null);
      setSourceType('remote');
      setConfigName(res.schemaPackage.name);
      setConfigDesc(res.schemaPackage.description);
    } catch (err: any) {
      setFetchError(
        formatMessage(t.details.fetchFailedOpenTheUrlInA, { value0: err.message || t.details.theConnectionTimedOutOrCrossOrigin })
      );
      setResolvedResult(null);
    } finally {
      setIsFetchingRemote(false);
    }
  };

  const handleCopyShareableUrl = () => {
    const url = remoteUrl.trim();
    if (!url) return;
    const origin = actualAppUrl || window.location.origin;
    const shareable = `${origin}?load=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(shareable);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // Confirmation
  const handleConfirm = () => {
    if (!resolvedResult) return;

    const finalPkg: ConfigSchemaPackage = {
      ...resolvedResult.schemaPackage,
      name: configName.trim() || resolvedResult.schemaPackage.name,
      description: configDesc.trim() || resolvedResult.schemaPackage.description,
    };

    onConfirm({
      schemaPackage: finalPkg,
      fields: finalPkg.fields,
      categories: finalPkg.categories,
      rawJson: resolvedResult.configData,
      name: finalPkg.name,
      description: finalPkg.description,
      sourceType,
      sourceUrl: sourceType === 'remote' ? remoteUrl.trim() : undefined,
      isStandardSchema: resolvedResult.isStandardSchema,
    });
    onClose();
  };

  const displayAppBaseUrl = actualAppUrl || 'https://app.url';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>{t.schemaLoadModal.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {t.schemaLoadModal.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-0 bg-slate-900/60 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{t.schemaLoadModal.tabUpload}</span>
              {uploadedFile && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'paste'
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>{t.schemaLoadModal.tabPaste}</span>
              {jsonText.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('remote')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'remote'
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{t.schemaLoadModal.tabRemote}</span>
              {lastFetchedUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-indigo-600/60 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white">{t.details.browseLocalFilesOrDropADeveloper}</h3>
                <p className="text-xs text-slate-400 mt-1">{t.details.supportsStandardSchemaPackagesWithSafetyRules}</p>

                {uploadedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.details.selectedFile}{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              {/* Presets row */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">{t.details.builtInDeveloperSchemaExamples}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetSchemas.map((snippet) => (
                    <button
                      key={snippet.name}
                      type="button"
                      onClick={() => handleApplyPreset(snippet)}
                      className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-indigo-950/40 hover:border-indigo-700/50 transition-all text-xs group"
                    >
                      <div className="font-medium text-slate-200 group-hover:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{snippet.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {snippet.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea toolbar */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{t.details.pasteTheDeveloperSchemaJson}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{t.details.pasteFromClipboard}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{t.details.format}</span>
                  </button>
                  {jsonText && (
                    <button
                      type="button"
                      onClick={() => {
                        setJsonText('');
                        setResolvedResult(null);
                        setParseError(null);
                      }}
                      className="px-2 py-1 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                    >{t.details.clear}</button>
                  )}
                </div>
              </div>

              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="w-full p-3.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                placeholder={t.details.nIdPkgServiceSpecNName}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 3: REMOTE URL FETCH */}
          {activeTab === 'remote' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">{t.details.enterTheRemoteSchemaJsonUrlProvided}</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchRemote();
                        }
                      }}
                      placeholder="https://repo.company.org/schemas/cluster-spec.json"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFetchRemote()}
                    disabled={isFetchingRemote || !remoteUrl.trim()}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isFetchingRemote ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.details.fetching}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>{t.details.fetchSchema}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Integration URL generation helper */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.details.embeddedIntegrationLoad}</span>
                  </div>
                  {remoteUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleCopyShareableUrl}
                      className="px-2 py-0.5 text-[11px] rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80 transition-colors flex items-center gap-1"
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{t.details.embedLinkCopied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.details.copyEmbedUrl}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{t.details.otherSystemsAndWorkflowPlatformsSuchAs}</p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 break-all select-all">
                  {displayAppBaseUrl}?load={remoteUrl.trim() ? encodeURIComponent(remoteUrl.trim()) : t.details.remoteSchemaJsonUrl}
                </div>
                <p className="text-[11px] text-slate-500">{t.details.embeddedModeHidesTheHeaderAndFooter}</p>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">{t.details.remoteSchemaFetchFailed}</p>
                    <p className="text-slate-300/90 leading-relaxed">{fetchError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <ConfigPreviewPanel
            result={resolvedResult}
            name={configName}
            description={configDesc}
            onNameChange={setConfigName}
            onDescriptionChange={setConfigDesc}
          />

          {/* Parse error banner */}
          {parseError && (
            <div className="flex items-center gap-2 p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">{t.details.deliveredSchemasLetOperatorsEditValidatedParameters}</span>
            <span className="sm:hidden">{t.details.validationConfigurationSafety}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!resolvedResult}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.schemaLoadModal.confirmBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
