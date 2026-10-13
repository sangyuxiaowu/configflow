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
  Package,
} from 'lucide-react';
import { resolveSchemaPackageFromJson } from '../../utils/schemaInfer';
import { ConfigSchemaPackage, FieldDefinition, ConfigCategory } from '../../types/config';
import { SHOWCASE_SCHEMA_PACKAGE } from '../../data/mockTemplates';
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

// 供快速测试与体验的标准开发约束规范包样例
const PRESET_SCHEMA_SNIPPETS = [
  {
    name: 'CloudEnterprise 云原生服务平台规范 (全能力约束规范包)',
    desc: '包含端口边界、IP/URL校验、枚举单选、密码脱敏、高危开关与节点对象列表',
    package: SHOWCASE_SCHEMA_PACKAGE,
  },
  {
    name: '分布式集群与工作流引擎约束规范',
    desc: '开发针对集群心跳时序、故障转移重试与服务节点数组定义的约束规范',
    package: {
      id: 'pkg-cluster-workflow',
      name: '分布式集群与工作流引擎约束规范',
      version: '1.2.0',
      description: '开发团队交付的集群参数约束：包含心跳时序、故障转移重试限制与节点对象列表',
      author: '中间件架构组',
      updatedAt: '2026-10-12',
      categories: [
        { id: 'cat_cluster', name: '集群基础运行' },
        { id: 'cat_nodes', name: '计算节点集群列表' },
      ],
      fields: [
        {
          id: 'cluster_name',
          key: 'ClusterName',
          path: 'Cluster.ClusterName',
          label: '集群唯一标识名',
          description: '生产云原生集群的命名标识',
          category: '集群基础运行',
          type: 'string',
          required: true,
          defaultValue: 'prod-cloud-cluster',
          constraints: { minLength: 3, maxLength: 50 },
        },
        {
          id: 'heartbeat_interval',
          key: 'HeartbeatIntervalSeconds',
          path: 'Cluster.HeartbeatIntervalSeconds',
          label: '心跳上报间隔 (秒)',
          description: '节点与中心控制面的探活时序间隔，推荐 15 秒',
          category: '集群基础运行',
          type: 'number',
          required: true,
          defaultValue: 15,
          constraints: { min: 5, max: 120, unit: '秒' },
        },
        {
          id: 'max_retries',
          key: 'MaxFailoverRetries',
          path: 'Cluster.MaxFailoverRetries',
          label: '故障转移重试上限',
          description: '主节点心跳丢失后自动漂移重试的最大次数',
          category: '集群基础运行',
          type: 'number',
          required: true,
          defaultValue: 3,
          constraints: { min: 1, max: 10, unit: '次' },
        },
        {
          id: 'nodes_list',
          key: 'Nodes',
          path: 'Cluster.Nodes',
          label: '计算服务节点集群列表',
          description: '多服务节点对象列表，运维可动态增减节点与调整并发度',
          category: '计算节点集群列表',
          type: 'array_object',
          required: true,
          defaultValue: [
            {
              NodeName: '计算任务主节点-01',
              Host: '192.168.10.21',
              Port: 8081,
              Role: 'Master',
              ConcurrencyLimit: 32,
              EnableAutoScaling: true,
              AssignedQueues: ['high-priority', 'batch-jobs'],
            },
            {
              NodeName: '数据流聚合节点-02',
              Host: '192.168.10.22',
              Port: 8082,
              Role: 'Worker',
              ConcurrencyLimit: 16,
              EnableAutoScaling: true,
              AssignedQueues: ['stream-telemetry'],
            },
          ],
          itemTitleKey: 'NodeName',
          constraints: { minItems: 1, maxItems: 30 },
          itemFields: [
            {
              id: 'node_name',
              key: 'NodeName',
              path: 'NodeName',
              label: '节点标识名',
              description: '服务器节点名称',
              category: '计算节点集群列表',
              type: 'string',
              required: true,
              defaultValue: '新节点',
              constraints: {},
            },
            {
              id: 'node_host',
              key: 'Host',
              path: 'Host',
              label: '内网 IP',
              description: '服务器 IP 地址',
              category: '计算节点集群列表',
              type: 'ip',
              required: true,
              defaultValue: '192.168.1.1',
              constraints: {},
            },
            {
              id: 'node_port',
              key: 'Port',
              path: 'Port',
              label: 'RPC 监听端口',
              description: '通信端口 (1024~65535)',
              category: '计算节点集群列表',
              type: 'port',
              required: true,
              defaultValue: 8080,
              constraints: { min: 1024, max: 65535, unit: 'Port' },
            },
            {
              id: 'node_role',
              key: 'Role',
              path: 'Role',
              label: '角色职责',
              description: '主控节点或工作节点',
              category: '计算节点集群列表',
              type: 'enum',
              required: true,
              defaultValue: 'Worker',
              constraints: {
                options: [
                  { value: 'Master', label: 'Master (主控调度)' },
                  { value: 'Worker', label: 'Worker (计算执行)' },
                  { value: 'Standby', label: 'Standby (热备节点)' },
                ],
              },
            },
            {
              id: 'node_concurrency',
              key: 'ConcurrencyLimit',
              path: 'ConcurrencyLimit',
              label: '最大并发度',
              description: '单个 Worker 承载的最大任务数',
              category: '计算节点集群列表',
              type: 'number',
              required: true,
              defaultValue: 16,
              constraints: { min: 1, max: 128, unit: '并发' },
            },
          ],
        },
      ],
      referenceExamples: [
        {
          id: 'ref-default',
          name: '生产标准双节点基线',
          environment: 'production',
          summary: '一主一从高可用部署基线',
          detailedNotes: '开发交付给运维的推荐标准配置基准。',
          config: {
            Cluster: {
              ClusterName: 'prod-cloud-cluster',
              HeartbeatIntervalSeconds: 15,
              MaxFailoverRetries: 3,
              Nodes: [
                {
                  NodeName: '计算任务主节点-01',
                  Host: '192.168.10.21',
                  Port: 8081,
                  Role: 'Master',
                  ConcurrencyLimit: 32,
                  EnableAutoScaling: true,
                  AssignedQueues: ['high-priority'],
                },
                {
                  NodeName: '数据流聚合节点-02',
                  Host: '192.168.10.22',
                  Port: 8082,
                  Role: 'Worker',
                  ConcurrencyLimit: 16,
                  EnableAutoScaling: true,
                  AssignedQueues: ['stream-telemetry'],
                },
              ],
            },
          },
        },
      ],
      defaultConfig: {
        Cluster: {
          ClusterName: 'prod-cloud-cluster',
          HeartbeatIntervalSeconds: 15,
          MaxFailoverRetries: 3,
          Nodes: [
            {
              NodeName: '计算任务主节点-01',
              Host: '192.168.10.21',
              Port: 8081,
              Role: 'Master',
              ConcurrencyLimit: 32,
              EnableAutoScaling: true,
              AssignedQueues: ['high-priority'],
            },
          ],
        },
      },
    },
  },
];

export const ConfigLoadModal: React.FC<ConfigLoadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  hasExistingSchema = false,
  initialTab = 'upload',
  initialUrl = '',
}) => {
  const { t, format, language } = useI18n();
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
  const [resolvedResult, setResolvedResult] = useState<{
    schemaPackage: ConfigSchemaPackage;
    isStandardSchema: boolean;
    configData: Record<string, any>;
  } | null>(null);

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
        setParseError('文件根节点必须是标准的 JSON Object，不能是顶层数组或普通标量');
        setResolvedResult(null);
        return;
      }

      const res = resolveSchemaPackageFromJson(parsed, fallbackName, srcUrl);
      setResolvedResult(res);
      setParseError(null);
      setSourceType(source);
      setConfigName(res.schemaPackage.name);
      setConfigDesc(res.schemaPackage.description);
    } catch (err: any) {
      setParseError(`JSON 语法解析错误: ${err.message}`);
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
      handleParseJsonString(content, `${baseName} 约束规范`, 'file');
    };
    reader.onerror = () => {
      setParseError('读取本地文件失败，请检查文件权限');
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
    handleParseJsonString(val, '粘贴的配置约束规范', 'paste');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonText(text);
        handleParseJsonString(text, '剪贴板约束规范', 'paste');
      }
    } catch {
      setParseError('无法访问剪贴板，请使用快捷键 Ctrl+V / Cmd+V 直接粘贴到文本框中');
    }
  };

  const handleFormatJson = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: any) {
      setParseError(`无法格式化，JSON 语法有误: ${err.message}`);
    }
  };

  const handleApplyPreset = (snippet: typeof PRESET_SCHEMA_SNIPPETS[0]) => {
    const formatted = JSON.stringify(snippet.package, null, 2);
    setJsonText(formatted);
    handleParseJsonString(formatted, snippet.name, 'paste');
  };

  // Remote URL fetching
  const handleFetchRemote = async (targetUrl?: string) => {
    const url = (targetUrl || remoteUrl).trim();
    if (!url) {
      setFetchError('请输入有效的远程约束规范 URL 地址');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setFetchError('URL 必须以 http:// 或 https:// 开头');
      return;
    }

    setIsFetchingRemote(true);
    setFetchError(null);

    try {
      let data: any = null;

      // 1. Direct fetch with timeout
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json, text/plain, */*' },
        });
        clearTimeout(timer);

        if (res.ok) {
          const text = await res.text();
          data = JSON.parse(text);
        } else {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
      } catch (directErr: any) {
        // 2. CORS fallback
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const proxyController = new AbortController();
          const proxyTimer = setTimeout(() => proxyController.abort(), 8000);
          const proxyRes = await fetch(proxyUrl, { signal: proxyController.signal });
          clearTimeout(proxyTimer);

          if (proxyRes.ok) {
            const proxyText = await proxyRes.text();
            data = JSON.parse(proxyText);
          } else {
            throw new Error('代理中继服务不可用');
          }
        } catch {
          throw directErr;
        }
      }

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('远程返回的内容不是标准的 JSON 键值对对象');
      }

      setLastFetchedUrl(url);
      const urlFileName = url.split('/').pop()?.replace(/\.json$/i, '') || '远程规范';
      const autoName = `${urlFileName.charAt(0).toUpperCase() + urlFileName.slice(1)} 约束规范`;

      const res = resolveSchemaPackageFromJson(data, autoName, url);
      setResolvedResult(res);
      setParseError(null);
      setSourceType('remote');
      setConfigName(res.schemaPackage.name);
      setConfigDesc(res.schemaPackage.description);
    } catch (err: any) {
      setFetchError(
        `拉取失败: ${err.message || '网络连接超时或跨域被阻止 (CORS)'}。您可以将目标链接在浏览器新窗口打开，并将 JSON 复制到「直接粘贴」标签中。`
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
                <h3 className="text-sm font-semibold text-white">
                  点击浏览本地文件 或 将开发交付的 .json 约束文件拖入此处
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  支持开发导出的标准 Schema 规范包（包含字段安全规则、取值范围、单位说明与参考基线）
                </p>

                {uploadedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>已选文件：{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
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
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  快速载入官方标准开发约束规范示例：
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_SCHEMA_SNIPPETS.map((snippet) => (
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
                <span className="text-slate-300 font-medium">
                  粘贴开发交付的约束规范 JSON 内容：
                </span>
                <div className="flex items-center gap-2">
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
                    onClick={handleFormatJson}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>格式化</span>
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
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="w-full p-3.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                placeholder='{\n  "id": "pkg-service-spec",\n  "name": "微服务约束规范",\n  "fields": [ ... ]\n}'
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 3: REMOTE URL FETCH */}
          {activeTab === 'remote' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  输入开发团队或发布中心提供的远程约束规范 (.json) 地址：
                </label>
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
                        <span>正在拉取...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>拉取约束规范</span>
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
                    <span>第三方应用无头嵌入能力 (?load=...)</span>
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
                          <span>已复制嵌入链接</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制嵌入 URL</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  其他系统或工作流平台（如运维发布系统、CMDB）可以通过读取实际运行地址直接嵌入：
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 break-all select-all">
                  {displayAppBaseUrl}?load={remoteUrl.trim() ? encodeURIComponent(remoteUrl.trim()) : '<远程约束文件.json地址>'}
                </div>
                <p className="text-[11px] text-slate-500">
                  嵌入方式加载后，将不展示 Header 和 Footer，仅有纯净的可视化配置生成与合规校验能力。
                </p>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">远程约束文件拉取未成功</p>
                    <p className="text-slate-300/90 leading-relaxed">{fetchError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARSED DATA PREVIEW & SCHEMA SETTINGS */}
          {resolvedResult && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-800/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">
                    {resolvedResult.isStandardSchema
                      ? '✓ 标准开发约束规范包解析成功'
                      : '✓ 配置文件解析完成（已推断基础约束模型）'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <span className="text-slate-400">字段约束项:</span>
                    <strong className="text-white">
                      {resolvedResult.schemaPackage.fields.length} 个
                    </strong>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <span className="text-slate-400">参考方案:</span>
                    <strong className="text-white">
                      {resolvedResult.schemaPackage.referenceExamples.length} 个
                    </strong>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <span className="text-slate-400">分类分组:</span>
                    <strong className="text-white">
                      {resolvedResult.schemaPackage.categories.length} 个
                    </strong>
                  </span>
                </div>
              </div>

              {/* Editable Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    约束规范名称
                  </label>
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="例如：微服务核心运行约束规范"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    适用范围与交付说明
                  </label>
                  <input
                    type="text"
                    value={configDesc}
                    onChange={(e) => setConfigDesc(e.target.value)}
                    placeholder="简述此约束规范适用的业务系统与环境"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notice regarding constraints */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  载入后，运维端将严格依据此规范进行配置生成，内置实时校验防护与基线对照。
                </span>
              </div>
            </div>
          )}

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
            <span className="hidden sm:inline">
              规范交付给运维后，运维可在表单中安全合规填写参数，并一键审查导出生产配置
            </span>
            <span className="sm:hidden">
              合规校验与安全配置保障
            </span>
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
