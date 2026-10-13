import React, { useState } from 'react';
import {
  Upload,
  BookOpen,
  Download,
  Sparkles,
  Eye,
  FileCode,
  Tag,
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
import { EditSchemaInfoModal } from './EditSchemaInfoModal';
import { SchemaFieldsWorkspace } from './SchemaFieldsWorkspace';
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

      <SchemaFieldsWorkspace
        fields={schemaPackage.fields}
        categories={categories}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onSelectCategory={setSelectedCategory}
        onSearchQueryChange={setSearchQuery}
        onAddField={handleAddNewField}
        onEditField={setEditingField}
        onDeleteField={handleDeleteField}
      />

      {isEditSchemaInfoOpen && (
        <EditSchemaInfoModal
          schemaPackage={schemaPackage}
          name={newSchemaName}
          version={newSchemaVersion}
          description={newSchemaDesc}
          author={newSchemaAuthor}
          onNameChange={setNewSchemaName}
          onVersionChange={setNewSchemaVersion}
          onDescriptionChange={setNewSchemaDesc}
          onAuthorChange={setNewSchemaAuthor}
          onOutputFormatChange={(outputFormat) =>
            onUpdateSchemaPackage({ ...schemaPackage, outputFormat })
          }
          onClose={() => setIsEditSchemaInfoOpen(false)}
          onSave={() => {
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
        />
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
