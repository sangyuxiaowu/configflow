import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../i18n';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md border border-amber-400 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl animate-in slide-in-from-bottom-2">
      <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>{t.pwa.offlineModeNotice}</span>
    </div>
  );
};
