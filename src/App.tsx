import React, { useState, useEffect } from 'react';
import {
  Code2,
  Wrench,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Globe,
  Upload,
} from 'lucide-react';
import { ConfigSchemaPackage } from './types/config';
import { getShowcaseSchemaPackage } from './data/mockTemplates';
import { DevSchemaDesigner } from './components/dev/DevSchemaDesigner';
import { OpsVisualEditor } from './components/ops/OpsVisualEditor';
import { ToastProvider, useToast } from './components/common/Toast';
import { inferSchemaFromJson, resolveSchemaPackageFromJson } from './utils/schemaInfer';
import { ConfigLoadModal, ConfigLoadResult } from './components/common/ConfigLoadModal';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { I18nProvider, useI18n, LanguageSwitcher } from './i18n';

/**
 * 提取 URL query 中的远程加载参数 (?load=https://xxx.json)
 */
function getRemoteLoadUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. 优先检查标准 search 参数
  const searchParams = new URLSearchParams(window.location.search);
  const searchParam =
    searchParams.get('load') ||
    searchParams.get('config') ||
    searchParams.get('url');
  if (searchParam && searchParam.trim()) {
    return searchParam.trim();
  }

  // 2. 检查 hash 中的 query 参数 (如 #/?load=...)
  const hash = window.location.hash;
  if (hash && hash.includes('?')) {
    const hashQuery = hash.substring(hash.indexOf('?') + 1);
    const hashParams = new URLSearchParams(hashQuery);
    const hashParam =
      hashParams.get('load') ||
      hashParams.get('config') ||
      hashParams.get('url');
    if (hashParam && hashParam.trim()) {
      return hashParam.trim();
    }
  }

  return null;
}

export function AppContent() {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();

  // 检测是否为第三方远程加载模式 (?load=https://xxx.json)
  const [remoteUrl, setRemoteUrl] = useState<string | null>(() => getRemoteLoadUrl());
  const isRemoteMode = Boolean(remoteUrl);

  // Active workspace mode: 'ops' (运维编辑端) or 'dev' (开发规则设计端)
  const [activeMode, setActiveMode] = useState<'ops' | 'dev'>('ops');

  // 初始化为空，不展示默认业务数据
  const [schemaPackage, setSchemaPackage] = useState<ConfigSchemaPackage | null>(null);

  // Active configuration being edited by Ops
  const [currentOpsConfig, setCurrentOpsConfig] = useState<Record<string, any>>({});

  // 远程加载状态管理
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(isRemoteMode);
  const [remoteLoadError, setRemoteLoadError] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // 远程拉取配置核心函数
  const loadRemoteConfigFromUrl = async (targetUrl: string) => {
    setIsLoadingRemote(true);
    setRemoteLoadError(null);

    try {
      let data: any = null;

      // 尝试 1：直接 fetch
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(targetUrl, {
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
        // 尝试 2：跨域代理中继 fallback
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
          const proxyController = new AbortController();
          const proxyTimer = setTimeout(() => proxyController.abort(), 9000);
          const proxyRes = await fetch(proxyUrl, { signal: proxyController.signal });
          clearTimeout(proxyTimer);

          if (proxyRes.ok) {
            const proxyText = await proxyRes.text();
            data = JSON.parse(proxyText);
          } else {
            throw new Error(t.remote.proxyFailed);
          }
        } catch {
          throw directErr;
        }
      }

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error(t.remote.notStandardJsonObject);
      }

      // 智能识别开发交付的约束规范包 (ConfigSchemaPackage) 或从普通 JSON 推断规范
      const urlFileName =
        targetUrl.split('/').pop()?.replace(/\.json$/i, '') ||
        (language === 'en' ? 'Remote Schema' : '远程约束规范');
      const capitalizedName =
        urlFileName.charAt(0).toUpperCase() + urlFileName.slice(1);

      const defaultSpecTitle =
        language === 'en'
          ? `${capitalizedName} Schema Spec`
          : `${capitalizedName} 约束规范`;

      const { schemaPackage: resolvedPkg, configData, isStandardSchema } =
        resolveSchemaPackageFromJson(data, defaultSpecTitle, targetUrl);

      setSchemaPackage(resolvedPkg);
      setCurrentOpsConfig(configData);
      setIsLoadingRemote(false);
      showToast(
        isStandardSchema
          ? format(t.remote.loadSuccessStandard, { name: resolvedPkg.name })
          : format(t.remote.loadSuccessInferred, { name: capitalizedName }),
        'success'
      );
    } catch (err: any) {
      setIsLoadingRemote(false);
      setRemoteLoadError(
        err.message ||
          (language === 'en'
            ? 'Connection timeout or remote service does not allow cross-origin (CORS) access'
            : '网络连接超时或远程服务未开放跨域 (CORS) 访问')
      );
      showToast(t.remote.loadFailedToast, 'error');
    }
  };

  // 监听初始 URL 参数
  useEffect(() => {
    const url = getRemoteLoadUrl();
    if (url) {
      setRemoteUrl(url);
      loadRemoteConfigFromUrl(url);
    }
  }, []);

  // 加载全能力演示示例 (根据当前语言动态适配)
  const handleLoadShowcaseDemo = () => {
    const demoPkg = JSON.parse(JSON.stringify(getShowcaseSchemaPackage(language)));
    setSchemaPackage(demoPkg);
    setCurrentOpsConfig(JSON.parse(JSON.stringify(demoPkg.defaultConfig)));
    showToast(t.workspace.demoLoaded, 'success');
  };

  // 清空重置回初始状态
  const handleClearAll = () => {
    setSchemaPackage(null);
    setCurrentOpsConfig({});
    showToast(t.workspace.clearedState, 'info');
  };

  // 手动载入确认处理
  const handleManualImportConfirm = (result: ConfigLoadResult) => {
    setSchemaPackage(result.schemaPackage);
    setCurrentOpsConfig(JSON.parse(JSON.stringify(result.rawJson)));
    setRemoteLoadError(null);
    showToast(
      result.isStandardSchema
        ? format(t.workspace.schemaLoadedStandard, { name: result.name })
        : format(t.workspace.schemaLoadedInferred, { name: result.name }),
      'success'
    );
  };

  // 1. 远程模式下的加载中界面
  if (isRemoteMode && isLoadingRemote) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/70 border border-indigo-800/50 flex items-center justify-center mx-auto text-indigo-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t.remote.loadingTitle}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.remote.loadingDesc}
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-left">
            <span className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>{t.remote.targetUrl}</span>
            </span>
            <p className="text-xs font-mono text-indigo-300 break-all select-all leading-relaxed">
              {remoteUrl}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. 远程模式下的加载失败容错界面
  if (isRemoteMode && remoteLoadError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t.remote.loadFailedTitle}
            </h2>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              {remoteLoadError}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-left">
            <span className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{t.remote.requestUrl}</span>
            </span>
            <p className="text-xs font-mono text-slate-300 break-all leading-relaxed">
              {remoteUrl}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => remoteUrl && loadRemoteConfigFromUrl(remoteUrl)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.remote.retryButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.remote.manualImportButton}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadShowcaseDemo}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.remote.loadDemoButton}</span>
            </button>
          </div>
        </div>

        <ConfigLoadModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onConfirm={handleManualImportConfirm}
          hasExistingSchema={false}
          initialTab="paste"
          initialUrl={remoteUrl || ''}
        />
      </div>
    );
  }

  // 3. 远程打开加载成功后：内嵌简洁顶部语言栏与编辑器
  if (isRemoteMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Logo" className="w-5 h-5 rounded" />
            <span className="text-xs font-bold text-white tracking-tight">OpsConfig Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <PWAInstallButton />
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <OpsVisualEditor
            schemaPackage={schemaPackage}
            currentConfig={currentOpsConfig}
            onUpdateConfig={setCurrentOpsConfig}
            onUpdateSchemaPackage={(pkg) => {
              setSchemaPackage(pkg);
              setCurrentOpsConfig(JSON.parse(JSON.stringify(pkg.defaultConfig || {})));
            }}
            onSwitchToDevMode={() => setActiveMode('dev')}
            onLoadShowcaseDemo={handleLoadShowcaseDemo}
            isRemoteMode={true}
            remoteUrl={remoteUrl || undefined}
          />
        </main>
        <OfflineIndicator />
      </div>
    );
  }

  // 4. 标准完整模式：展示 Header 和 Footer 以及工作区切换能力
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Universal Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand title wordmark with custom designed SVG icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-0.5 shadow-xs overflow-hidden shrink-0 group">
              <img
                src="/icon.svg"
                alt="OpsConfig Studio Logo"
                className="w-full h-full rounded-md object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap leading-tight">
                {t.common.appName}
              </span>
              <span className="hidden md:inline-block text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                {t.common.appSubtitle}
              </span>
            </div>
          </div>

          {/* Zone 2: Workspace Mode Switcher */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveMode('ops')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMode === 'ops'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.nav.opsMode}</span>
            </button>

            <button
              onClick={() => setActiveMode('dev')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMode === 'dev'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{t.nav.devMode}</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions & Language Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <PWAInstallButton />

            {schemaPackage && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/40 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                title={t.nav.resetWorkspaceTitle}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.nav.resetWorkspace}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadShowcaseDemo}
              className="px-3.5 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.nav.loadDemo}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeMode === 'dev' ? (
          <DevSchemaDesigner
            schemaPackage={schemaPackage}
            onUpdateSchemaPackage={(pkg) => {
              setSchemaPackage(pkg);
              setCurrentOpsConfig(JSON.parse(JSON.stringify(pkg.defaultConfig || {})));
            }}
            onSwitchToOpsMode={() => setActiveMode('ops')}
            onLoadShowcaseDemo={handleLoadShowcaseDemo}
          />
        ) : (
          <OpsVisualEditor
            schemaPackage={schemaPackage}
            currentConfig={currentOpsConfig}
            onUpdateConfig={setCurrentOpsConfig}
            onUpdateSchemaPackage={(pkg) => {
              setSchemaPackage(pkg);
              setCurrentOpsConfig(JSON.parse(JSON.stringify(pkg.defaultConfig || {})));
            }}
            onSwitchToDevMode={() => setActiveMode('dev')}
            onLoadShowcaseDemo={handleLoadShowcaseDemo}
            isRemoteMode={false}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.common.footerTitle}</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{t.common.footerSubtitle1}</span>
            <span>·</span>
            <span>{t.common.footerSubtitle2}</span>
            <span>·</span>
            <span>{t.common.footerSubtitle3}</span>
          </div>
        </div>
      </footer>
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </I18nProvider>
  );
}
