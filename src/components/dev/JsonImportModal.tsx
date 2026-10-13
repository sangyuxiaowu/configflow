import React, { useState, useRef } from 'react';
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
  Info,
  Layers,
} from 'lucide-react';
import { inferSchemaFromJson } from '../../utils/schemaInfer';
import { ConfigFormat, detectConfigFormat, detectConfigFormatFromContent, parseConfigText, stringifyConfig } from '../../utils/configFormats';
import { FieldDefinition, ConfigCategory } from '../../types/config';
import { fetchRemoteResource } from '../../utils/remoteConfig';
import { PRESET_RAW_CONFIGS } from '../../data/rawConfigPresets';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imported: {
    fields: FieldDefinition[];
    categories: ConfigCategory[];
    rawJson: Record<string, any>;
    name: string;
    description: string;
  }) => void;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'remote'>('paste');
  const [configFormat, setConfigFormat] = useState<ConfigFormat>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Paste state
  const [jsonText, setJsonText] = useState(
    JSON.stringify(PRESET_RAW_CONFIGS[0].json, null, 2)
  );

  // Remote state
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Parsed raw JSON object
  const [parsedRawJson, setParsedRawJson] = useState<Record<string, any> | null>(
    PRESET_RAW_CONFIGS[0].json
  );
  const [parseError, setParseError] = useState<string | null>(null);

  // Schema metadata
  const [schemaName, setSchemaName] = useState('分布式集群配置规范');
  const [schemaDesc, setSchemaDesc] = useState(
    '根据原始业务配置解析生成，定义节点集群、网络端口与故障转移约束'
  );

  if (!isOpen) return null;

  // Validate and parse raw JSON
  const handleParseString = (
    text: string,
    defaultName?: string,
    defaultDesc?: string,
    format: ConfigFormat = configFormat
  ) => {
    if (!text.trim()) {
      setParsedRawJson(null);
      setParseError(null);
      return;
    }

    try {
      const parsed = parseConfigText(text, format);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError('原始配置必须是顶层键值对对象，不能是数组或单一基础类型');
        setParsedRawJson(null);
        return;
      }

      setParsedRawJson(parsed);
      setParseError(null);
      if (defaultName) setSchemaName(defaultName);
      if (defaultDesc) setSchemaDesc(defaultDesc);
    } catch (err: any) {
      setParseError(`${format.toUpperCase()} 语法解析错误: ${err.message}`);
      setParsedRawJson(null);
    }
  };

  // Upload file handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    const format = detectConfigFormat(file.name);
    setConfigFormat(format);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setJsonText(content);
      handleParseString(
        content,
        `${baseName} 约束规范`,
        `从原始文件「${file.name}」解析，供定制字段规则`,
        format
      );
    };
    reader.onerror = () => {
      setParseError('读取本地文件失败');
      setParsedRawJson(null);
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
    const format = detectConfigFormatFromContent(val);
    setConfigFormat(format);
    setJsonText(val);
    handleParseString(val, undefined, undefined, format);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const format = detectConfigFormatFromContent(text);
        setConfigFormat(format);
        setJsonText(text);
        handleParseString(text, '剪贴板配置规范', '从剪贴板粘贴的原始配置解析而来', format);
      }
    } catch {
      setParseError('无法访问剪贴板，请使用 Ctrl+V / Cmd+V 直接粘贴');
    }
  };

  const handleFormatConfig = () => {
    if (!jsonText.trim()) return;
    const format = detectConfigFormatFromContent(jsonText, configFormat);
    try {
      const parsed = parseConfigText(jsonText, format);
      setJsonText(stringifyConfig(parsed, format));
      setConfigFormat(format);
      setParseError(null);
    } catch (err: any) {
      setParseError(`无法格式化，${format.toUpperCase()} 语法有误: ${err.message}`);
    }
  };

  const handleApplyPreset = (snippet: typeof PRESET_RAW_CONFIGS[0]) => {
    const formatted = JSON.stringify(snippet.json, null, 2);
    setConfigFormat('json');
    setJsonText(formatted);
    setSchemaName(snippet.name.split(' (')[0] + ' 约束规范');
    setSchemaDesc(snippet.desc);
    handleParseString(
      formatted,
      snippet.name.split(' (')[0] + ' 约束规范',
      snippet.desc,
      'json'
    );
  };

  // Remote URL fetch
  const handleFetchRemote = async () => {
    const url = remoteUrl.trim();
    if (!url) {
      setFetchError('请输入原始配置文件的 URL 地址');
      return;
    }

    setIsFetchingRemote(true);
    setFetchError(null);

    try {
      const format = detectConfigFormat(url);
      const data = await fetchRemoteResource(
        url,
        (text) => parseConfigText(text, format),
        8000,
        { Accept: 'application/json, application/yaml, text/plain, */*' }
      );

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('远程返回的数据不是标准的键值对配置对象');
      }

      setConfigFormat(format);
      const formatted = stringifyConfig(data, format);
      setJsonText(formatted);
      const urlFileName = url.split('/').pop()?.replace(/\.(json|ya?ml|properties|env)$/i, '') || '远程原始配置';
      const autoName = `${urlFileName.charAt(0).toUpperCase() + urlFileName.slice(1)} 约束规范`;
      const autoDesc = `从远程原始配置抓取: ${url}`;

      setParsedRawJson(data);
      setSchemaName(autoName);
      setSchemaDesc(autoDesc);
      setParseError(null);
    } catch (err: any) {
      setFetchError(
        `拉取失败: ${err.message || '网络连接超时或跨域被阻止 (CORS)'}。您可以将配置内容直接复制到「直接粘贴」标签中。`
      );
    } finally {
      setIsFetchingRemote(false);
    }
  };

  // Confirm and infer schema
  const handleConfirm = () => {
    if (!parsedRawJson) return;

    // 逆向解析原始业务配置 JSON，推断字段路径、嵌套层级与对象数组
    const { fields, categories } = inferSchemaFromJson(parsedRawJson);

    onImport({
      fields,
      categories,
      rawJson: parsedRawJson,
      name: schemaName.trim() || '业务配置规范',
      description: schemaDesc.trim() || '从原始配置自动解析生成',
    });
    onClose();
  };

  // Stats
  const topKeysCount = parsedRawJson ? Object.keys(parsedRawJson).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>提供原始全配置 · 自动构建规则模型</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              开发端：提供生产或开发环境的原始全量业务配置，系统将自动逆向分析层级路径与对象数组，进入工作台定制字段规则与安全边界
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
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'paste'
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>直接粘贴原始配置</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>本地上传配置文件</span>
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
              <span>远程 URL 获取原始配置</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  快速加载经典原始业务配置样例：
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_RAW_CONFIGS.map((snippet) => (
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
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  粘贴业务系统原始配置内容：
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400" aria-live="polite">
                    {jsonText.trim() ? `已识别：${configFormat.toUpperCase()}` : '自动识别配置格式'}
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>剪贴板粘贴</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFormatConfig}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>格式化</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="w-full p-3.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                placeholder={configFormat === 'yaml' ? 'serviceName: api-gateway\nport: 8080' : configFormat === 'properties' ? 'serviceName=api-gateway\nserver.port=8080' : configFormat === 'env' ? 'SERVICE_NAME=api-gateway\nSERVER__PORT=8080' : '{\n  "serviceName": "api-gateway",\n  "port": 8080\n}'}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.yaml,.yml,.properties,.env,application/json,text/yaml,text/plain"
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
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-800 hover:border-indigo-600/60 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  点击浏览本地 JSON、YAML、Properties 或 ENV 配置文件
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  系统将以此文件作为初始基准配置，逆向推导所有字段路径并建立字段规则
                </p>

                {uploadedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>已选文件：{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REMOTE */}
          {activeTab === 'remote' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  输入远程原始配置文件公开链接（按扩展名识别格式）：
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/.../config.yml"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchRemote}
                    disabled={isFetchingRemote || !remoteUrl.trim()}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isFetchingRemote ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>拉取中...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>抓取原始配置</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{fetchError}</span>
                </div>
              )}
            </div>
          )}

          {/* Schema Metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                欲生成的配置规范名称
              </label>
              <input
                type="text"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="例如：微服务核心运行约束规范"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                规范用途与适用系统说明
              </label>
              <input
                type="text"
                value={schemaDesc}
                onChange={(e) => setSchemaDesc(e.target.value)}
                placeholder="简述该规范的约束范围"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Validation Status */}
          {parsedRawJson && (
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>原始配置解析合法 · 包含 {topKeysCount} 个根级业务对象</span>
              </div>
              <span className="text-slate-400">
                将进入开发设计台为每个字段制定规则
              </span>
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>自动逆向推断层级与列表模板，导入后即可在可视化卡片中配置范围约束与单位</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!parsedRawJson}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>解析并开始设计字段规则</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
