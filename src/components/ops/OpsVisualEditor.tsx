import React, { useState, useEffect } from 'react';
import {
  Upload,
  BookOpen,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  FileText,
  Wrench,
  Code2,
  User,
  Calendar,
  Tag,
  Globe,
} from 'lucide-react';
import {
  ConfigSchemaPackage,
  FieldDefinition,
  ValidationError,
  ReferenceExample,
} from '../../types/config';
import { OpsFieldsWorkspace } from './OpsFieldsWorkspace';
import { OpsReferenceDrawer } from './OpsReferenceDrawer';
import { OpsExportModal } from './OpsExportModal';
import { LoadCurrentConfigModal } from './LoadCurrentConfigModal';
import { ConfigLoadModal, ConfigLoadResult } from '../common/ConfigLoadModal';
import { validateConfigAgainstSchema } from '../../utils/validator';
import {
  getValueByPath,
  setValueByPath,
} from '../../utils/schemaInfer';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';

interface OpsVisualEditorProps {
  schemaPackage: ConfigSchemaPackage | null;
  currentConfig: Record<string, any>;
  onUpdateConfig: (newConfig: Record<string, any>) => void;
  onUpdateSchemaPackage: (pkg: ConfigSchemaPackage) => void;
  onSwitchToDevMode: () => void;
  onLoadShowcaseDemo: () => void;
  isRemoteMode?: boolean;
  remoteUrl?: string;
}

export const OpsVisualEditor: React.FC<OpsVisualEditorProps> = ({
  schemaPackage,
  currentConfig,
  onUpdateConfig,
  onUpdateSchemaPackage,
  onSwitchToDevMode,
  onLoadShowcaseDemo,
  isRemoteMode = false,
  remoteUrl = '',
}) => {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();

  // Initial config backup for diff calculation
  const [initialConfig, setInitialConfig] = useState<Record<string, any>>(() =>
    JSON.parse(JSON.stringify(currentConfig || {}))
  );

  // 用户通过「载入当前配置」上传的实际配置文件数据 (作为修改前原始值进行变动追踪)
  const [uploadedOriginalConfig, setUploadedOriginalConfig] = useState<Record<string, any> | null>(null);
  const [uploadedConfigName, setUploadedConfigName] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'modified' | 'errors' | 'dangerous'
  >('all');

  // Active reference example selected for comparison
  const [activeRefId, setActiveRefId] = useState<string>('');

  // Modals state
  const [isRefDrawerOpen, setIsRefDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfigLoadModalOpen, setIsConfigLoadModalOpen] = useState(false);
  const [isLoadCurrentConfigModalOpen, setIsLoadCurrentConfigModalOpen] = useState(false);

  // 当约束包 ID 变更时重置上传的原始文件记录
  useEffect(() => {
    setUploadedOriginalConfig(null);
    setUploadedConfigName(null);
  }, [schemaPackage?.id]);

  // 处理「载入当前配置」确认
  const handleLoadCurrentConfig = (loadedConfig: Record<string, any>, sourceName: string) => {
    onUpdateConfig(loadedConfig);
    setUploadedOriginalConfig(JSON.parse(JSON.stringify(loadedConfig)));
    setUploadedConfigName(sourceName);
    setInitialConfig(JSON.parse(JSON.stringify(loadedConfig)));
    showToast(format(t.workspace.currentConfigLoaded, { name: sourceName }), 'success');
  };

  // Handle load from modal (upload / paste / remote) for initial schema loading
  const handleConfigLoadConfirm = (result: ConfigLoadResult) => {
    onUpdateSchemaPackage(result.schemaPackage);
    onUpdateConfig(result.rawJson);
    setInitialConfig(JSON.parse(JSON.stringify(result.rawJson)));
    setUploadedOriginalConfig(null);
    setUploadedConfigName(null);
    showToast(
      result.isStandardSchema
        ? format(t.workspace.schemaLoadedStandard, { name: result.name })
        : format(t.workspace.schemaLoadedInferred, { name: result.name }),
      'success'
    );
  };

  // If no schema defined yet
  if (!schemaPackage || schemaPackage.fields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t.ops.noSchemaEmptyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            {t.ops.noSchemaEmptyDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsConfigLoadModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{t.ops.btnImportDevSchema}</span>
            </button>

            <button
              type="button"
              onClick={onLoadShowcaseDemo}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.ops.btnLoadShowcase}</span>
            </button>

            {!isRemoteMode && (
              <button
                type="button"
                onClick={onSwitchToDevMode}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>{t.ops.btnCreateInDev}</span>
              </button>
            )}
          </div>
        </div>

        <ConfigLoadModal
          isOpen={isConfigLoadModalOpen}
          onClose={() => setIsConfigLoadModalOpen(false)}
          onConfirm={handleConfigLoadConfirm}
          hasExistingSchema={false}
          initialTab="upload"
          initialUrl={remoteUrl}
        />
      </div>
    );
  }

  const activeReference =
    schemaPackage.referenceExamples.find((r) => r.id === activeRefId) ||
    schemaPackage.referenceExamples[0];

  // Real-time validation (passing language for localized error messages)
  const errors = validateConfigAgainstSchema(currentConfig, schemaPackage.fields, language);

  // Helper to match an error to its corresponding FieldDefinition
  const getFieldForError = (errPath: string): FieldDefinition | undefined => {
    const exact = schemaPackage.fields.find((f) => f.path === errPath);
    if (exact) return exact;
    return schemaPackage.fields.find(
      (f) => errPath.startsWith(`${f.path}[`) || errPath.startsWith(`${f.path}.`)
    );
  };

  // Handle single field change
  const handleFieldChange = (path: string, newVal: any) => {
    const nextConfig = setValueByPath(currentConfig, path, newVal);
    onUpdateConfig(nextConfig);
  };

  // Jump to first error
  const handleJumpToFirstError = () => {
    if (errors.length === 0) return;
    const firstErr = errors[0];
    const field = getFieldForError(firstErr.path);
    if (field) {
      setActiveCategory(field.category);
      setFilterMode('all');
      setTimeout(() => {
        const el = document.getElementById(
          `field-card-${field.path.replace(/\./g, '_')}`
        );
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Count changed fields
  let changedCount = 0;
  for (const f of schemaPackage.fields) {
    const cur = getValueByPath(currentConfig, f.path);
    if (uploadedOriginalConfig) {
      const orig = getValueByPath(uploadedOriginalConfig, f.path);
      if (JSON.stringify(cur) !== JSON.stringify(orig)) {
        changedCount++;
      }
    } else if (activeReference?.config) {
      const base = getValueByPath(activeReference.config, f.path);
      if (JSON.stringify(cur) !== JSON.stringify(base)) {
        changedCount++;
      }
    } else {
      const init = getValueByPath(initialConfig, f.path);
      if (JSON.stringify(cur) !== JSON.stringify(init)) {
        changedCount++;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Ops Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Top row */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md xl:max-w-xl">
                  {schemaPackage.name}
                </h1>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-950/90 text-indigo-300 border border-indigo-800/60 font-mono shrink-0">
                <Tag className="w-2.5 h-2.5 text-indigo-400" />
                <span>v{schemaPackage.version || '1.0.0'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 shrink-0">
                <Wrench className="w-2.5 h-2.5 text-emerald-400" />
                <span>{t.nav.opsMode}</span>
              </span>

              {uploadedConfigName && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 font-mono shrink-0"
                  title={`${t.ops.originalValue}: ${uploadedConfigName}`}
                >
                  <FileText className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{uploadedConfigName}</span>
                </span>
              )}

              {isRemoteMode && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-sky-950/80 text-sky-300 border border-sky-800/50 shrink-0"
                  title={remoteUrl ? `${t.remote.targetUrl} ${remoteUrl}` : 'Remote Mode'}
                >
                  <Globe className="w-2.5 h-2.5 text-sky-400" />
                  <span>{language === 'en' ? 'Remote Integration' : '远程集成模式'}</span>
                </span>
              )}

              <div className="hidden sm:inline-flex items-center gap-2.5 text-xs text-slate-400 pl-1 border-l border-slate-800 shrink-0">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-400">{t.common.author}:</span>
                  <span className="text-slate-300 font-medium">
                    {schemaPackage.author || (language === 'en' ? 'Architecture Team' : '系统架构组')}
                  </span>
                </span>

                <span className="text-slate-700">·</span>

                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-400">{t.common.updatedAt}:</span>
                  <span className="text-slate-300 font-mono">
                    {schemaPackage.updatedAt || '2026-10-12'}
                  </span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-slate-400">
              <p
                className="text-xs text-slate-300/85 line-clamp-1 max-w-3xl leading-relaxed"
                title={schemaPackage.description}
              >
                {schemaPackage.description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLoadCurrentConfigModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              title={t.loadConfigModal.subtitle}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.ops.loadCurrentConfig}</span>
            </button>

            {schemaPackage.referenceExamples.length > 0 && (
              <button
                onClick={() => setIsRefDrawerOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {t.ops.refBaseline} ({schemaPackage.referenceExamples.length})
                </span>
              </button>
            )}

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.ops.validateAndExport}</span>
              {changedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-800 text-[10px] font-bold">
                  {changedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Compliance & Baseline Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 text-xs">
          {/* Health status */}
          <div className="flex items-center gap-2">
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">
                  {language === 'en'
                    ? `Compliance Status Passed: All ${schemaPackage.fields.length} configuration parameters satisfy rules`
                    : `合规状态良好：全部 ${schemaPackage.fields.length} 个配置参数均符合规范`}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleJumpToFirstError}
                className="flex items-center gap-2 text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer group"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium">
                  {language === 'en'
                    ? `Found ${errors.length} parameters violating constraints · Click to locate and fix`
                    : `发现 ${errors.length} 处参数不符合开发约束 · 点击立即定位修复`}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Reference Alignment Selector */}
          {schemaPackage.referenceExamples.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">
                {language === 'en' ? 'Baseline Profile:' : '对照基准方案:'}
              </span>
              <select
                value={activeRefId || schemaPackage.referenceExamples[0]?.id}
                onChange={(e) => setActiveRefId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-medium focus:outline-hidden"
              >
                {schemaPackage.referenceExamples.map((ref) => (
                  <option key={ref.id} value={ref.id}>
                    {ref.name} ({ref.environment})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <OpsFieldsWorkspace
        fields={schemaPackage.fields}
        currentConfig={currentConfig}
        initialConfig={initialConfig}
        uploadedOriginalConfig={uploadedOriginalConfig}
        activeReference={activeReference}
        errors={errors}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        filterMode={filterMode}
        onActiveCategoryChange={setActiveCategory}
        onSearchQueryChange={setSearchQuery}
        onFilterModeChange={setFilterMode}
        onChangeConfig={handleFieldChange}
      />

      {/* Reference Examples Drawer */}
      <OpsReferenceDrawer
        examples={schemaPackage.referenceExamples}
        currentConfig={currentConfig}
        fields={schemaPackage.fields}
        isOpen={isRefDrawerOpen}
        onClose={() => setIsRefDrawerOpen(false)}
        onApplyExample={(ex) => onUpdateConfig(ex.config)}
      />

      {/* Export & Diff Review Modal */}
      <OpsExportModal
        currentConfig={currentConfig}
        uploadedOriginalConfig={uploadedOriginalConfig}
        uploadedConfigName={uploadedConfigName}
        baselineConfig={activeReference?.config || null}
        baselineName={activeReference?.name || null}
        fields={schemaPackage.fields}
        outputFormat={schemaPackage.outputFormat || 'json'}
        errors={errors}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* 载入当前配置 Modal */}
      <LoadCurrentConfigModal
        isOpen={isLoadCurrentConfigModalOpen}
        onClose={() => setIsLoadCurrentConfigModalOpen(false)}
        onConfirm={handleLoadCurrentConfig}
        format={schemaPackage.outputFormat || 'json'}
        knownPaths={schemaPackage.fields.map((field) => field.path)}
      />
    </div>
  );
};
