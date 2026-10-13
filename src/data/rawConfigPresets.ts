export const PRESET_RAW_CONFIGS = [
  {
    name: '分布式集群与工作流引擎 (Cluster & Worker 列表)',
    desc: '包含集群心跳、重试次数与多计算节点对象列表的原始配置',
    nameEn: 'Distributed Cluster & Workflow Engine (Cluster & Workers)',
    descEn: 'Raw configuration with cluster heartbeats, retries, and compute node lists',
    json: {
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
          {
            NodeName: '辅助调度节点-03',
            Host: '192.168.10.23',
            Port: 8083,
            Role: 'Standby',
            ConcurrencyLimit: 8,
            EnableAutoScaling: false,
            AssignedQueues: ['audit-logs'],
          },
        ],
      },
    },
  },
  {
    name: '云原生 API 网关与服务治理 (Gateway & DB Pool)',
    desc: '包含端口、TLS开关、跨域白名单与数据库连接池的原始配置',
    nameEn: 'Cloud Native API Gateway (Gateway & DB Pool)',
    descEn: 'Raw configuration with ports, TLS, CORS allowlists, and database connection pools',
    json: {
      gateway: {
        listenPort: 8080,
        bindHost: '0.0.0.0',
        requestTimeoutMs: 5000,
        enableTls: true,
        corsOrigins: ['https://console.company.org', 'https://app.company.org'],
        rateLimitQps: 500,
      },
      datasource: {
        dbHost: '10.0.8.50',
        dbPort: 3306,
        maxPoolSize: 50,
        idleTimeoutSeconds: 60,
        authPassword: 'ENC(db_secure_pass_99)',
      },
      observability: {
        logLevel: 'info',
        logFormat: 'json',
        enableMetricsExport: true,
      },
    },
  },
  {
    name: '消息发布订阅与流处理中心 (Message Bus & Topics)',
    desc: '包含 Kafka 端点、会话超时、批处理与死信队列的原始配置',
    nameEn: 'Messaging & Stream Processing (Message Bus & Topics)',
    descEn: 'Raw configuration with Kafka endpoints, session timeouts, batching, and dead-letter queues',
    json: {
      broker: {
        clusterEndpoint: 'kafka-cluster.internal:9092',
        clientGroupId: 'analytics-consumer-group',
        sessionTimeoutMs: 30000,
        enableAutoCommit: false,
      },
      pipelines: {
        batchSize: 200,
        flushIntervalMs: 500,
        deadLetterTopic: 'dlq.failed.events',
        subscribers: ['orders.created', 'payments.success', 'inventory.deducted'],
      },
    },
  },
];