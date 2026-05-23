# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

诺力CPQ选配器（Noblelift CPQ）— 叉车产品配置、定价、报价系统。前后台分离架构。

## 技术栈

- 前端: Vue 3 + Vite + Pinia + Vue Router 4 + Element Plus + TypeScript
- 后端: Express.js + TypeScript + Prisma ORM + Socket.io
- 数据库: PostgreSQL
- PDF: pdfkit

## 常用命令

```bash
npm install                          # 安装所有依赖（workspaces）
npm run db:generate                  # 生成 Prisma Client
npm run db:migrate                   # 数据库迁移
npm run db:seed                      # 填充种子数据
npm run db:studio                    # Prisma Studio (可视化数据管理)
npm run dev                          # 同时启动前后端
npm run dev:server                   # 仅启动后端 (localhost:3000)
npm run dev:client                   # 仅启动前端 (localhost:5173)
npm run build                        # 构建全部
npm run build:server                 # 仅构建后端
npm run build:client                 # 仅构建前端

# 单独编译检查
cd server && npx tsc --noEmit        # 后端类型检查
cd client && npx vue-tsc --noEmit    # 前端类型检查
```

## 项目结构

```
NL-CPQ/
├── prisma/
│   ├── schema.prisma      # 数据模型 (11 模型 + 4 枚举，见下方数据模型章节)
│   └── seed.ts            # 种子数据 (EFS151 叉车 + 14 个配置组)
├── server/src/
│   ├── index.ts           # 入口 (Express + Socket.io)
│   ├── app.ts             # Express 配置 (cors, json, routes)
│   ├── middleware/
│   │   ├── auth.ts        # JWT 认证 (支持 Bearer header 和 ?token= query)
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts              # 注册/登录/me
│   │   ├── portal/quote.routes.ts      # 前台: 报价 CRUD + PDF 下载 + 价格计算
│   │   ├── portal/product.routes.ts    # 前台: 产品列表 + 配置树
│   │   ├── admin/product.routes.ts     # 后台: 产品/配置组/配置值 CRUD
│   │   ├── admin/quote.routes.ts       # 后台: 全部报价管理 + 状态更新
│   │   └── admin/user.routes.ts        # 后台: 用户管理
│   └── services/
│       ├── auth.service.ts             # JWT + bcryptjs
│       ├── product.service.ts          # 产品/配置组/配置值 CRUD
│       ├── pricing.service.ts          # 价格计算引擎
│       ├── quote.service.ts            # 报价生命周期管理
│       └── pdf.service.ts             # PDF 生成 (pdfkit)
├── client/src/
│   ├── router/index.ts     # 路由: /login, /portal/*, /admin/*
│   ├── api/client.ts       # Axios 实例 (JWT 拦截器, 401 → /login)
│   ├── layouts/
│   │   ├── PortalLayout.vue   # 前台: el-header 顶部导航
│   │   └── AdminLayout.vue    # 后台: el-aside 侧边栏 + el-main
│   ├── stores/             # Pinia: auth.store, product.store, quote.store
│   ├── views/portal/       # 前台页面
│   │   ├── ProductConfigView.vue  # 核心选配报价页 (左侧配置面板 + 右侧价格面板)
│   │   ├── QuoteDetailView.vue    # 报价详情 + PDF下载 + 在线打印
│   │   ├── QuoteListView.vue
│   │   └── ProductListView.vue
│   └── views/admin/        # 后台管理页面
│       ├── ProductManageView.vue   # 产品 CRUD
│       ├── OptionManageView.vue   # 配置组/配置值管理
│       ├── QuoteManageView.vue     # 报价管理 + 状态审批
│       ├── UserManageView.vue     # 用户角色/状态管理
│       └── DashboardView.vue      # 概览统计
```

## 路由结构

```
/login                  → 登录页 (按角色跳转: ADMIN → /admin/dashboard, 其他 → /portal/products)
/                         → 重定向到 /portal/products
/portal/products         → 产品列表
/portal/config/:id       → 选配报价页 (核心)
/portal/quotes           → 我的报价
/portal/quotes/:id       → 报价详情 + PDF + 打印
/admin/dashboard         → 后台控制台
/admin/products          → 产品管理
/admin/products/:id/options → 配置项管理
/admin/quotes            → 报价管理
/admin/users             → 用户管理
/:pathMatch(.*)*         → catch-all 404
```

## 认证

- JWT 存储在 localStorage (`token`, `user`)
- 请求通过 Axios 拦截器自动注入 `Authorization: Bearer <token>`
- PDF 下载通过 `?token=` query 传参 (window.open 无法设置 header)
- 路由守卫: `meta.admin` → 仅 ADMIN 角色可访问后台

## 种子数据

默认账号: `admin@noblelift.com` / `admin123` (管理员), `sales@noblelift.com` / `sales123` (销售员)
种子产品: EFS151 电动叉车，含 14 个配置组 (Battery, Charger, Fork length, Mast Height, Shifter, Tyres, GPS, Fog Light, Rotate Warning, extra Bluespot, Side Line Light, Warning Light, Working Light, Truck Color)

## 数据库

需要本地运行 PostgreSQL，连接字符串在 `.env` 的 `DATABASE_URL`。首次运行前执行 `npm run db:migrate` 创建表结构，然后 `npm run db:seed` 填充种子数据。

### 数据模型

| 模型 | 说明 |
|------|------|
| User | 用户 (邮箱、密码哈希、角色、激活状态) |
| ProductCategory | 产品分类 (树形自引用，如 Truck Type → Chassis Model) |
| Product | 产品型号 (SKU、名称、基础价、关联分类) |
| StandardSpec | 产品标准规格说明 |
| OptionGroup | 配置组 (必选/多选、关联产品) |
| OptionValue | 配置值 (标签、价格增量、是否默认) |
| DependencyRule | 依赖规则 (REQUIRES / EXCLUDES / ALLOW_ONLY) |
| Quote | 报价单 (客户名、状态、价格汇总、有效期) |
| QuoteItem | 报价行项 (选中的配置值快照) |
| QuoteDiscount | 报价折扣 (百分比 / 固定金额) |
| QuoteHistory | 报价版本快照 (JSON 存储完整状态) |

枚举: `Role` (ADMIN/SALES/MANAGER), `RuleType` (REQUIRES/EXCLUDES/ALLOW_ONLY), `DiscountType` (PERCENTAGE/FIXED), `QuoteStatus` (DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED)

## 系统概览

```
┌──────────────────────────────────────────────────┐
│                    前台 (Portal)                  │
│  用户登录 → 选配产品 → 生成报价 → 下载PDF/打印    │
├──────────────────────────────────────────────────┤
│                    后台 (Admin)                   │
│  管理员 → 车型管理 / 选配管理 / 价格管理 / 报价管理 │
└──────────────────────────────────────────────────┘
```

---

## 一、前台功能（Portal — 客户/销售员使用）

| 功能 | 说明 |
|------|------|
| 登录/注册 | 邮箱 + 密码，JWT 认证 |
| 产品选配 | 选择车型 → 勾选配置项 → 左侧配置面板，右侧实时价格 |
| 报价生成 | 填入客户名、数量 → 生成报价单 |
| 报价列表 | 查看自己创建的报价，按状态筛选 |
| 报价详情 | 查看报价完整配置 + 价格明细 |
| PDF 下载 | 报价导出为 PDF 文件（含配置明细 + 价格） |
| 在线打印 | 浏览器调用打印功能，直接打印报价单 |

## 二、后台功能（Admin — 管理员使用）

| 功能 | 说明 |
|------|------|
| 登录 | 仅管理员角色可进入后台 |
| 产品分类管理 | 管理 Truck Type / Chassis Model 两级分类 |
| 产品型号管理 | CRUD 产品型号（SKU、名称、基础价、标准规格） |
| 配置组管理 | 为每个产品型号定义可选配置组（Battery、Charger...） |
| 配置值管理 | 为每个配置组定义可选值 + 价格增量 |
| 依赖规则管理 | 定义配置项之间的约束规则（必选/互斥/依赖） |
| 价格表管理 | 管理多套价格（零售价、渠道价），价格调整影响基础价 |
| 折扣管理 | 定义可用折扣类型（百分比/固定金额） |
| 报价管理 | 查看所有报价，审批报价，查看报价历史 |
| 用户管理 | 管理用户账号、角色分配 |

---

# 行为准则

减少常见 LLM 编码错误的行为准则。根据需要与项目特定说明合并使用。

**权衡：** 这些准则偏向谨慎而非速度。对于简单任务，可自行判断。

## 1. 先思考，再编码

**不要假设。不要隐藏困惑。明确列出权衡。**

实施之前：
- 明确陈述你的假设。如果不确定，请提问。
- 如果存在多种理解方式，把它们列出来——不要默默选一个。
- 如果有更简单的方法，指出来。必要时可以反驳。
- 如果有不清楚的地方，停下来。说清楚哪里困惑。然后提问。

## 2. 简单至上

**用最少的代码解决问题。不做投机性开发。**

- 不添加需求之外的功能。
- 不为单一用途的代码创建抽象。
- 不添加未要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景添加错误处理。
- 如果写了 200 行但 50 行就能搞定，重写。

问自己："高级工程师会觉得这过度复杂吗？"如果是，就简化。

## 3. 精准修改

**只改必须改的。只清理自己弄乱的。**

编辑现有代码时：
- 不要"改进"无关的代码、注释或格式。
- 不要重构没坏的东西。
- 匹配现有风格，即使你本来会用不同的写法。
- 如果注意到无关的死代码，提出来——但别删。

当你的改动导致孤立代码时：
- 删除因你的改动而变得无用的导入/变量/函数。
- 不要删除之前就存在的死代码，除非被明确要求。

检验标准：每一处改动都应该能追溯到用户的具体需求。

## 4. 目标驱动执行

**定义成功标准。循环迭代直到验证通过。**

将任务转化为可验证的目标：
- "添加验证" → "先为无效输入编写测试，然后让测试通过"
- "修复 bug" → "先写一个能复现 bug 的测试，然后修复"
- "重构 X" → "确保重构前后测试全部通过"

对于多步骤任务，给出简要计划：
```
1. [步骤] → 验证: [检查项]
2. [步骤] → 验证: [检查项]
3. [步骤] → 验证: [检查项]
```

清晰的验收标准让你能够独立迭代。模糊的标准（"把它做好"）则需要不断追问。

---

**这些准则有效的标志是：** diff 中不必要的改动变少，因过度复杂导致的重写变少，澄清性问题在实施之前提出而不是在犯错之后。