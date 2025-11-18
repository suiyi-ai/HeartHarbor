# 修复 article-detail 页面依赖分析错误

## 问题描述

微信小程序报错：
```
pages/library/article-detail.js 已被代码依赖分析忽略，无法被其他模块引用
```

## 解决方案

### 方案 1: 关闭"过滤无依赖文件"功能（推荐）

1. 打开微信开发者工具
2. 点击右上角的 **设置** 图标
3. 选择 **项目设置**
4. 在 **本地设置** 中，取消勾选 **"过滤无依赖文件"** 选项
5. 重新编译项目

### 方案 2: 确保页面正确注册

页面已经在 `pages.json` 中正确注册，位置在 `pages/library/library` 之后：

```json
{
  "path": "pages/library/article-detail",
  "style": {
    "navigationBarTitleText": "文章详情",
    "navigationBarBackgroundColor": "#E6F3FF",
    "navigationBarTextStyle": "black",
    "enablePullDownRefresh": false
  }
}
```

### 方案 3: 清理缓存并重新编译

1. 在微信开发者工具中，点击 **工具** → **清除缓存** → **清除全部**
2. 关闭微信开发者工具
3. 重新打开项目
4. 重新编译

### 方案 4: 检查文件路径

确保文件路径正确：
- 文件位置：`pages/library/article-detail.vue`
- pages.json 中的路径：`pages/library/article-detail`

路径必须完全匹配。

## 验证修复

修复后，尝试以下操作验证：

1. 在心理库页面点击任意文章
2. 应该能正常跳转到文章详情页
3. 控制台不应该再出现依赖分析错误

## 如果问题仍然存在

1. 检查 `pages.json` 文件格式是否正确（JSON 格式）
2. 检查 `article-detail.vue` 文件是否有语法错误
3. 尝试删除 `unpackage` 目录，重新编译
4. 检查微信开发者工具版本，确保使用最新版本

