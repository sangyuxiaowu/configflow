import React from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { ConfigSchemaPackage } from '../../types/config';

export interface ConfigPreviewResult {
  schemaPackage: ConfigSchemaPackage;
  isStandardSchema: boolean;
  configData: Record<string, any>;
}

interface ConfigPreviewPanelProps {
  result: ConfigPreviewResult | null;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const ConfigPreviewPanel: React.FC<ConfigPreviewPanelProps> = ({
  result,
  name,
  description,
  onNameChange,
  onDescriptionChange,
}) => {
  if (!result) return null;

  return (
    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-4 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-indigo-800/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">
            {result.isStandardSchema
              ? '✓ 标准开发约束规范包解析成功'
              : '✓ 配置文件解析完成（已推断基础约束模型）'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 font-mono">
            <span className="text-slate-400">字段约束项:</span>
            <strong className="text-white">{result.schemaPackage.fields.length} 个</strong>
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <span className="text-slate-400">参考方案:</span>
            <strong className="text-white">{result.schemaPackage.referenceExamples.length} 个</strong>
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <span className="text-slate-400">分类分组:</span>
            <strong className="text-white">{result.schemaPackage.categories.length} 个</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-slate-300 block mb-1">
            约束规范名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
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
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="简述此约束规范适用的业务系统与环境"
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>载入后，运维端将严格依据此规范进行配置生成，内置实时校验防护与基线对照。</span>
      </div>
    </div>
  );
};