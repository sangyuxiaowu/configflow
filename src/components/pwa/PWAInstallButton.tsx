import React, { useState } from 'react';
import { Download, Share, PlusSquare, CheckCircle, Info, X } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useI18n } from '../../i18n';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useI18n();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);

  if (import.meta.env.DEV || isTauri()) {
    return null;
  }

  // If already running in standalone PWA window, suppress install prompt
  if (isInstalled) {
    return null;
  }

  // 1. Browser provides native beforeinstallprompt (Chromium / Edge / Android)
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center gap-1.5 shrink-0 animate-pulse hover:animate-none"
        title={t.pwa.installAppTitle}
      >
        <Download className="w-3.5 h-3.5 text-indigo-100" />
        <span className="whitespace-nowrap">{t.pwa.installApp}</span>
      </button>
    );
  }

  // 2. iOS Safari (WebKit does not support beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Share className="w-3.5 h-3.5 text-indigo-400" />
          <span className="whitespace-nowrap hidden sm:inline">{t.pwa.installMobile}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                    <img src="/icon.svg" alt="App Icon" className="w-5 h-5 rounded" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{t.pwa.iosInstallTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <Share className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">{t.pwa.iosStep1.split('：')[0]}：</span>
                    {t.pwa.iosStep1.split('：')[1] || t.pwa.iosStep1}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">{t.pwa.iosStep2.split('：')[0]}：</span>
                    {t.pwa.iosStep2.split('：')[1] || t.pwa.iosStep2}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">{t.pwa.iosStep3.split('：')[0]}：</span>
                    {t.pwa.iosStep3.split('：')[1] || t.pwa.iosStep3}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                {t.pwa.gotIt}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 3. Fallback button for desktop when browser hasn't fired beforeinstallprompt or running in preview
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDesktopHelp(true)}
        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        title={t.pwa.pwaSupport}
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span className="whitespace-nowrap hidden sm:inline">{t.pwa.pwaSupport}</span>
      </button>

      {showDesktopHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-indigo-700/50 flex items-center justify-center p-1">
                  <img src="/icon.svg" alt="App Icon" className="w-full h-full rounded-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t.pwa.desktopGuideTitle}</h3>
                  <p className="text-[11px] text-slate-400">{t.pwa.desktopGuideDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopHelp(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.pwa.howToInstall}</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {t.pwa.howToInstallDesc}
                </p>
              </div>

              <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/40 text-slate-300 space-y-1 text-[11px]">
                <div className="text-indigo-300 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.pwa.pwaFeatures}</span>
                </div>
                <p>• {t.common.footerSubtitle1}</p>
                <p>• {t.common.footerSubtitle2}</p>
                <p>• {t.common.footerSubtitle3}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopHelp(false)}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
