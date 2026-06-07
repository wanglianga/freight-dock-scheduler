# 货运园区月台预约装卸平台

## 项目简介

本平台按真实货运园区工作顺序组织装卸流程，覆盖从承运商创建预约、车辆排队校验、月台窗口节点更新、装卸计件验收，到最终车辆放行的全流程管理。系统包含三大区域：承运商待办区、月台窗口处理区（含滞留罚金展示）、放行结果区（含放行记录筛选）。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Ant Design 5
- **后端**：NestJS 10 + TypeORM + class-validator
- **数据库**：PostgreSQL 16
- **部署**：Docker Compose 一键启动

## 原始需求

> 货运园区月台预约装卸平台按真实工作顺序组织：承运商进入待办，月台窗口更新节点，车辆排队校验边界，装卸计件输出验收信息。针对货运园区月台预约装卸平台，滞留罚金需要出现在处理区，放行记录需要进入结果区和筛选条件。货运园区月台预约装卸平台交付时给一组固定样例，覆盖承运商创建、车辆排队处理和放行记录追踪，前端用React编写，后端要求NestJS，数据落在PostgreSQL里。

## 功能模块说明

### 1. 承运商待办区
- 承运商创建装卸预约
- 预约列表展示（预约号、承运商、车牌、司机、作业类型、件数等）
- 车辆排队边界校验（校验车牌号、司机姓名、件数等必填条件）
- 支持新建预约

### 2. 月台窗口处理区
- 按真实工作节点更新：排队中 → 已到场 → 装卸中 → 已完成
- 装卸计件处理，实时展示进度条
- **滞留罚金展示与设置**：在处理区表格中直接展示滞留罚金金额，支持设置和修改
- 装卸完成后可执行放行操作

### 3. 放行结果区
- 展示所有已放行车辆的完整记录
- **放行记录筛选条件**：支持按车牌号、承运商名称、放行日期范围进行筛选
- 包含放行单号、关联预约号、车牌、承运商、件数、滞留罚金、放行时间、放行人等完整信息

### 4. 固定样例数据
系统启动后自动初始化以下演示数据：
- **3家承运商**：顺达物流、运通货运集团、宏远运输公司
- **5条预约记录**：覆盖待办、排队中、装卸中、已完成等不同状态
- **2条放行记录**：包含已结算滞留罚金的完整放行追踪记录

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
│   │   ├── appointments/       # 预约装卸模块（实体、DTO、服务、控制器）
│   │   ├── releases/           # 放行记录模块（实体、DTO、服务、控制器）
│   │   ├── seed/               # 固定样例数据种子
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── PendingZone.tsx    # 承运商待办区（含车辆排队校验）
│   │   │   ├── ProcessingZone.tsx # 月台窗口处理区（含滞留罚金）
│   │   │   └── ResultZone.tsx     # 放行结果区（含筛选条件）
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
- `PUT /api/carriers/:id` - 更新承运商

### 预约装卸
- `GET /api/appointments` - 获取所有预约（可按 status 筛选）
- `GET /api/appointments/pending` - 获取待办/排队中的预约
- `GET /api/appointments/processing` - 获取处理中的预约
- `GET /api/appointments/released` - 获取已放行的预约
- `POST /api/appointments` - 创建预约
- `PUT /api/appointments/:id` - 更新预约状态/信息
- `POST /api/appointments/:id/queue-check` - 车辆排队边界校验
- `POST /api/appointments/:id/handle-packages` - 装卸计件处理

### 放行记录
- `GET /api/releases` - 获取放行记录（支持 plateNumber / carrierName / startDate / endDate 筛选）
- `POST /api/releases` - 创建放行记录（执行放行）
