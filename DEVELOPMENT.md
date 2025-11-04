# 开发指南

本文档提供 HeartHarborx 项目的详细开发指南。

## 项目架构

### 技术栈
- **前端框架**: uni-app + Vue 2.7.14
- **构建工具**: @vue/cli-service
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: Dify API
- **小程序**: 微信小程序

### 目录结构
```
HeartHarborx/
├── pages/                 # 页面组件
│   ├── ai/               # AI聊天页面
│   ├── hole/             # 树洞页面
│   ├── index/            # 首页
│   ├── library/          # 心理库
│   └── mine/            # 个人中心
├── utils/                # 工具函数
│   └── supabase.js      # Supabase服务
├── static/              # 静态资源
├── scripts/             # 开发脚本
├── unpackage/           # 构建输出
└── 配置文件
    ├── package.json     # 项目配置
    ├── manifest.json   # 应用配置
    ├── pages.json       # 页面路由
    └── project.config.json # 微信配置
```

## 开发环境

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 微信开发者工具

### 快速开始
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 开发脚本
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run clean` - 清理构建文件
- `npm run check-env` - 检查环境配置
- `npm run lint` - 代码规范检查
- `npm run lint:fix` - 自动修复代码规范问题

## 核心功能开发

### AI聊天功能

#### 文件位置
- 页面组件: `pages/ai/ai.vue`
- 服务逻辑: `utils/supabase.js`

#### 主要功能
1. **对话管理**: 创建、保存、加载对话
2. **消息处理**: 发送、接收、显示消息
3. **AI集成**: Dify API 调用
4. **数据存储**: Supabase 数据库操作

#### 代码示例
```javascript
// 创建对话
const conversation = await conversationService.createConversation(
  '对话标题',
  '角色ID',
  '风格ID'
)

// 发送消息
await conversationService.saveMessage(
  conversation.id,
  'user',
  '用户消息内容'
)
```

### Supabase 集成

#### 配置
- 配置文件: `utils/supabase.js`
- 环境变量: `.env.example`

#### 主要功能
- 用户对话管理
- 消息存储
- 数据查询和统计

#### 数据库表结构
```sql
-- 对话表
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  role_id TEXT,
  style_id TEXT,
  created_at TIMESTAMP
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  role TEXT,
  content TEXT,
  created_at TIMESTAMP
);
```

## 样式开发

### 设计规范
- **主色调**: `#1890FF`
- **背景色**: 渐变蓝白 `#E6F3FF` 到 `#F5F9FF`
- **字体**: 系统默认字体
- **单位**: 使用 rpx 确保多端适配

### 样式文件
- 全局样式: `uni.scss`
- 组件样式: 各组件内的 `<style>` 部分

### 响应式设计
```scss
// 使用 rpx 单位
.container {
  width: 750rpx; // 小程序标准宽度
  padding: 32rpx;
}

// 媒体查询
@media (max-width: 750rpx) {
  .container {
    padding: 16rpx;
  }
}
```

## 测试

### 单元测试
```bash
# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage
```

### 端到端测试
```bash
# 运行端到端测试
npm run test:e2e
```

## 部署

### 微信小程序
1. 构建项目: `npm run build`
2. 使用微信开发者工具导入项目
3. 上传代码到微信平台
4. 提交审核并发布

### 环境配置
- 开发环境: `NODE_ENV=development`
- 生产环境: `NODE_ENV=production`

## 性能优化

### 代码分割
- 使用 uni-app 的页面懒加载
- 按需引入第三方库

### 资源优化
- 图片压缩
- 代码压缩
- 缓存策略

### 内存管理
- 及时清理无用数据
- 避免内存泄漏
- 使用虚拟列表优化长列表

## 调试

### 开发工具
- 微信开发者工具
- Vue Devtools
- 浏览器开发者工具

### 调试技巧
```javascript
// 添加调试日志
console.log('调试信息:', data)

// 使用断点
debugger

// 性能分析
console.time('操作名称')
// ... 操作代码
console.timeEnd('操作名称')
```

## 常见问题

### 依赖问题
```bash
# 清理并重新安装依赖
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 构建错误
- 检查 Node.js 版本
- 确认依赖版本兼容性
- 查看详细错误日志

### 微信小程序问题
- 检查 AppID 配置
- 确认项目路径正确
- 查看微信开发者工具控制台

## 贡献指南

请参考 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何为项目做出贡献。

---

如有问题，请查看文档或联系开发团队。