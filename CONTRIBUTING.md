# 贡献指南

感谢您对 HeartHarborx 项目的关注！我们欢迎各种形式的贡献。

## 开发环境设置

### 前置要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### 项目设置
```bash
# 克隆项目
git clone <repository-url>
cd heartharborx

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 开发流程

### 1. 创建分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 开发代码
- 遵循项目的代码规范
- 添加必要的测试
- 更新文档

### 3. 提交代码
```bash
# 添加更改
git add .

# 提交更改
git commit -m "feat: 添加新功能描述"

# 推送到远程仓库
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request
- 在 GitHub 上创建 Pull Request
- 描述你的更改内容和目的
- 关联相关的 Issue

## 代码规范

### Vue.js 规范
- 使用 2 空格缩进
- 组件名使用 PascalCase
- 属性名使用 camelCase
- 模板中使用 kebab-case

### JavaScript 规范
- 使用 ES6+ 语法
- 避免使用 var，使用 const 和 let
- 使用箭头函数
- 使用模板字符串

### 文件命名
- Vue 组件：PascalCase，如 `UserProfile.vue`
- JavaScript 文件：camelCase，如 `userService.js`
- 工具函数：camelCase，如 `formatDate.js`

## 提交信息规范

使用约定式提交格式：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 示例
```
feat(auth): 添加用户登录功能

- 实现微信登录
- 添加登录状态管理
- 更新相关文档

Closes #123
```

## 测试

### 单元测试
```bash
# 运行测试
npm test

# 生成测试覆盖率报告
npm run test:coverage
```

### 端到端测试
```bash
# 运行端到端测试
npm run test:e2e
```

## 代码审查

所有 Pull Request 都需要经过代码审查：

### 审查要点
- 代码质量
- 功能完整性
- 测试覆盖
- 文档更新
- 性能影响

### 审查流程
1. 至少需要 1 名核心贡献者批准
2. 所有 CI 检查必须通过
3. 解决所有审查意见

## 问题报告

### 报告 Bug
1. 搜索是否已有相关 Issue
2. 创建新的 Issue
3. 提供详细的复现步骤
4. 包含环境信息

### 功能请求
1. 描述功能需求
2. 说明使用场景
3. 提供参考实现（可选）

## 发布流程

### 版本管理
项目使用语义化版本控制：
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 发布步骤
1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建发布标签
4. 发布到 npm

## 行为准则

我们致力于为所有贡献者提供友好、尊重的环境。请遵守以下行为准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 接受建设性的批评
- 专注于对社区最有利的事情

## 获取帮助

- 查看 [README.md](./README.md)
- 搜索现有的 Issue 和 Pull Request
- 在讨论区提问
- 联系核心维护者

---

感谢您的贡献！🎉