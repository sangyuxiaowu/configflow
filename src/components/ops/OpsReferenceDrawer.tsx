import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { ReferenceExample, FieldDefinition } from '../../types/config';
import { useToast } from '../common/Toast';
import { getValueByPath } from '../../utils/schemaInfer';
import { useI18n } from '../../i18n';

interface OpsReferenceDrawerProps {
  examples: ReferenceExample[];
  currentConfig: Record<string, any>;
  fields: FieldDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onApplyExample: (example: ReferenceExample) => void;
}

export const OpsReferenceDrawer: React.FC<OpsReferenceDrawerProps> = ({
  examples,
  currentConfig,
  fields,
  isOpen,
  onClose,
  onApplyExample,
}) => {
  const { showToast } = useToast();
  const { t, format, language } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  const currentExample = examples[selectedIndex] || examples[0];

  const handleApply = (example: ReferenceExample) => {
    onApplyExample(example);
    showToast(format(t.refDrawer.appliedSuccess, { name: example.name }), 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">
                {t.refDrawer.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.refDrawer.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Example tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto">
          {examples.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {currentExample ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded uppercase font-semibold ${
                    currentExample.environment === 'production'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                      : currentExample.environment === 'staging'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                  }`}
                >
                  {language === 'en' ? 'Environment:' : '目标环境:'} {currentExample.environment}
                </span>

                <button
                  type="button"
                  onClick={() => handleApply(currentExample)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.refDrawer.applyProfile}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  {currentExample.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {currentExample.summary}
                </p>
              </div>

              {currentExample.recommendedHardware && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/30 p-2 rounded-xl border border-indigo-800/30">
                  <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    {t.refDrawer.recommendedHardware}: {currentExample.recommendedHardware}
                  </span>
                </div>
              )}
            </div>

            {/* Detailed Rationale & Architecture Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {t.refDrawer.architectNotes}
              </h4>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {currentExample.detailedNotes}
              </div>
            </div>

            {/* Field values comparison table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {t.refDrawer.diffWithCurrent}
              </h4>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                <div className="grid grid-cols-12 bg-slate-900/80 px-4 py-2.5 text-[11px] font-medium text-slate-400 border-b border-slate-800">
                  <div className="col-span-5">{language === 'en' ? 'Field' : '配置项说明'}</div>
                  <div className="col-span-4">{language === 'en' ? 'Baseline Value' : '此参考方案值'}</div>
                  <div className="col-span-3 text-right">{language === 'en' ? 'Current Value' : '当前编辑值'}</div>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                  {fields.map((f) => {
                    const refVal = getValueByPath(currentExample.config, f.path);
                    const curVal = getValueByPath(currentConfig, f.path);
                    const isDiff =
                      JSON.stringify(refVal) !== JSON.stringify(curVal);

                    return (
                      <div
                        key={f.id}
                        className="grid grid-cols-12 px-4 py-2 text-xs items-center hover:bg-slate-900/40"
                      >
                        <div className="col-span-5 pr-2">
                          <span className="text-slate-200 font-medium block truncate">
                            {f.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block truncate">
                            {f.path}
                          </span>
                        </div>
                        <div className="col-span-4 font-mono text-amber-300 truncate">
                          {f.isSensitive
                            ? '******'
                            : JSON.stringify(refVal ?? '-')}
                        </div>
                        <div className="col-span-3 text-right font-mono truncate">
                          <span
                            className={
                              isDiff
                                ? 'text-indigo-400 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {f.isSensitive
                              ? '******'
                              : JSON.stringify(curVal ?? '-')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>
            {language === 'en'
              ? `Contains ${examples.length} baseline profiles`
              : `共收录 ${examples.length} 个环境推荐基线`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
