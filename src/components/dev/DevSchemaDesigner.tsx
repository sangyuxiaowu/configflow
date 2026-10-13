import React, { useState } from 'react';
import {
  Upload,
  Plus,
  BookOpen,
  Download,
  Search,
  Filter,
  SlidersHorizontal,
  ShieldAlert,
  Clock,
  Lock,
  Edit3,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileCode,
  Tag,
  ArrowRight,
  FolderPlus,
  Edit2,
  X,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  ConfigSchemaPackage,
  FieldDefinition,
  ReferenceExample,
  ConfigCategory,
} from '../../types/config';
import { JsonImportModal } from './JsonImportModal';
import { FieldRuleEditor } from './FieldRuleEditor';
import { ReferenceExamplesEditor } from './ReferenceExamplesEditor';
import { SchemaExportModal } from './SchemaExportModal';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';

interface DevSchemaDesignerProps {
  schemaPackage: ConfigSchemaPackage | null;
  onUpdateSchemaPackage: (pkg: ConfigSchemaPackage) => void;
  onSwitchToOpsMode: () => void;
  onLoadShowcaseDemo: () => void;
}

export const DevSchemaDesigner: React.FC<DevSchemaDesignerProps> = ({
  schemaPackage,
  onUpdateSchemaPackage,
  onSwitchToOpsMode,
  onLoadShowcaseDemo,
}) => {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRefExamplesOpen, setIsRefExamplesOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateSchemaModalOpen, setIsCreateSchemaModalOpen] = useState(false);
  const [isEditSchemaInfoOpen, setIsEditSchemaInfoOpen] = useState(false);

  // New schema form state
  const [newSchemaName, setNewSchemaName] = useState(
    language === 'en' ? 'Service Configuration Schema' : '业务系统配置规范'
  );
  const [newSchemaDesc, setNewSchemaDesc] = useState(
    language === 'en'
      ? 'Define operational boundaries, listening ports, and safety policies'
      : '统一约束各服务节点运行参数、网络端口与安全策略'
  );
  const [newSchemaVersion, setNewSchemaVersion] = useState('1.0.0');
  const [newSchemaAuthor, setNewSchemaAuthor] = useState(
    language === 'en' ? 'Architecture Team' : '系统架构委员会'
  );

  // Handle creating a blank schema package
  const handleConfirmCreateSchema = () => {
    if (!newSchemaName.trim()) {
      showToast(language === 'en' ? 'Please enter a schema name' : '请输入规范名称', 'error');
      return;
    }

    const createdPkg: ConfigSchemaPackage = {
      id: `pkg-${Date.now()}`,
      name: newSchemaName.trim(),
      version: newSchemaVersion.trim() || '1.0.0',
      description:
        newSchemaDesc.trim() ||
        (language === 'en' ? 'General service configuration schema' : '通用业务系统配置规范'),
      author:
        newSchemaAuthor.trim() ||
        (language === 'en' ? 'Architecture Team' : '系统架构组'),
      updatedAt: new Date().toISOString().split('T')[0],
      categories: [{ id: 'core', name: language === 'en' ? 'Core Settings' : '基础配置' }],
      fields: [],
      referenceExamples: [],
      defaultConfig: {},
    };

    onUpdateSchemaPackage(createdPkg);
    setIsCreateSchemaModalOpen(false);
    showToast(
      language === 'en'
        ? `Created schema "${createdPkg.name}", please start adding fields`
        : `已成功创建「${createdPkg.name}」，请开始添加配置字段`,
      'success'
    );
  };

  // If no schema is defined yet (empty initial state)
  if (!schemaPackage) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <FileCode className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t.dev.noSchemaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            {t.dev.noSchemaDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{t.dev.importJson}</span>
            </button>

            <button
              onClick={onLoadShowcaseDemo}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.ops.btnLoadShowcase}</span>
            </button>

            <button
              onClick={() => {
                setNewSchemaName(language === 'en' ? 'New Service Config Schema' : '新建业务系统配置规范');
                setNewSchemaDesc(
                  language === 'en'
                    ? 'Define runtime parameters, network ports, and safety limits'
                    : '定义系统运行参数、网络监听端口与安全限制约束'
                );
                setNewSchemaVersion('1.0.0');
                setIsCreateSchemaModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>{t.dev.startFromScratch}</span>
            </button>
          </div>
        </div>

        {/* Modal: Create Blank Schema */}
        {isCreateSchemaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-semibold text-white">
                    {t.dev.createBlankSchema}
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateSchemaModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    * {t.dev.schemaName}
                  </label>
                  <input
                    type="text"
                    value={newSchemaName}
                    onChange={(e) => setNewSchemaName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. Microservice Cluster Spec"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {t.dev.schemaVersion}
                  </label>
                  <input
                    type="text"
                    value={newSchemaVersion}
                    onChange={(e) => setNewSchemaVersion(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-hidden focus:border-indigo-500"
                    placeholder="1.0.0"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {t.dev.schemaAuthor}
                  </label>
                  <input
                    type="text"
                    value={newSchemaAuthor}
                    onChange={(e) => setNewSchemaAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. Architecture Committee"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {t.dev.schemaDesc}
                  </label>
                  <textarea
                    rows={3}
                    value={newSchemaDesc}
                    onChange={(e) => setNewSchemaDesc(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateSchemaModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreateSchema}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  {t.dev.confirmCreate}
                </button>
              </div>
            </div>
          </div>
        )}

        <JsonImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(imported) => {
            onUpdateSchemaPackage({
              id: `pkg-${Date.now()}`,
              name: imported.name,
              version: '1.0.0',
              description: imported.description,
              categories: imported.categories,
              fields: imported.fields,
              defaultConfig: imported.rawJson,
              updatedAt: new Date().toISOString().split('T')[0],
              referenceExamples: [
                {
                  id: `ref-default-${Date.now()}`,
                  name: language === 'en' ? 'Default Baseline Profile' : '默认完整配置方案',
                  environment: 'production',
                  summary: language === 'en' ? 'Baseline extracted from raw JSON' : '从导入的全配置中提取的基准配置',
                  detailedNotes: language === 'en' ? 'Initial baseline config.' : '此方案为开发导入时所提供的初始数据。',
                  config: imported.rawJson,
                },
              ],
            });
            showToast(
              language === 'en'
                ? `Parsed successfully! Created ${imported.fields.length} fields`
                : `成功解析！已建立 ${imported.fields.length} 个配置字段`,
              'success'
            );
          }}
        />
      </div>
    );
  }

  // Filter fields
  const filteredFields = schemaPackage.fields.filter((field) => {
    const matchesCategory =
      selectedCategory === 'all' || field.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      field.label.toLowerCase().includes(q) ||
      field.path.toLowerCase().includes(q) ||
      field.key.toLowerCase().includes(q) ||
      field.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(
    new Set(schemaPackage.fields.map((f) => f.category))
  );

  const handleImportJson = (imported: {
    fields: FieldDefinition[];
    categories: ConfigCategory[];
    rawJson: Record<string, any>;
    name: string;
    description: string;
  }) => {
    const updatedPkg: ConfigSchemaPackage = {
      ...schemaPackage,
      name: imported.name,
      description: imported.description,
      fields: imported.fields,
      categories: imported.categories,
      defaultConfig: imported.rawJson,
      updatedAt: new Date().toISOString().split('T')[0],
      referenceExamples: [
        {
          id: `ref-default-${Date.now()}`,
          name: language === 'en' ? 'Default Baseline Profile' : '默认基线配置方案',
          environment: 'production',
          summary: language === 'en' ? 'Baseline extracted from raw JSON' : '从导入的全配置中提取的基准配置',
          detailedNotes: language === 'en' ? 'Initial baseline config.' : '此方案为开发导入时所提供的初始数据。',
          config: imported.rawJson,
        },
      ],
    };
    onUpdateSchemaPackage(updatedPkg);
    showToast(
      language === 'en'
        ? `Parsed successfully! Identified ${imported.fields.length} fields`
        : `成功解析全量配置！已识别 ${imported.fields.length} 个配置字段`,
      'success'
    );
  };

  const handleSaveField = (updatedField: FieldDefinition) => {
    const exists = schemaPackage.fields.some((f) => f.id === updatedField.id);
    let nextFields: FieldDefinition[];
    if (exists) {
      nextFields = schemaPackage.fields.map((f) =>
        f.id === updatedField.id ? updatedField : f
      );
    } else {
      nextFields = [updatedField, ...schemaPackage.fields];
    }

    const categoryExists = (schemaPackage.categories || []).some(
      (c) => c.name === updatedField.category || c.id === updatedField.category
    );
    const nextCategories = categoryExists
      ? schemaPackage.categories
      : [
          ...(schemaPackage.categories || []),
          { id: updatedField.category, name: updatedField.category, description: `${updatedField.category} config` },
        ];

    onUpdateSchemaPackage({
      ...schemaPackage,
      fields: nextFields,
      categories: nextCategories,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    showToast(
      language === 'en'
        ? `Saved rule for "${updatedField.label || updatedField.path}"`
        : `已保存「${updatedField.label || updatedField.path}」配置规则`,
      'success'
    );
  };

  const handleDeleteField = (fieldId: string, label: string) => {
    const nextFields = schemaPackage.fields.filter((f) => f.id !== fieldId);
    onUpdateSchemaPackage({
      ...schemaPackage,
      fields: nextFields,
    });
    showToast(
      language === 'en' ? `Removed field "${label}"` : `已移除字段「${label}」`,
      'info'
    );
  };

  const handleAddNewField = () => {
    const newFieldId = `field_${Date.now()}`;
    const newField: FieldDefinition = {
      id: newFieldId,
      key: 'port',
      path: 'server.port',
      label: language === 'en' ? 'New Config Field' : '新增配置字段',
      description: language === 'en' ? 'Describe the field purpose and constraints' : '请描述该配置项的业务用途与范围限制',
      category: categories[0] || (language === 'en' ? 'Network' : '基础网络'),
      type: 'port',
      required: true,
      defaultValue: 8080,
      constraints: { min: 1024, max: 65535, unit: 'Port' },
    };
    setEditingField(newField);
  };

  const handleSaveRefExamples = (examples: ReferenceExample[]) => {
    onUpdateSchemaPackage({
      ...schemaPackage,
      referenceExamples: examples,
    });
    showToast(
      language === 'en'
        ? `Saved ${examples.length} reference baseline profiles`
        : `已保存 ${examples.length} 套参考配置样例`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="min-w-0 flex-1 space-y-1">
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

              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 shrink-0">
                <FileCode className="w-2.5 h-2.5 text-indigo-400" />
                <span>{t.nav.devMode}</span>
              </span>

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

              <button
                type="button"
                onClick={() => {
                  setNewSchemaName(schemaPackage.name);
                  setNewSchemaDesc(schemaPackage.description);
                  setNewSchemaVersion(schemaPackage.version);
                  setNewSchemaAuthor(schemaPackage.author || '');
                  setIsEditSchemaInfoOpen(true);
                }}
                className="text-xs text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 border border-transparent hover:border-slate-700 shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                <span className="text-[11px]">{t.dev.editBasicInfo}</span>
              </button>
            </div>

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
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.dev.importJson}</span>
            </button>

            <button
              onClick={() => setIsRefExamplesOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {format(t.dev.referenceProfiles, { count: schemaPackage.referenceExamples.length })}
              </span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.dev.exportPackage}</span>
            </button>

            <button
              onClick={onSwitchToOpsMode}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.dev.previewOpsWorkbench}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Category sidebar + fields list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 block">
              {t.dev.categoriesTitle}
            </span>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
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
                <span className="tabular-nums text-[11px] opacity-75">
                  {schemaPackage.fields.length}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const fieldCount = schemaPackage.fields.filter(
                  (f) => f.category === cat
                ).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="tabular-nums text-[11px] opacity-75">
                      {fieldCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Fields List */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.dev.searchFieldPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleAddNewField}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.dev.addFieldBtn}</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">
                      {field.label}
                    </span>
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
                    onClick={() => setEditingField(field)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.common.edit}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteField(field.id, field.label)}
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
                <p className="text-sm text-slate-300 font-semibold">
                  {t.dev.emptyFieldsTitle}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.dev.emptyFieldsDesc}
                </p>
                <button
                  onClick={handleAddNewField}
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

      {/* Modal: Edit Schema Info */}
      {isEditSchemaInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                {t.dev.editBasicInfo}
              </h3>
              <button
                onClick={() => setIsEditSchemaInfoOpen(false)}
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
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.dev.schemaVersion}
                </label>
                <input
                  type="text"
                  value={newSchemaVersion}
                  onChange={(e) => setNewSchemaVersion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {language === 'en' ? 'Configuration output format' : '配置产出格式'}
                </label>
                <select
                  value={schemaPackage.outputFormat || 'json'}
                  onChange={(e) =>
                    onUpdateSchemaPackage({
                      ...schemaPackage,
                      outputFormat: e.target.value as ConfigSchemaPackage['outputFormat'],
                    })
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
                  value={newSchemaAuthor}
                  onChange={(e) => setNewSchemaAuthor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.dev.schemaDesc}
                </label>
                <textarea
                  rows={3}
                  value={newSchemaDesc}
                  onChange={(e) => setNewSchemaDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditSchemaInfoOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSchemaPackage({
                    ...schemaPackage,
                    name: newSchemaName.trim() || schemaPackage.name,
                    version: newSchemaVersion.trim() || schemaPackage.version,
                    description: newSchemaDesc.trim() || schemaPackage.description,
                    author: newSchemaAuthor.trim() || schemaPackage.author || 'Architecture Team',
                    updatedAt: new Date().toISOString().split('T')[0],
                  });
                  setIsEditSchemaInfoOpen(false);
                  showToast(language === 'en' ? 'Updated schema info' : '已更新规范信息', 'success');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportJson}
      />

      {editingField && (
        <FieldRuleEditor
          field={editingField}
          categories={categories.length > 0 ? categories : ['Core', 'Network']}
          isOpen={true}
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
        />
      )}

      <ReferenceExamplesEditor
        examples={schemaPackage.referenceExamples}
        currentConfig={schemaPackage.defaultConfig}
        isOpen={isRefExamplesOpen}
        onClose={() => setIsRefExamplesOpen(false)}
        onSave={handleSaveRefExamples}
      />

      <SchemaExportModal
        schemaPackage={schemaPackage}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
