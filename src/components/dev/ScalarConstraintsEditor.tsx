import { useI18n } from '../../i18n';
import React from 'react';
import { FieldConstraints, FieldType } from '../../types/config';

interface ScalarConstraintsEditorProps {
  type: FieldType;
  constraints: FieldConstraints;
  onChange: (constraints: FieldConstraints) => void;
}

export const ScalarConstraintsEditor: React.FC<ScalarConstraintsEditorProps> = ({
  type,
  constraints,
  onChange,
}) => {
  const { t } = useI18n();
  const updateConstraint = <Key extends keyof FieldConstraints>(
    key: Key,
    value: FieldConstraints[Key]
  ) => onChange({ ...constraints, [key]: value });

  return (
    <>
      {(type === 'number' || type === 'port') && (
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.details.numericBoundsUnits}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.minimumMin}</label>
              <input
                type="number"
                value={constraints.min ?? ''}
                onChange={(event) => updateConstraint('min', event.target.value === '' ? undefined : Number(event.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder={t.details.eG1Or1024}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.maximumMax}</label>
              <input
                type="number"
                value={constraints.max ?? ''}
                onChange={(event) => updateConstraint('max', event.target.value === '' ? undefined : Number(event.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder={t.details.eG65535}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.step}</label>
              <input
                type="number"
                value={constraints.step ?? ''}
                onChange={(event) => updateConstraint('step', event.target.value === '' ? undefined : Number(event.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder={t.details.eG1Or100}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.unit2}</label>
              <input
                type="text"
                value={constraints.unit ?? ''}
                onChange={(event) => updateConstraint('unit', event.target.value || undefined)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder={t.details.eGMsSItemsQps}
              />
            </div>
          </div>
        </div>
      )}

      {['string', 'secret', 'ip', 'url'].includes(type) && (
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.details.stringLengthRegexValidation}</h3>
          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.minimumLength}</label>
              <input
                type="number"
                value={constraints.minLength ?? ''}
                onChange={(event) => updateConstraint('minLength', event.target.value === '' ? undefined : Number(event.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.maximumLength}</label>
              <input
                type="number"
                value={constraints.maxLength ?? ''}
                onChange={(event) => updateConstraint('maxLength', event.target.value === '' ? undefined : Number(event.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder="128"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.regularExpressionRegex}</label>
              <input
                type="text"
                value={constraints.pattern ?? ''}
                onChange={(event) => updateConstraint('pattern', event.target.value || undefined)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                placeholder={t.details.eGAZaZ09}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-slate-400 block mb-1">{t.details.validationErrorMessage}</label>
              <input
                type="text"
                value={constraints.patternDescription ?? ''}
                onChange={(event) => updateConstraint('patternDescription', event.target.value || undefined)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder={t.details.eGOnlyLettersNumbersAndUnderscores}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};