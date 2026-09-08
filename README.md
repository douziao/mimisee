# MimiSee

企业 RAG 基础设施。从文档解析到证据引用，每一步都能检查输入、输出与版本，并按文档和场景替换解析器、索引、检索与模型。

当前版本 v1.0.1，见[发布说明](./docs/releases/v1.0.1.md)。

## 快速开始

### 前置要求

- [Docker](https://docs.docker.com/get-docker/) 20.10+ 与 [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- GNU Make；Docker 一键启动另需 Python 3.9+ 生成配置
- 源码开发模式另需 Python 3.11+、Node.js 20+ 与 pnpm 10.26
- 至少 4 核 CPU / 16 GB RAM / 50 GB 磁盘

### 初始化

```bash
git clone --depth 1 --single-branch https://github.com/douziao/mimisee.git
cd mimisee
make init
```

`make init` 只创建缺失的 `.env` 和 `web/.env.local`，不会覆盖已有配置。编辑 `.env`，按部署场景填写：

- 默认模型调用：`LLM_API_KEY`（必填）
- 自定义 LLM：`LLM_API_BASE`、`LLM_MODEL`
- 独立 Embedding：`EMBEDDING_API_BASE`、`EMBEDDING_API_KEY`、`EMBEDDING_MODEL`
- 启用 Reranker：`ENABLE_RERANKER`、`RERANKER_API_BASE`、`RERANKER_API_KEY`、`RERANKER_MODEL`
- 自动创建首个管理员：`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_PASSWORD`

字段取值、独立模型服务和管理员初始化规则见[模型服务与首次管理员配置](./docs/guides/model_services.md)。

启动后如何创建数据集、上传解析、检查切块、验证检索和引用，以及后续治理、评测、Dify 与运维，见[完整操作指南](./docs/user_guide.md)。

| 启动方式 | 适用场景 | 应用运行位置 |
|:---|:---|:---|
| **Docker 一键启动（推荐）** | 首次体验、服务器部署 | 前端、API、Worker 与依赖服务均在容器中 |
| **源码开发模式** | 前后端开发、热更新调试 | `.venv` + pip 运行 API，pnpm 运行 Web；Docker 运行基础设施 |

### 方式一：Docker 一键启动

```bash
make up-web
make api-ping
```

启动后访问 [http://localhost:3000](http://localhost:3000)；未预置管理员时，在页面注册首个账户。首次构建、代理、生产凭据和网络配置见 [Docker Compose 部署指南](./docs/deployment/docker_compose.md)。

停止使用 `make down`；清空持久化数据使用 `make docker-reset`；连同本项目服务镜像删除使用 `make docker-purge`。MimiSee 固定使用独立的 `mimisee` Compose 项目名，不会把同机 Dify 当成本项目；后两项不可恢复。Windows PowerShell、容器归属检查、旧版数据迁移、误删恢复和精确删除范围见 [Docker Compose 部署指南](./docs/deployment/docker_compose.md#4-数据卷与清理)。

#### 按文档类型启用可选解析器

默认使用内置 DeepDoc。其他解析器仅在业务需要时启动：

| 文档场景 | 建议解析器 | 额外要求 | 启动命令 |
|:---|:---|:---|:---|
| 常规 PDF / Office / 文本 | 内置 DeepDoc | 无 | 无需额外容器 |
| 表格、公式与复杂版式，多格式 CPU 解析 | Docling Serve | CPU；独立重型镜像，不进入 MimiSee 主镜像 | `make up-docling` |
| 表格、公式、OCR 与复杂版式 GPU 解析 | Docling Serve CUDA | NVIDIA GPU；默认 CUDA 12.8 | `make up-docling-gpu` |
| PDF 转 Markdown，服务器无 GPU | Marker | CPU | `make up-marker` |
| 版面、表格与图片混合文档 | ETL4LLM | CPU | `make up-etl4llm` |
| 扫描件、OCR、复杂版面 | PaddleOCR-VL | NVIDIA GPU，建议预留 10 GiB | `make up-paddlevl` |
| 表格、公式与图片较多的 PDF | MinerU pipeline | NVIDIA GPU、首次下载模型 | `make up-mineru` |
| VLM 复杂 PDF | MinerU VLM | NVIDIA GPU，资源占用较高 | `make up-mineru-vlm` |
| 高精度 PDF OCR | olmOCR | NVIDIA GPU，建议 48 GiB 级显存 | `make up-olmocr` |
| 公式 / 表格 PDF 转 Markdown | MagicPDF | NVIDIA GPU | `make up-magicpdf` |
| PDF / 图片走外部视觉 OCR | Qianfan-OCR | 上游 URL 与 API Key，本地无需 GPU | `make up-qianfanocr` |

> **Docling 说明**：重依赖与模型只存在于独立容器；CPU / GPU profile 共享 5001
> 端口，不能同时启动。GPU 镜像约 11.13 GB；本仓库已在 RTX 3070 Ti 8 GiB 上验证
> PDF、DOCX、Markdown 表格和 `ParserFactory` 无回退链路。源码开发命令、实测边界与
> CUDA 配置见 [Docling Serve 配置](./docs/quickstart.md#可选-启用-docling-serve独立-cpu-容器)。

### 方式二：本地源码运行（Python venv + pip + pnpm）

这是常见的本地开发方式，无需 Conda。FastAPI 运行在 Python `.venv` 中，Next.js 由 pnpm 启动；Docker 只运行 PostgreSQL、Redis、Milvus 等基础设施：

```bash
make setup-host
```

`make setup-host` 会创建 `.venv`、执行 pip 与 pnpm 依赖安装、准备解析模型并启动 Docker 基础设施。默认使用 API 进程内后台任务，只需打开两个终端：

```bash
make backend
```

```bash
make web
```

启用独立 Worker 的配置见[模型服务与首次管理员配置](./docs/guides/model_services.md)。验证主机前后端：

```bash
make api-ping
```

结束主机进程后，执行 `make infra-down` 停止依赖服务。

### 服务地址

| 服务 | 地址 |
|:---:|:---|
| **前端 UI** | [http://localhost:3000](http://localhost:3000) |
| **API 文档** | [http://localhost:8000/docs](http://localhost:8000/docs) |

> 低资源模式可使用 `make up-lite`，它用 Chroma/FAISS 替代 Milvus、免 MinIO，默认不含前端；适合验证 API `ready` 与 `make core-e2e` 最小闭环。需要 UI 时另运行 `make web`，或改用 `make up-web`。外部 LLM/Embedding 调用仍需对应模型供应商密钥。

高级模型、解析器和代理配置见 [`.env.example`](./.env.example)。更换 Embedding 模型后必须重建已有知识库索引；更多平台与 Windows 步骤见[开发文档](./docs/quickstart.md)，可选政务示例见[插件说明](./plugins/pipelines/changzhou-gov-service-knowledge/README.md)。

## 能力总览

以下数量取自当前仓库代码的注册表，可直接在源码中核对。

| 环节 | 实现 | 代码位置 |
|:---|:---|:---|
| **文档解析** | 29 个解析后端家族（含 `auto` 自动路由）：DeepDoc、MinerU、Docling、Marker、PaddleOCR-VL、olmOCR、MagicPDF、ColPali、TextIn、MarkItDown、Pandoc，以及 Office / 图像 / 音视频解析器 | [`app/parsing/parsers/registry.py`](./app/parsing/parsers/registry.py) |
| **切块策略** | 83 种策略 + 173 个别名：递归、Token、语义、父子、RAPTOR、Late Chunking、命题化，以及法规 / 论文 / 会议纪要 / 简历 / OpenAPI / Terraform / 日志等结构化切块 | [`app/rag/chunking/capabilities.py`](./app/rag/chunking/capabilities.py) |
| **向量与对象存储** | Milvus、pgvector、Qdrant、FAISS、Chroma；MinIO 与 S3 兼容对象存储 | [`app/storage/`](./app/storage/) |
| **检索** | 向量 + BM25 + SPLADE 稀疏 + ColBERT 晚交互 + PLAID；RRF 融合、邻居 / 兄弟 / 层级扩展、查询改写与分解 | [`app/rag/retrieval/`](./app/rag/retrieval/) |
| **重排** | 13 类重排器：Cross-Encoder、BGE-v2-m3、ColBERT、MMR、LTR、长上下文、父子、KG PageRank、KG RRF、LLM、OpenAI、DashScope、加权融合 | [`app/rag/reranker/registry.py`](./app/rag/reranker/registry.py) |
| **知识图谱** | 实体 / 关系 / 事件抽取、本体、实体消解、社区发现、快照与来源溯源、多跳检索 | [`app/rag/kg/`](./app/rag/kg/) |
| **Agent 与工作流** | LangGraph Agent、多 Agent；Self-RAG、CRAG、FLARE、ReAct、Planner-Worker、Evaluator-Optimizer、路由与并行等 17 种编排 | [`app/rag/workflows/`](./app/rag/workflows/) |
| **安全 Guard** | InputGuard / OutputGuard、正则与 LLM 双通道、检索护栏、PII / Secret 脱敏、SSRF 逐跳校验 | [`app/rag/safety/`](./app/rag/safety/) |
| **企业权限** | 文档 ACL + Security Trimming、RBAC、租户配额与 RLS、SCIM、SAML SSO、审计日志与保留策略 | [`app/services/`](./app/services/) |
| **评测与回归** | RAGAS、Golden 回归、Leaderboard、显著性检验、消融批跑、LLM-as-Judge 校准、红队、硬样本挖掘、影子在线评测 | [`app/rag/evaluation/`](./app/rag/evaluation/) |
| **可观测性** | Prometheus 指标、OpenTelemetry、SLI/SLO 快照、检索 Trace、证据漂移审计、Grafana 面板与 PrometheusRule | [`app/rag/tracing/`](./app/rag/tracing/) · [`deploy/helm/mimisee/`](./deploy/helm/mimisee/) |
| **API 与前端** | 93 个 v1 路由模块，OpenAPI 自动导出并与前端类型对齐；Next.js App Router 前端 | [`app/api/v1/`](./app/api/v1/) · [`web/`](./web/) |
| **测试与流水线** | 395 个后端测试文件 + 127 个前端测试文件；10 条 GitHub Actions 流水线（CI、安全、RAG 质量门禁、性能、解析留证等） | [`tests/`](./tests/) · [`.github/workflows/`](./.github/workflows/) |

技术栈与目录结构见[技术架构](./docs/architecture.md)与[后端结构说明](./docs/backend_structure.md)。

## Dify 接入

MimiSee 可作为 Dify 的可治理 RAG 层接入现有应用，不重复实现工作流画布。当前支持两种方式：

- **External Knowledge API**：Dify 负责编排与生成，MimiSee 负责文档治理、检索、重排、权限过滤和证据返回。
- **Workflow HTTP 节点**：Dify 负责自定义路由与参数，MimiSee 按指定知识范围返回证据和 Trace。

Dify 标准外部知识库端点为 `POST /api/v1/integrations/dify/retrieval`；可选用 `POST /api/v1/integrations/dify/conversation-turns` 回传答案、引用与会话标识。`knowledge_id` 默认必须显式配置在 `DIFY_EXTERNAL_KNOWLEDGE_MAP_JSON` 中。配置见 [`.env.example`](./.env.example)，部署前校验见 [readiness gate](./scripts/README.md)。

## 部署方式

支持以下部署方式：

| 方式 | 命令 | 说明 |
|:---:|:---|:---|
| **标准部署** | `make up` | 完整栈：Postgres + Milvus + Etcd + MinIO + Redis + API + Worker |
| **标准 + 前端** | `make up-web` | 推荐首次启动；自动初始化本地配置并启动完整 Web 栈 |
| **轻量模式** | `make up-lite` | Chroma/FAISS 替代 Milvus，无需 MinIO，适合快速体验 |
| **开发模式** | `make infra-up` | 仅基础设施，后端/前端本地运行 |
| **Helm / K8s** | `helm install` | 生产级部署，含 HPA、PDB、CronJob、NetworkPolicy、PrometheusRule |
| **解析器扩展** | [Docker Compose 指南](./docs/deployment/docker_compose.md) | 按需启动 CPU / GPU profile |

生产配置和升级顺序见 [Docker Compose 指南](./docs/deployment/docker_compose.md)、[Helm 部署文档](./docs/deployment/helm.md) 和[运维手册](./docs/deployment/runbook.md)。

## 功能指南

| 指南 | 说明 |
|:---|:---|
| [切片预览](./docs/guides/chunk_preview.md) | 可视化文档分块效果与参数调整 |
| [知识图谱](./docs/guides/knowledge_graph.md) | KG 抽取、可视化与 RAG 增强 |
| [文档 ACL](./docs/guides/document_acl.md) | 文档级访问控制与 Security Trimming |
| [连接器](./docs/guides/connectors.md) | 批量导入与增量同步 |
| [URL 导入](./docs/guides/url_ingest.md) | 远程 URL 抓取与批量导入 |
| [文档版本](./docs/guides/document_versions.md) | Pipeline 版本管理与回滚 |
| [稀疏检索](./docs/guides/sparse_retrieval.md) | SPLADE 稀疏检索通道 |
| [ColBERT 重排](./docs/guides/reranking_colbert.md) | ColBERT 晚交互重排序 |
| [RAG 优化](./docs/guides/rag_optimization.md) | 检索效果与回答质量优化 |
| [检索排障](./docs/guides/retrieval_debugging.md) | 检索问题诊断 |
| [Pipeline 插件](./docs/guides/pipeline_plugins.md) | 行业示例插件的挂载机制 |
| [SAML SSO](./docs/guides/saml_sso.md) | SAML 单点登录集成 |
| [快速开始](./docs/quickstart.md) | 从源码开发部署 |
| [运维手册](./docs/deployment/runbook.md) | 生产运维与排障 |

完整文档索引见 [`docs/README.md`](./docs/README.md)，HTTP 接口对照见 [API 文档](./docs/api/README.md)。

## 开发自检

提交前建议运行一键自检（后端 + 前端），与 CI 保持一致：

```bash
make enterprise-checks
```

```bash
make verify && make test
```

```bash
cd web && pnpm lint && pnpm test
```

浏览器核心路径（上传 / 解析 / 对话 UI + 前端到真实后端）：

```bash
make test-core-browser-smoke
```

任一部署方式启动并在网页注册账号后，可将该账号写入本地 `.env` 的 `MIMISEE_SMOKE_IDENTIFIER` 与 `MIMISEE_SMOKE_PASSWORD`，再运行同一套知识库核心闭环门禁。它验证就绪、入库、解析与检索证据，不依赖 LLM，并在成功后删除临时数据集。不要在需要人工注册的环境中使用 `CORE_E2E_BOOTSTRAP_REGISTER=1`，因为首个管理员创建后会关闭公开注册：

```bash
make core-e2e
```

已有同请求量的串行与并发负载报告时，可验证并发是否真正提高批量吞吐，而不只是客户端同时发起请求：

```bash
RAG_CONCURRENCY_BASELINE=/tmp/c1.json RAG_CONCURRENCY_CANDIDATE=/tmp/cN.json make rag-concurrency-gate
```