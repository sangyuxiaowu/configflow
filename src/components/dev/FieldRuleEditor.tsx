import { useI18n } from '../../i18n';
import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Hash,
  Type,
  ToggleLeft,
  List,
  Lock,
  Globe,
  Radio,
  Clock,
  Layers,
  ShieldAlert,
  Sparkles,
  Tag,
  ChevronDown,
  ChevronUp,
  Settings2,
  Check,
} from 'lucide-react';
import { FieldDefinition, FieldType } from '../../types/config';
import { useArrayObjectFieldEditor } from './useArrayObjectFieldEditor';
import { EnumOptionsEditor } from './EnumOptionsEditor';
import { ScalarConstraintsEditor } from './ScalarConstraintsEditor';

interface FieldRuleEditorProps {
  field: FieldDefinition;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: FieldDefinition) => void;
}

export const FieldRuleEditor: React.FC<FieldRuleEditorProps> = ({
  field,
  categories,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, format: formatMessage } = useI18n();
  const [formData, setFormData] = useState<FieldDefinition>({
    ...field,
    constraints: {
      ...field.constraints,
      options: field.constraints.options ? [...field.constraints.options] : [],
    },
    itemFields: field.itemFields
      ? field.itemFields.map((sub) => ({
          ...sub,
          constraints: {
            ...sub.constraints,
            options: sub.constraints?.options ? [...sub.constraints.options] : [],
          },
        }))
      : [],
  });

  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const {
    newSubKey,
    setNewSubKey,
    newSubLabel,
    setNewSubLabel,
    newSubType,
    setNewSubType,
    expandedSubIndex,
    setExpandedSubIndex,
    subNewOptVal,
    setSubNewOptVal,
    subNewOptLabel,
    setSubNewOptLabel,
    subNewOptDesc,
    setSubNewOptDesc,
    subBatchText,
    setSubBatchText,
    showSubBatch,
    setShowSubBatch,
    handleAddSubField,
    handleRemoveSubField,
    handleUpdateSubField,
    handleAddSubEnumOption,
    handleBatchAddSubEnum,
    handleRemoveSubEnumOption,
  } = useArrayObjectFieldEditor(formData, setFormData);

  if (!isOpen) return null;

  // Path change handler: sync key from last path part
  const handlePathChange = (newPath: string) => {
    const cleanPath = newPath.trim();
    const parts = cleanPath.split('.');
    const derivedKey = parts[parts.length - 1] || formData.key;
    setFormData((prev) => ({
      ...prev,
      path: cleanPath,
      key: derivedKey,
      id: cleanPath.replace(/\./g, '_') || prev.id,
    }));
  };

  const handleSave = () => {
    const finalCategory =
      isNewCategoryMode && customCategoryInput.trim()
        ? customCategoryInput.trim()
        : formData.category;

    onSave({
      ...formData,
      category: finalCategory || t.details.coreSettings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {formData.path || t.details.noPathSpecified}
              </span>
              <span className="text-xs text-indigo-400 font-medium">{t.details.fieldMetadataConstraints}</span>
            </div>
            <h2 className="text-base font-semibold text-white mt-1">{t.details.editFieldRules}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Path, Key, Label & Category */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.details.fieldIdentityCategory}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.fieldPathEGServerPortOr}</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handlePathChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  placeholder={t.details.eGServerPortOrClusterNodes}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.propertyKey}</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  placeholder={t.details.eGPort}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.displayLabelShownInTheOpsForm}</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                  placeholder={t.details.eGGatewayListeningPort}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">{t.details.category}</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    {isNewCategoryMode ? t.details.chooseExistingCategory : t.details.newCategory}
                  </button>
                </div>

                {isNewCategoryMode ? (
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder={t.details.newCategoryNameEGCacheCluster}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-indigo-600/50 rounded-lg text-white focus:outline-hidden"
                  />
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <option value={t.details.coreSettings}>{t.details.coreSettings}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.descriptionGuidancePurposeAndPrecautions}</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                placeholder={t.details.eGPublicHttpPortAvoidPrivileged}
              />
            </div>
          </div>

          {/* Section 2: Data Type Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.details.fieldTypeInputControl}</h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { type: 'port', label: t.details.networkPort, icon: Radio, desc: t.details.safeRange102465535 },
                { type: 'number', label: t.details.number, icon: Hash, desc: t.details.rangeSliderAndUnits },
                { type: 'string', label: t.details.text, icon: Type, desc: t.details.stringsAndRegex },
                { type: 'enum', label: t.details.enum, icon: List, desc: t.details.optionsAndDescriptions },
                { type: 'boolean', label: t.details.boolean, icon: ToggleLeft, desc: t.details.onOff },
                { type: 'secret', label: t.details.secret, icon: Lock, desc: t.details.maskedInputAndVisibility },
                { type: 'ip', label: t.details.ipAddress, icon: Globe, desc: t.details.ipv4Validation },
                { type: 'url', label: t.details.url, icon: Globe, desc: t.details.httpHttpsFormat },
                { type: 'array_string', label: t.details.stringArray, icon: Tag, desc: t.details.editableTagList },
                { type: 'array_object', label: t.details.objectArray, icon: Layers, desc: t.details.serviceAndNodeList },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = formData.type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: item.type as FieldType })}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs mb-0.5">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Type Constraints */}

          {formData.type === 'enum' && (
            <EnumOptionsEditor
              options={formData.constraints.options || []}
              onChange={(options) =>
                setFormData((prev) => ({
                  ...prev,
                  constraints: { ...prev.constraints, options },
                }))
              }
            />
          )}

          <ScalarConstraintsEditor
            type={formData.type}
            constraints={formData.constraints}
            onChange={(constraints) =>
              setFormData((prev) => ({ ...prev, constraints }))
            }
          />

          {/* 3.4: Array of Objects Template (子项模板与子项详细配置) */}
          {formData.type === 'array_object' && (
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />{t.details.itemTemplatePropertiesAndConstraintsForEach}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.details.defineOptionsPortRangesUnitsAndDocumentation}</p>
                </div>
                <span className="text-[11px] text-slate-400">{formatMessage(t.details.total, { count: (formData.itemFields || []).length })}</span>
              </div>

              {/* Title Key Selector & Min/Max Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.itemTitleKeyPropertyUsedAsThe}</label>
                  <select
                    value={formData.itemTitleKey || ''}
                    onChange={(e) => setFormData({ ...formData, itemTitleKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {(formData.itemFields || []).map((sub) => (
                      <option key={sub.key} value={sub.key}>
                        {sub.label} ({sub.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.minimumItems}</label>
                    <input
                      type="number"
                      value={formData.constraints.minItems ?? 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          constraints: { ...formData.constraints, minItems: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-300 block mb-1">{t.details.maximumItems}</label>
                    <input
                      type="number"
                      value={formData.constraints.maxItems ?? 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          constraints: { ...formData.constraints, maxItems: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Add New Subfield Header Form */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-medium text-slate-300 block">{t.details.addASubField}</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newSubKey}
                    onChange={(e) => setNewSubKey(e.target.value)}
                    placeholder={t.details.subFieldKeyEGProtocol}
                    className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <input
                    type="text"
                    value={newSubLabel}
                    onChange={(e) => setNewSubLabel(e.target.value)}
                    placeholder={t.details.displayLabelEGProtocol}
                    className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <select
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value as FieldType)}
                    className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="string">{t.details.textString}</option>
                    <option value="number">{t.details.numberNumber}</option>
                    <option value="port">{t.details.portPort}</option>
                    <option value="ip">{t.details.ipAddressIp}</option>
                    <option value="boolean">{t.details.booleanBoolean}</option>
                    <option value="enum">{t.details.enumEnum}</option>
                    <option value="secret">{t.details.secretSecret}</option>
                    <option value="array_string">{t.details.stringArrayTags}</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSubField}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />{t.details.addSubField}</button>
                </div>
              </div>

              {/* Subfields List with Deep Customization Accordion */}
              <div className="space-y-3">
                {(formData.itemFields || []).map((sub, idx) => {
                  const isExpanded = expandedSubIndex === idx;
                  const hasOptions =
                    sub.type === 'enum' &&
                    sub.constraints?.options &&
                    sub.constraints.options.length > 0;

                  return (
                    <div
                      key={sub.key || idx}
                      className={`rounded-xl border transition-all ${
                        isExpanded
                          ? 'bg-slate-950 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Subfield Header */}
                      <div className="flex items-center justify-between p-3 gap-2">
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <span className="w-5 h-5 rounded bg-indigo-950 border border-indigo-800/40 text-[10px] font-mono text-indigo-300 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                            {sub.key}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {sub.label}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {sub.type}
                          </span>
                          {sub.required && (
                            <span className="text-[10px] text-rose-400">{t.details.required}</span>
                          )}
                          {hasOptions && (
                            <span className="text-[10px] text-amber-300 px-1.5 py-0.2 rounded bg-amber-950/40 border border-amber-800/30">
                              {formatMessage(t.details.enumOptions, { count: sub.constraints?.options?.length || 0 })}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSubIndex(isExpanded ? null : idx)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                              isExpanded
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>{isExpanded ? t.details.collapseConstraints : t.details.editConstraints}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubField(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                            title={t.details.deleteSubField}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Subfield Deep Configuration Panel */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                          {/* Row 1: Label, Key & Type */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.subFieldDisplayLabel}</label>
                              <input
                                type="text"
                                value={sub.label}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, { label: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                                placeholder={t.details.eGServicePort}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.subFieldKey}</label>
                              <input
                                type="text"
                                value={sub.key}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, { key: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                                placeholder={t.details.eGPort}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.fieldDataType}</label>
                              <select
                                value={sub.type}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, {
                                    type: e.target.value as FieldType,
                                    constraints: {
                                      ...sub.constraints,
                                      options:
                                        e.target.value === 'enum'
                                          ? sub.constraints?.options || []
                                          : undefined,
                                    },
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                              >
                                <option value="string">{t.details.textString2}</option>
                                <option value="number">{t.details.numberNumber2}</option>
                                <option value="port">{t.details.portPort2}</option>
                                <option value="enum">{t.details.enumEnum}</option>
                                <option value="boolean">{t.details.booleanBoolean}</option>
                                <option value="ip">{t.details.ipAddressIp}</option>
                                <option value="secret">{t.details.secretSecret2}</option>
                                <option value="array_string">{t.details.stringArrayTags}</option>
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Description */}
                          <div>
                            <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.subFieldDescriptionRequirements}</label>
                            <input
                              type="text"
                              value={sub.description || ''}
                              onChange={(e) =>
                                handleUpdateSubField(idx, { description: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                              placeholder={t.details.describeThePurposeAndConstraints}
                            />
                          </div>

                          {/* Row 3: Subfield Enum Options Builder (If sub.type === 'enum') */}
                          {sub.type === 'enum' && (
                            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                  <List className="w-3.5 h-3.5 text-amber-400" />{t.details.subFieldEnumOptions}</span>
                                <button
                                  type="button"
                                  onClick={() => setShowSubBatch(!showSubBatch)}
                                  className="text-xs text-indigo-400 hover:underline"
                                >
                                  {showSubBatch ? t.details.addIndividually : t.details.batchImport2}
                                </button>
                              </div>

                              {showSubBatch && (
                                <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                  <textarea
                                    rows={2}
                                    value={subBatchText}
                                    onChange={(e) => setSubBatchText(e.target.value)}
                                    placeholder={t.details.commaSeparatedOrNewlineSeparatedOptionsE}
                                    className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleBatchAddSubEnum(idx)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
                                  >{t.details.addBatch}</button>
                                </div>
                              )}

                              {/* Add Single Sub Enum */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                <input
                                  type="text"
                                  value={subNewOptVal}
                                  onChange={(e) => setSubNewOptVal(e.target.value)}
                                  placeholder={t.details.optionValueEGGrpc}
                                  className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono"
                                />
                                <input
                                  type="text"
                                  value={subNewOptLabel}
                                  onChange={(e) => setSubNewOptLabel(e.target.value)}
                                  placeholder={t.details.displayLabelEGGrpcProtocol}
                                  className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                                />
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={subNewOptDesc}
                                    onChange={(e) => setSubNewOptDesc(e.target.value)}
                                    placeholder={t.details.descriptionEGBinaryRpc}
                                    className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSubEnumOption(idx)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center gap-1 shrink-0"
                                  >
                                    <Plus className="w-3 h-3" />{t.details.add}</button>
                                </div>
                              </div>

                              {/* Options List */}
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {(sub.constraints?.options || []).map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-xs"
                                  >
                                    <span className="font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800/40 text-[11px]">
                                      {String(opt.value)}
                                    </span>
                                    <span className="text-white font-medium flex-1 truncate">
                                      {opt.label}
                                    </span>
                                    {opt.description && (
                                      <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                                        {opt.description}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubEnumOption(idx, optIdx)}
                                      className="p-1 text-slate-500 hover:text-rose-400"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                {(sub.constraints?.options || []).length === 0 && (
                                  <div className="text-center py-3 text-xs text-rose-400">{t.details.noEnumValuesConfiguredAddOptionsAbove}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Row 4: Number / Port Constraints */}
                          {(sub.type === 'number' || sub.type === 'port') && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">{t.details.minimumMin}</label>
                                <input
                                  type="number"
                                  value={sub.constraints?.min ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubField(idx, {
                                      constraints: {
                                        ...sub.constraints,
                                        min: e.target.value === '' ? undefined : Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white font-mono"
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">{t.details.maximumMax}</label>
                                <input
                                  type="number"
                                  value={sub.constraints?.max ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubField(idx, {
                                      constraints: {
                                        ...sub.constraints,
                                        max: e.target.value === '' ? undefined : Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white font-mono"
                                  placeholder="65535"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">{t.details.step}</label>
                                <input
                                  type="number"
                                  value={sub.constraints?.step ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubField(idx, {
                                      constraints: {
                                        ...sub.constraints,
                                        step: e.target.value === '' ? undefined : Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white font-mono"
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">{t.details.unit}</label>
                                <input
                                  type="text"
                                  value={sub.constraints?.unit ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubField(idx, {
                                      constraints: {
                                        ...sub.constraints,
                                        unit: e.target.value || undefined,
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                                  placeholder="Port / ms"
                                />
                              </div>
                            </div>
                          )}

                          {/* Row 5: Governance flags for subfield */}
                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sub.required}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, { required: e.target.checked })
                                }
                                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                              />
                              <span>{t.details.requiredCannotBeEmpty}</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs text-rose-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sub.isDangerous}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, { isDangerous: e.target.checked })
                                }
                                className="rounded border-slate-700 text-rose-600 focus:ring-0"
                              />
                              <span>{t.details.criticalPolicy}</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs text-indigo-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sub.isSensitive}
                                onChange={(e) =>
                                  handleUpdateSubField(idx, { isSensitive: e.target.checked })
                                }
                                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                              />
                              <span>{t.details.maskSecrets}</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(formData.itemFields || []).length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">{t.details.noSubFieldsYetAddASub}</div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Operational Governance & Flags */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.details.safetyChangeProtection}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-medium text-white block">{t.details.required2}</span>
                  <span className="text-[11px] text-slate-500">{t.details.emptyValuesBlockExport}</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={formData.isDangerous}
                  onChange={(e) => setFormData({ ...formData, isDangerous: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-medium text-rose-300 block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />{t.details.criticalParameter}</span>
                  <span className="text-[11px] text-slate-500">{t.details.showASafetyWarningWhenChanged}</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={formData.requiresRestart}
                  onChange={(e) => setFormData({ ...formData, requiresRestart: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-medium text-amber-300 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />{t.details.requiresServiceRestart}</span>
                  <span className="text-[11px] text-slate-500">{t.details.requiresAPlannedRestartCannotBeHot}</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={formData.isSensitive}
                  onChange={(e) => setFormData({ ...formData, isSensitive: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-medium text-white block flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />{t.details.sensitiveCredential}</span>
                  <span className="text-[11px] text-slate-500">{t.details.maskedByDefaultWithAVisibilityToggle}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >{t.details.cancel}</button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >{t.details.saveFieldRules}</button>
        </div>
      </div>
    </div>
  );
};
