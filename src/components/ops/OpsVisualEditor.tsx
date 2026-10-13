import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  BookOpen,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  ChevronRight,
  FileText,
  Sliders,
  Check,
  Flame,
  Wrench,
  Code2,
  User,
  Calendar,
  Tag,
  Globe,
  ExternalLink,
} from 'lucide-react';
import {
  ConfigSchemaPackage,
  FieldDefinition,
  ValidationError,
  ReferenceExample,
} from '../../types/config';
import { OpsFieldRenderer } from './OpsFieldRenderer';
import { OpsReferenceDrawer } from './OpsReferenceDrawer';
import { OpsExportModal } from './OpsExportModal';
import { LoadCurrentConfigModal } from './LoadCurrentConfigModal';
import { ConfigLoadModal, ConfigLoadResult } from '../common/ConfigLoadModal';
import { validateConfigAgainstSchema } from '../../utils/validator';
import {
  getValueByPath,
  setValueByPath,
  inferSchemaFromJson,
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

  // Helper to get all errors belonging to a specific field
  const getErrorsForField = (field: FieldDefinition): ValidationError[] => {
    return errors.filter(
      (e) => e.path === field.path || e.path.startsWith(`${field.path}[`) || e.path.startsWith(`${field.path}.`)
    );
  };

  // Categories list
  const categories = Array.from(
    new Set(schemaPackage.fields.map((f) => f.category))
  );

  // Error count per category
  const categoryErrorCounts: Record<string, number> = {};
  for (const cat of categories) {
    categoryErrorCounts[cat] = 0;
  }
  for (const err of errors) {
    const field = getFieldForError(err.path);
    if (field && categoryErrorCounts[field.category] !== undefined) {
      categoryErrorCounts[field.category]++;
    }
  }

  // Handle single field change
  const handleFieldChange = (path: string, newVal: any) => {
    const nextConfig = setValueByPath(currentConfig, path, newVal);
    onUpdateConfig(nextConfig);
  };

  // Filter fields
  const filteredFields = schemaPackage.fields.filter((field) => {
    if (activeCategory !== 'all' && field.category !== activeCategory) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    if (
      q &&
      !field.label.toLowerCase().includes(q) &&
      !field.path.toLowerCase().includes(q) &&
      !field.description.toLowerCase().includes(q)
    ) {
      return false;
    }

    if (filterMode === 'errors') {
      return getErrorsForField(field).length > 0;
    }
    if (filterMode === 'dangerous') {
      return Boolean(field.isDangerous);
    }
    if (filterMode === 'modified') {
      const curVal = getValueByPath(currentConfig, field.path);
      if (uploadedOriginalConfig) {
        const origVal = getValueByPath(uploadedOriginalConfig, field.path);
        return JSON.stringify(curVal) !== JSON.stringify(origVal);
      } else if (activeReference?.config) {
        const baseVal = getValueByPath(activeReference.config, field.path);
        return JSON.stringify(curVal) !== JSON.stringify(baseVal);
      }
      const initVal = getValueByPath(initialConfig, field.path);
      return JSON.stringify(curVal) !== JSON.stringify(initVal);
    }

    return true;
  });

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

      {/* Main 2-column Layout: Category Sidebar + Visual Field Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Category Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 block">
              {t.dev.categoriesTitle}
            </span>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
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
                <span className="tabular-nums text-[11px] opacity-75">
                  {schemaPackage.fields.length}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategory === cat;
                const fieldCount = schemaPackage.fields.filter(
                  (f) => f.category === cat
                ).length;
                const errCount = categoryErrorCounts[cat] || 0;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {errCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-950" />
                      )}
                      <span className="tabular-nums text-[11px] opacity-75">
                        {fieldCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick tips for Ops */}
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

        {/* Right Content Area: Filter Toolbar + Field Cards */}
        <div className="lg:col-span-9 space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.ops.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Filter segmented buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.ops.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('modified')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterMode === 'modified'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.ops.filterModified} ({changedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('dangerous')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterMode === 'dangerous'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.ops.filterDangerous}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('errors')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterMode === 'errors'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.ops.filterErrors} ({errors.length})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3.5">
            {filteredFields.map((field) => {
              const curValue = getValueByPath(currentConfig, field.path);
              const fieldErrors = getErrorsForField(field);
              const err = fieldErrors[0];
              const refVal = activeReference
                ? getValueByPath(activeReference.config, field.path)
                : undefined;

              return (
                <OpsFieldRenderer
                  key={field.id}
                  field={field}
                  value={curValue}
                  onChange={(val) => handleFieldChange(field.path, val)}
                  error={err}
                  allErrors={fieldErrors}
                  referenceValue={refVal}
                  referenceName={activeReference?.name}
                />
              );
            })}

            {filteredFields.length === 0 && (
              <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-400">{t.ops.noMatchFields}</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterMode('all');
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
