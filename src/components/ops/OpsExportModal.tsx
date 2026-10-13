import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileJson,
  GitCompare,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  FieldDefinition,
  ValidationError,
} from '../../types/config';
import { getValueByPath } from '../../utils/schemaInfer';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';

interface OpsExportModalProps {
  currentConfig: Record<string, any>;
  uploadedOriginalConfig?: Record<string, any> | null;
  uploadedConfigName?: string | null;
  baselineConfig?: Record<string, any> | null;
  baselineName?: string | null;
  fields: FieldDefinition[];
  errors: ValidationError[];
  isOpen: boolean;
  onClose: () => void;
}

export const OpsExportModal: React.FC<OpsExportModalProps> = ({
  currentConfig,
  uploadedOriginalConfig,
  uploadedConfigName,
  baselineConfig,
  baselineName,
  fields,
  errors,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const { t, language } = useI18n();

  // 判断是否存在基准值与原始值
  const hasBaseline = Boolean(
    baselineConfig &&
      typeof baselineConfig === 'object' &&
      Object.keys(baselineConfig).length > 0
  );

  const hasUploadedOriginal = Boolean(
    uploadedOriginalConfig &&
      typeof uploadedOriginalConfig === 'object' &&
      Object.keys(uploadedOriginalConfig).length > 0
  );

  // 如果基准值与用户上传的原始值都没有，则不可切换变更对比
  const canCompare = hasBaseline || hasUploadedOriginal;

  // Active tab: 如果不可对比，直接强制为 'json' 最终预览
  const [activeTab, setActiveTab] = useState<'diff' | 'json'>(() =>
    canCompare ? 'diff' : 'json'
  );

  // 当外部数据或对比能力变动时同步确保非对比态直接进入 json
  useEffect(() => {
    if (!canCompare) {
      setActiveTab('json');
    }
  }, [canCompare]);

  const [copied, setCopied] = useState(false);
  const [diffFilter, setDiffFilter] = useState<'changed' | 'all'>('changed');
  const [diffSearch, setDiffSearch] = useState('');

  // 格式化输出最终生产 JSON
  const jsonString = useMemo(() => {
    return JSON.stringify(currentConfig, null, 2);
  }, [currentConfig]);

  // 计算多维字段对比数据
  const comparisonItems = useMemo(() => {
    if (!canCompare) return [];

    return fields.map((field) => {
      const curVal = getValueByPath(currentConfig, field.path);
      const origVal = hasUploadedOriginal
        ? getValueByPath(uploadedOriginalConfig, field.path)
        : undefined;
      const baseVal = hasBaseline
        ? getValueByPath(baselineConfig, field.path)
        : undefined;

      // 变动判定：优先对比用户上传的原值；若无原值则对比基准值
      let isChanged = false;
      if (hasUploadedOriginal) {
        isChanged = JSON.stringify(curVal) !== JSON.stringify(origVal);
      } else if (hasBaseline) {
        isChanged = JSON.stringify(curVal) !== JSON.stringify(baseVal);
      }

      // 是否与基准一致
      const matchesBaseline =
        hasBaseline && JSON.stringify(curVal) === JSON.stringify(baseVal);

      return {
        field,
        path: field.path,
        label: field.label,
        category: field.category,
        isDangerous: field.isDangerous,
        isSensitive: field.isSensitive,
        baseVal,
        origVal,
        curVal,
        isChanged,
        matchesBaseline,
      };
    });
  }, [
    canCompare,
    fields,
    currentConfig,
    uploadedOriginalConfig,
    baselineConfig,
    hasUploadedOriginal,
    hasBaseline,
  ]);

  // 变动的项目总数
  const changedItemsCount = useMemo(() => {
    return comparisonItems.filter((item) => item.isChanged).length;
  }, [comparisonItems]);

  // 筛选后的对比行
  const filteredComparisonItems = useMemo(() => {
    return comparisonItems.filter((item) => {
      if (diffFilter === 'changed' && !item.isChanged) {
        return false;
      }
      if (diffSearch.trim()) {
        const q = diffSearch.trim().toLowerCase();
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchPath = item.path.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchLabel && !matchPath && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [comparisonItems, diffFilter, diffSearch]);

  if (!isOpen) return null;

  const isEmbedded =
    typeof window !== 'undefined' &&
    window.parent &&
    window.parent !== window;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    showToast(t.opsExport.copiedSuccess, 'success');
    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: 'OPS_CONFIG_EXPORT',
          action: 'copy',
          config: currentConfig,
          timestamp: Date.now(),
        },
        '*'
      );
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `config.production.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.opsExport.downloadedSuccess, 'success');
    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: 'OPS_CONFIG_EXPORT',
          action: 'download',
          config: currentConfig,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  const handleSyncToHost = () => {
    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: 'OPS_CONFIG_SAVE',
          action: 'save',
          config: currentConfig,
          timestamp: Date.now(),
        },
        '*'
      );
      showToast(
        language === 'en'
          ? 'Sent configuration to host (postMessage: OPS_CONFIG_SAVE)'
          : '已向宿主应用发送最新配置 (postMessage: OPS_CONFIG_SAVE)',
        'success'
      );
    }
  };

  // 单元格渲染通用辅助函数
  const renderValueCell = (
    val: any,
    isSensitive?: boolean,
    isChangedTarget?: boolean
  ) => {
    if (val === undefined) {
      return (
        <span className="text-slate-500 italic text-[11px] block select-none">
          - ({language === 'en' ? 'unset' : '未配置'})
        </span>
      );
    }
    if (val === null) {
      return <span className="font-mono text-slate-400 text-[11px]">null</span>;
    }
    if (isSensitive) {
      return (
        <span className="font-mono text-amber-400 text-[11px] flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span>••••••••</span>
        </span>
      );
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold ${
            val
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return (
        <span
          className={`font-mono text-[11px] ${
            isChangedTarget ? 'text-emerald-300 font-semibold' : 'text-indigo-300'
          }`}
        >
          {val}
        </span>
      );
    }
    if (typeof val === 'string') {
      return (
        <span
          className={`font-mono text-[11px] truncate block ${
            isChangedTarget ? 'text-emerald-300 font-medium' : 'text-slate-200'
          }`}
          title={val}
        >
          "{val}"
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <span
          className="font-mono text-cyan-300 text-[11px] truncate block"
          title={JSON.stringify(val)}
        >
          [Array({val.length})]
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <span
          className="font-mono text-purple-300 text-[11px] truncate block"
          title={JSON.stringify(val)}
        >
          {'{...}'}
        </span>
      );
    }
    return (
      <span className="font-mono text-slate-300 text-[11px] truncate block">
        {String(val)}
      </span>
    );
  };

  const isFourCols = hasBaseline && hasUploadedOriginal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {t.opsExport.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.opsExport.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Status Banner & Tab Switcher */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {errors.length === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-medium">
                  {t.opsExport.passedDesc}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-medium">
                  {language === 'en'
                    ? `Found ${errors.length} parameters not satisfying rules. Please review carefully!`
                    : `存在 ${errors.length} 项参数未满足开发约束，导出请务必谨慎！`}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 变更对比 Tab 按钮 */}
            <button
              type="button"
              disabled={!canCompare}
              onClick={() => canCompare && setActiveTab('diff')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                !canCompare
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800/80'
                  : activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{t.ops.changesTitle}</span>
              {canCompare && (
                <span className="text-[10px] bg-indigo-950 text-indigo-200 px-1.5 py-0.2 rounded-full border border-indigo-700/60 font-mono">
                  {changedItemsCount}
                </span>
              )}
            </button>

            {/* 最终 JSON 预览 Tab 按钮 */}
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'JSON Preview' : '最终 JSON 预览'}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'diff' && canCompare ? (
            <div className="space-y-4">
              {/* 工具条：搜索与筛选 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-medium text-slate-300">
                    {language === 'en' ? 'Diff Sources:' : '对照来源说明：'}
                  </span>
                  {hasBaseline && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                      {t.common.baseline}: {baselineName || 'Default'}
                    </span>
                  )}
                  {hasUploadedOriginal && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                      {t.ops.originalValue}: {uploadedConfigName || 'Current Config'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={diffSearch}
                      onChange={(e) => setDiffSearch(e.target.value)}
                      placeholder={language === 'en' ? 'Search diff fields...' : '搜索对比字段...'}
                      className="pl-7 pr-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDiffFilter('changed')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        diffFilter === 'changed'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.ops.filterModified} ({changedItemsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiffFilter('all')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        diffFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.ops.filterAll} ({comparisonItems.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* 对比表格 */}
              {filteredComparisonItems.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <div className={`${isFourCols ? 'col-span-3' : 'col-span-4'}`}>
                      {language === 'en' ? 'Field / Path' : '配置参数 / 路径'}
                    </div>
                    {hasBaseline && (
                      <div className={`${isFourCols ? 'col-span-3' : 'col-span-4'}`}>
                        {language === 'en' ? 'Baseline Preset' : '参考基准方案'}
                      </div>
                    )}
                    {hasUploadedOriginal && (
                      <div className={`${isFourCols ? 'col-span-3' : 'col-span-4'}`}>
                        {language === 'en' ? 'Original Value' : '修改前 (原值)'}
                      </div>
                    )}
                    <div className={`${isFourCols ? 'col-span-3' : 'col-span-4'}`}>
                      {language === 'en' ? 'Current (New Value)' : '修改后 (当前值)'}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/60 max-h-[50vh] overflow-y-auto">
                    {filteredComparisonItems.map((item) => {
                      return (
                        <div
                          key={item.path}
                          className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors ${
                            item.isChanged
                              ? 'bg-emerald-950/15 hover:bg-emerald-950/25'
                              : 'hover:bg-slate-900/60'
                          }`}
                        >
                          {/* 字段名与路径 */}
                          <div
                            className={`${
                              isFourCols ? 'col-span-3' : 'col-span-4'
                            } pr-2`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white truncate">
                                {item.label}
                              </span>
                              {item.isDangerous && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              )}
                              {item.isChanged && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold shrink-0">
                                  {t.ops.modifiedTag}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {item.path}
                            </span>
                          </div>

                          {/* 基准值列 */}
                          {hasBaseline && (
                            <div
                              className={`${
                                isFourCols ? 'col-span-3' : 'col-span-4'
                              } pr-2`}
                            >
                              {renderValueCell(item.baseVal, item.isSensitive)}
                            </div>
                          )}

                          {/* 修改前 (原始值) 列 */}
                          {hasUploadedOriginal && (
                            <div
                              className={`${
                                isFourCols ? 'col-span-3' : 'col-span-4'
                              } pr-2`}
                            >
                              {renderValueCell(item.origVal, item.isSensitive)}
                            </div>
                          )}

                          {/* 修改后 (当前值) 列 */}
                          <div
                            className={`${
                              isFourCols ? 'col-span-3' : 'col-span-4'
                            } ${
                              item.isChanged
                                ? 'bg-emerald-950/20 px-2 py-1 rounded border border-emerald-800/40'
                                : ''
                            }`}
                          >
                            {renderValueCell(
                              item.curVal,
                              item.isSensitive,
                              item.isChanged
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/20 rounded-xl border border-slate-800/60">
                  {diffFilter === 'changed'
                    ? (language === 'en'
                        ? 'Current configuration is identical to comparison source; no parameter changes detected.'
                        : '当前配置与对比源完全一致，未检测到任何参数变动')
                    : (language === 'en'
                        ? 'No configuration parameters matching the search query.'
                        : '未找到匹配搜索条件的配置参数')}
                </div>
              )}
            </div>
          ) : (
            /* 最终 JSON 预览模式 */
            <div className="space-y-2">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
                <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-800/50">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">
            {language === 'en'
              ? 'Ready. All parameters strictly adhere to developer constraints.'
              : '已就绪，所有参数均已遵循开发设定的安全约束'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? t.common.copied : t.opsExport.copyBtn}
            </button>
            {isEmbedded && (
              <button
                type="button"
                onClick={handleSyncToHost}
                className="px-3 py-2 text-xs font-medium text-sky-200 bg-sky-950/70 hover:bg-sky-900/70 border border-sky-800/60 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>{language === 'en' ? 'Sync to Host App' : '广播至宿主应用'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              {t.opsExport.downloadBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
