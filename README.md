# 货运园区月台预约装卸平台

## 项目简介

本平台按真实货运园区工作顺序组织装卸流程，覆盖从承运商创建预约、车辆排队校验、月台窗口节点更新、装卸计件验收，到最终车辆放行的全流程管理。系统包含三大区域：承运商待办区、月台窗口处理区（含滞留罚金展示）、放行结果区（含放行记录筛选）。

本次迭代新增两大核心能力：
- **滞留罚金处理**：车辆在月台装卸超过标准时长（默认 60 分钟）自动按每分钟 ¥1 计费，罚金出现在处理区独立面板，工作人员可标记"罚金已缴"，只有标记后车辆才能进入放行流程。
- **装卸计件与差异复核**：工作人员录入实际装卸件数，系统与预约预报件数比对，差异超过 10% 自动触发复核提醒并标记该单。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Ant Design 5
- **后端**：NestJS 10 + TypeORM + class-validator
- **数据库**：PostgreSQL 16
- **部署**：Docker Compose 一键启动

## 原始需求

> 请实现滞留罚金处理：当车辆在月台装卸时间超过标准时长（默认60分钟），系统自动计算罚金（超时每分钟1元），罚金出现在处理区（弹窗或独立面板），工作人员可标记"罚金已缴"，标记后车辆才能进入放行流程。同时增加装卸计件功能，工作人员录入实际装卸件数，系统与预约单预报件数比对，差异超过10%时触发复核提醒。

## 功能模块说明

### 1. 承运商待办区
- 承运商创建装卸预约
- 预约列表展示（预约号、承运商、车牌、司机、作业类型、件数等）
- 车辆排队边界校验（校验车牌号、司机姓名、件数等必填条件）
- 支持新建预约

### 2. 月台窗口处理区（核心功能区）
- 按真实工作节点更新：排队中 → 已到场 → 装卸中 → 已完成
- 装卸计件处理（累计装卸进度），实时展示进度条
- **装卸计件 & 差异复核**：
  - 独立「录入实际件数」弹窗，支持填写复核备注
  - 系统自动比对实际件数与预报件数
  - 差异率 > 10% 自动标记「需复核」并弹出复核提醒
  - 列表列展示实际件数、差异率、复核标记
- **滞留罚金处理（独立面板）**：
  - 列表列实时展示：当前罚金金额、缴纳状态（已缴 / 未缴）、已用时、超时时长
  - 点击「罚金详情 / 缴纳」打开独立面板：
    - 计费明细（实际用时、标准时长、超时时长三张统计卡片）
    - 当前罚金、计费标准（¥1 / 分钟）、装卸开始/完成时间
    - 支持手动调整罚金金额
    - 支持「标记罚金已缴」与「取消已缴标记」
- **放行前校验**：
  - 若滞留罚金 > 0 且未标记已缴，放行按钮自动禁用并 Tooltip 提示原因
  - 放行弹窗也会再次告警
  - 后端放行接口再次校验，双保险避免绕过

### 3. 放行结果区
- 展示所有已放行车辆的完整记录
- 放行记录筛选：支持按车牌号、承运商名称、放行日期范围筛选
- 展示字段：放行单号、预约号、车牌、承运商、预报件数、装卸进度、**实际件数与差异复核**、**滞留罚金与缴纳状态**、放行时间、放行人、备注

### 4. 固定样例数据
系统启动后自动初始化演示数据：
- **3 家承运商**：顺达物流、运通货运集团、宏远运输公司
- **5 条预约记录**：覆盖待办、排队中、装卸中、已完成等不同状态
- **2 条放行记录**：包含已结算滞留罚金的完整放行追踪记录

## 启动方式

### 前置要求

- Docker 20.10+
- Docker Compose v2.0+
- 本地 3000、3001、5432 端口未被占用

### Docker 一键启动（推荐）

#### 1. 构建并启动所有服务

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

#### 2. 访问地址

- 前端页面：http://localhost:3000
- 后端 API：http://localhost:3001/api
- PostgreSQL：localhost:5432（用户名：postgres，密码：postgres，数据库：freight_yard）

#### 3. 停止服务

```bash
docker compose down
```

如需清除数据库数据：

```bash
docker compose down -v
```

### 本地开发启动（可选）

#### 前置要求

- Node.js 20+
- PostgreSQL 14+
- pnpm 或 npm

#### 1. 启动 PostgreSQL

确保本地 PostgreSQL 已启动，并创建数据库：

```sql
CREATE DATABASE freight_yard;
```

#### 2. 启动后端服务

```bash
cd backend
npm install
npm run start:dev
```

后端默认运行在 http://localhost:3001

#### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 http://localhost:3000

## 目录结构

```
.
├── backend/                    # NestJS 后端服务
│   ├── src/
│   │   ├── carriers/           # 承运商模块（实体、DTO、服务、控制器）
│   │   ├── appointments/       # 预约装卸模块（含滞留罚金 / 计件复核逻辑）
│   │   ├── releases/           # 放行记录模块（放行前罚金校验）
│   │   ├── seed/               # 固定样例数据种子
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── PendingZone.tsx    # 承运商待办区
│   │   │   ├── ProcessingZone.tsx # 月台窗口处理区（罚金面板 + 计件复核）
│   │   │   └── ResultZone.tsx     # 放行结果区
│   │   ├── services/
│   │   │   └── api.ts             # API 接口封装
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── Dockerfile                  # 根目录默认 Dockerfile（构建后端）
├── docker-compose.yml          # 一键编排启动所有服务
├── .dockerignore
├── README.md
└── .done                       # 任务执行过程记录
```

## 核心 API 接口

### 承运商
- `GET /api/carriers` - 获取所有承运商
- `POST /api/carriers` - 创建承运商

### 预约装卸
- `GET /api/appointments` - 获取所有预约（可按 status 筛选）
- `GET /api/appointments/pending` - 获取待办/排队中的预约
- `GET /api/appointments/processing` - 获取处理中的预约
- `GET /api/appointments/released` - 获取已放行的预约
- `POST /api/appointments` - 创建预约
- `PUT /api/appointments/:id` - 更新预约状态/信息
- `POST /api/appointments/:id/queue-check` - 车辆排队边界校验
- `POST /api/appointments/:id/handle-packages` - 装卸计件处理（累计进度）
- `POST /api/appointments/:id/submit-actual-packages` - 录入实际装卸件数（返回是否需复核 + 差异率）
- `GET /api/appointments/:id/compute-detention-fee` - 计算滞留罚金（返回罚金、超时分钟、实际分钟）
- `POST /api/appointments/:id/pay-detention` - 标记/取消罚金已缴，支持手动调整罚金

### 放行记录
- `GET /api/releases` - 获取放行记录（支持 plateNumber / carrierName / startDate / endDate 筛选）
- `POST /api/releases` - 创建放行记录（执行放行，含罚金已缴校验）
