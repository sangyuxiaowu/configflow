import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useI18n } from '../../i18n';

interface LoadCurrentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: Record<string, any>, sourceName: string) => void;
}

export const LoadCurrentConfigModal: React.FC<LoadCurrentConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab: 'upload' | 'paste'
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    data: Record<string, any>;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Paste state
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteParsedData, setPasteParsedData] = useState<Record<string, any> | null>(null);

  if (!isOpen) return null;

  // Process and validate JSON text
  const parseJsonContent = (
    text: string,
    source: 'upload' | 'paste'
  ): Record<string, any> | null => {
    try {
      if (!text.trim()) {
        throw new Error(
          language === 'en'
            ? 'Configuration content is empty, please input valid JSON text'
            : '配置内容为空，请输入有效的 JSON 文本'
        );
      }

      const parsed = JSON.parse(text);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(
          language === 'en'
            ? 'Configuration file must be a top-level JSON key-value object'
            : '配置文件必须为顶层 JSON 键值对对象 (Key-Value Object)，不支持顶级数组或单一基础类型'
        );
      }

      const keyCount = Object.keys(parsed).length;
      if (keyCount === 0) {
        throw new Error(
          language === 'en'
            ? 'Parsed JSON object does not contain any configuration keys'
            : '解析到的 JSON 对象中未包含任何配置参数'
        );
      }

      if (source === 'upload') {
        setUploadError(null);
      } else {
        setPasteError(null);
        setPasteParsedData(parsed);
      }
      return parsed;
    } catch (err: any) {
      const errMsg =
        err.message ||
        (language === 'en'
          ? 'Failed to parse JSON syntax, please check format'
          : 'JSON 语法解析失败，请检查格式是否规范');
      if (source === 'upload') {
        setUploadError(errMsg);
        setUploadedFile(null);
      } else {
        setPasteError(errMsg);
        setPasteParsedData(null);
      }
      return null;
    }
  };

  // Handle file reading
  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setUploadError(
        language === 'en'
          ? 'Only .json format configuration files are supported'
          : '仅支持上传 .json 格式的配置文件'
      );
      setUploadedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseJsonContent(text, 'upload');
      if (data) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          data,
        });
      }
    };
    reader.onerror = () => {
      setUploadError(language === 'en' ? 'Failed to read file' : '读取文件失败');
      setUploadedFile(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handlePasteChange = (val: string) => {
    setPasteContent(val);
    if (val.trim()) {
      parseJsonContent(val, 'paste');
    } else {
      setPasteError(null);
      setPasteParsedData(null);
    }
  };

  const handleFormatPaste = () => {
    if (pasteParsedData) {
      setPasteContent(JSON.stringify(pasteParsedData, null, 2));
      showToast(language === 'en' ? 'JSON formatted' : 'JSON 已格式化美化', 'info');
    }
  };

  // Confirm load
  const canConfirm =
    activeTab === 'upload' ? Boolean(uploadedFile) : Boolean(pasteParsedData);

  const handleConfirm = () => {
    if (activeTab === 'upload' && uploadedFile) {
      onConfirm(uploadedFile.data, uploadedFile.name);
      onClose();
    } else if (activeTab === 'paste' && pasteParsedData) {
      const sourceName = language === 'en' ? 'Pasted Config JSON' : '手动粘贴的配置 JSON';
      onConfirm(pasteParsedData, sourceName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {t.loadConfigModal.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.loadConfigModal.subtitle}
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

        {/* Tab switch */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-emerald-500 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.loadConfigModal.tabFile}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'border-emerald-500 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{t.loadConfigModal.tabPaste}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drop area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  {t.loadConfigModal.dragDropText}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'en'
                    ? 'Supports standard production configs (e.g. config.json, app.json, settings.json)'
                    : '支持标准生产环境配置文件 (如 config.json、app.json、settings.json)'}
                </p>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Success Card */}
              {uploadedFile && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-900/50 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {uploadedFile.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80 mt-0.5">
                        {language === 'en'
                          ? `Parsed successfully · Contains ${Object.keys(uploadedFile.data).length} top-level keys`
                          : `成功解析 · 包含 ${Object.keys(uploadedFile.data).length} 个顶层配置分组/参数`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setUploadError(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.loadConfigModal.pasteLabel}</span>
                <div className="flex items-center gap-2">
                  {pasteParsedData && (
                    <button
                      type="button"
                      onClick={handleFormatPaste}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t.opsExport.prettyJson}</span>
                    </button>
                  )}
                  {pasteContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setPasteContent('');
                        setPasteError(null);
                        setPasteParsedData(null);
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      {t.common.reset}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={pasteContent}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={'{\n  "server": {\n    "port": 8080,\n    "host": "0.0.0.0"\n  }\n}'}
                rows={10}
                className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 leading-relaxed"
              />

              {pasteError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pasteError}</span>
                </div>
              )}

              {pasteParsedData && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'en'
                      ? `Valid JSON · Detected ${Object.keys(pasteParsedData).length} top-level configuration keys`
                      : `JSON 语法有效 · 已检测到 ${Object.keys(pasteParsedData).length} 个顶层配置分组/参数`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tips note */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-emerald-400 font-semibold mr-1">
              {language === 'en' ? '💡 Diff Tracking Notice:' : '💡 对照修改提示：'}
            </span>
            {language === 'en'
              ? 'Once loaded, values will populate the visual editor as the "Original" baseline for tracking all changes.'
              : '载入后，配置参数将填入当前运维编辑工作台，并作为「修改前 (原始值)」进行变动追踪。在审查导出面板中，可随时对比原始值与参考基准方案。'}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              canConfirm
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {language === 'en' ? 'Confirm & Set as Baseline' : '确认载入并作为原始值'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
