import { useI18n } from '../../i18n';
import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  BookOpen,
  Server,
  FileCheck,
  Check,
  Cpu,
  Layers,
} from 'lucide-react';
import { ReferenceExample } from '../../types/config';

interface ReferenceExamplesEditorProps {
  examples: ReferenceExample[];
  currentConfig: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (examples: ReferenceExample[]) => void;
}

export const ReferenceExamplesEditor: React.FC<ReferenceExamplesEditorProps> = ({
  examples,
  currentConfig,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, format: formatMessage } = useI18n();
  const [list, setList] = useState<ReferenceExample[]>(
    examples.map((item) => ({ ...item }))
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeJsonError, setActiveJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentItem = list[selectedIndex] || list[0];

  const handleUpdateCurrent = (patch: Partial<ReferenceExample>) => {
    setList((prev) =>
      prev.map((item, idx) => (idx === selectedIndex ? { ...item, ...patch } : item))
    );
  };

  const handleJsonChange = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setActiveJsonError(null);
      handleUpdateCurrent({ config: parsed });
    } catch (err: any) {
      setActiveJsonError(err.message);
    }
  };

  const handleAddNew = () => {
    const newItem: ReferenceExample = {
      id: `ref-${Date.now()}`,
      name: formatMessage(t.details.newProfile, { value0: list.length + 1 }),
      environment: 'production',
      summary: t.details.describeTheIntendedUseOfThisProfile,
      detailedNotes: t.details.explainTheseSettings1ConnectionPoolSizing,
      recommendedHardware: t.details.recommendedAtLeast4CpuCoresAnd,
      config: JSON.parse(JSON.stringify(currentConfig || {})),
    };
    setList((prev) => [...prev, newItem]);
    setSelectedIndex(list.length);
  };

  const handleDuplicateCurrent = () => {
    if (!currentItem) return;
    const copied: ReferenceExample = {
      ...JSON.parse(JSON.stringify(currentItem)),
      id: `ref-${Date.now()}`,
      name: formatMessage(t.details.copy, { value0: currentItem.name }),
    };
    setList((prev) => [...prev, copied]);
    setSelectedIndex(list.length);
  };

  const handleRemove = (idx: number) => {
    if (list.length <= 1) return;
    const nextList = list.filter((_, i) => i !== idx);
    setList(nextList);
    setSelectedIndex(Math.max(0, idx - 1));
  };

  const handleSaveAll = () => {
    onSave(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">{t.details.referenceProfileLibrary}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t.details.defineRecommendedProductionDevelopmentAndLoadTesting}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 2-column split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Example List */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{formatMessage(t.details.profiles, { count: list.length })}
              </span>
              <button
                type="button"
                onClick={handleAddNew}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />{t.details.addProfile}</button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {list.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setActiveJsonError(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate flex-1">
                        {item.name || t.details.untitledProfile}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${
                          item.environment === 'production'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            : item.environment === 'staging'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {item.environment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {item.summary || t.details.noDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Example Detail Editor */}
          {currentItem ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    ID: {currentItem.id}
                  </span>
                  <span className="text-xs text-slate-400">{t.details.editingProfileDetailsAndConfiguration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateCurrent}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />{t.details.cloneProfile}</button>
                  {list.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(selectedIndex)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />{t.details.delete}</button>
                  )}
                </div>
              </div>

              {/* Title & Env */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.profileName}</label>
                  <input
                    type="text"
                    value={currentItem.name}
                    onChange={(e) => handleUpdateCurrent({ name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder={t.details.eGProductionHighAvailability}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.deploymentEnvironment}</label>
                  <select
                    value={currentItem.environment}
                    onChange={(e) =>
                      handleUpdateCurrent({
                        environment: e.target.value as ReferenceExample['environment'],
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="production">{t.details.production}</option>
                    <option value="staging">{t.details.staging}</option>
                    <option value="development">{t.details.development}</option>
                    <option value="testing">{t.details.testing}</option>
                  </select>
                </div>
              </div>

              {/* Summary & Hardware */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.usageSummary}</label>
                  <input
                    type="text"
                    value={currentItem.summary}
                    onChange={(e) => handleUpdateCurrent({ summary: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder={t.details.eGProductionContainersWithHighConcurrency}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.recommendedHardwareContainerResources}</label>
                  <input
                    type="text"
                    value={currentItem.recommendedHardware || ''}
                    onChange={(e) => handleUpdateCurrent({ recommendedHardware: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder={t.details.eG8CpuCores16Gb}
                  />
                </div>
              </div>

              {/* Detailed Notes */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.architectureNotesConfigurationRationale}</label>
                <textarea
                  rows={4}
                  value={currentItem.detailedNotes}
                  onChange={(e) => handleUpdateCurrent({ detailedNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none font-sans leading-relaxed"
                  placeholder={t.details.explainKeySettingsEG80Connections}
                />
              </div>

              {/* JSON Editor for this example */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">{t.details.completeProfileConfigurationJson}</label>
                  {activeJsonError && (
                    <span className="text-xs text-rose-400">{t.details.jsonSyntaxError2}{activeJsonError}</span>
                  )}
                </div>
                <textarea
                  rows={9}
                  defaultValue={JSON.stringify(currentItem.config, null, 2)}
                  key={currentItem.id}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full p-3.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">{t.details.selectOrCreateAReferenceProfile}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400">{formatMessage(t.details.profileAvailability, { count: list.length })}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >{t.details.cancel}</button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >{t.details.saveAllProfiles}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
