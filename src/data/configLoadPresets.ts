import { SHOWCASE_SCHEMA_PACKAGE, getShowcaseSchemaPackage } from './mockTemplates';
import type { ConfigSchemaPackage, FieldDefinition } from '../types/config';
import type { Language } from '../i18n/types';

export const PRESET_SCHEMA_SNIPPETS: {
  name: string;
  desc: string;
  package: ConfigSchemaPackage;
}[] = [
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

export function getPresetSchemaSnippets(language: Language) {
  if (language === 'zh') return PRESET_SCHEMA_SNIPPETS;

  const clusterPackage = PRESET_SCHEMA_SNIPPETS[1].package;
  const metadata: Record<string, Pick<FieldDefinition, 'label' | 'description'>> = {
    cluster_name: { label: 'Cluster Identifier', description: 'Unique name of the production cluster' },
    heartbeat_interval: { label: 'Heartbeat Interval (Seconds)', description: 'Node heartbeat interval; recommended: 15 seconds' },
    max_retries: { label: 'Maximum Failover Retries', description: 'Maximum retries after the primary node loses its heartbeat' },
    nodes_list: { label: 'Compute Nodes', description: 'Service nodes with configurable membership and concurrency' },
    node_name: { label: 'Node Identifier', description: 'Server node name' },
    node_host: { label: 'Internal IP', description: 'Server IP address' },
    node_port: { label: 'RPC Listening Port', description: 'Communication port (1024-65535)' },
    node_role: { label: 'Node Role', description: 'Controller or worker node' },
    node_concurrency: { label: 'Maximum Concurrency', description: 'Maximum tasks handled by one worker' },
  };
  const categories: Record<string, string> = {
    cat_cluster: 'Cluster Settings',
    cat_nodes: 'Compute Nodes',
  };
  const categoryNames = new Map(clusterPackage.categories.map(category => [category.name, categories[category.id]]));
  const units: Record<string, string> = { '秒': 's', '次': 'retries', '并发': 'tasks' };
  const localizeField = (field: FieldDefinition): FieldDefinition => ({
    ...field,
    ...metadata[field.id],
    category: categoryNames.get(field.category) || field.category,
    constraints: {
      ...field.constraints,
      unit: field.constraints.unit ? units[field.constraints.unit] || field.constraints.unit : undefined,
      options: field.constraints.options?.map(option => ({ ...option, label: String(option.value) })),
    },
    itemFields: field.itemFields?.map(localizeField),
  });
  const localizedClusterPackage: ConfigSchemaPackage = {
    ...clusterPackage,
    name: 'Distributed Cluster & Workflow Engine Schema',
    description: 'Cluster heartbeats, failover retry limits, and compute node constraints',
    author: 'Middleware Architecture Team',
    categories: clusterPackage.categories.map(category => ({ ...category, name: categories[category.id] })),
    fields: clusterPackage.fields.map(localizeField),
    referenceExamples: clusterPackage.referenceExamples.map(example => ({
      ...example,
      name: 'Production Two-Node Baseline',
      summary: 'Primary and worker high-availability deployment',
      detailedNotes: 'Recommended production configuration delivered by the development team.',
    })),
  };
  return [
    {
      name: 'CloudEnterprise Cloud Native Platform Schema (Full Showcase)',
      desc: 'Port ranges, IP/URL validation, enums, masked secrets, critical switches, and node lists',
      package: getShowcaseSchemaPackage(language),
    },
    {
      name: localizedClusterPackage.name,
      desc: 'Cluster heartbeat timing, failover retries, and service node constraints',
      package: localizedClusterPackage,
    },
  ];
}