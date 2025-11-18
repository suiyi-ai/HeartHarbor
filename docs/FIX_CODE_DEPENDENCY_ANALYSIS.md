# 修复微信小程序代码依赖分析错误

## 问题描述

错误信息：
```
pages/library/article-detail.js 已被代码依赖分析忽略，无法被其他模块引用
```

## 问题原因

微信开发者工具的"代码依赖分析"功能会分析代码中的静态引用，如果页面路径是通过动态字符串拼接的，可能无法被识别，导致页面被标记为"无依赖文件"并被忽略。

## 解决方案

### 方案 1: 关闭"过滤无依赖文件"功能（推荐，最简单）

1. 打开微信开发者工具
2. 点击右上角的 **设置** 图标（齿轮图标）
3. 选择 **项目设置**
4. 在 **本地设置** 标签页中，找到 **"过滤无依赖文件"** 选项
5. **取消勾选** 该选项
6. 关闭并重新打开微信开发者工具
7. 重新编译项目

### 方案 2: 清理缓存并重新编译

1. 在微信开发者工具中，点击菜单栏 **工具** → **清除缓存** → **清除全部**
2. 关闭微信开发者工具
3. 删除项目根目录下的 `unpackage` 文件夹（如果存在）
4. 重新打开微信开发者工具
5. 重新编译项目

### 方案 3: 验证页面配置

确保以下配置正确：

1. **pages.json 中的页面路径**：
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

2. **文件路径**：
   - 文件位置：`pages/library/article-detail.vue`
   - pages.json 中的路径：`pages/library/article-detail`
   - 两者必须完全匹配（不包括 .vue 扩展名）

3. **project.config.json 中的 condition 配置**：
   ```json
   {
     "condition": {
       "miniprogram": {
         "list": [
           {
             "name": "文章详情页",
             "pathName": "pages/library/article-detail",
             "query": "id=1&title=测试文章",
             "launchMode": "default"
           }
         ]
       }
     }
   }
   ```

### 方案 4: 检查代码引用

代码中已经使用了页面路径常量：

```javascript
// 在 pages/library/library.vue 中
const ARTICLE_DETAIL_PAGE = '/pages/library/article-detail'

// 使用常量
const articleDetailUrl = ARTICLE_DETAIL_PAGE + `?id=${article.id}&title=${encodeURIComponent(article.title)}`
uni.navigateTo({
    url: articleDetailUrl
})
```

### 方案 5: 使用 project.config.json 配置

已在 `project.config.json` 中添加了以下配置：

```json
{
  "setting": {
    "ignoreDevUnusedFiles": false,
    "ignoreUploadUnusedFiles": false
  },
  "condition": {
    "miniprogram": {
      "list": [
        {
          "name": "文章详情页",
          "pathName": "pages/library/article-detail",
          "query": "id=1&title=测试文章",
          "launchMode": "default"
        }
      ]
    }
  }
}
```

## 验证修复

修复后，执行以下操作验证：

1. **清理缓存**：工具 → 清除缓存 → 清除全部
2. **重新编译**：点击编译按钮
3. **检查控制台**：不应该再出现依赖分析错误
4. **测试导航**：在心理库页面点击文章，应该能正常跳转

## 如果问题仍然存在

### 步骤 1: 检查文件是否存在

确保文件 `pages/library/article-detail.vue` 存在且可读。

### 步骤 2: 检查 pages.json 格式

确保 `pages.json` 文件格式正确，没有语法错误：
- 使用 JSON 格式验证工具检查
- 确保所有引号、逗号、括号匹配

### 步骤 3: 检查微信开发者工具版本

确保使用最新版本的微信开发者工具：
- 帮助 → 关于 → 检查更新
- 或者从官网下载最新版本

### 步骤 4: 重新创建项目

如果以上方法都不行，可以尝试：
1. 备份项目代码
2. 在微信开发者工具中新建项目
3. 将代码复制到新项目
4. 重新配置

## 临时解决方案

如果暂时无法修复，可以使用以下临时方案：

1. **使用弹窗显示文章内容**（已在代码中实现）
2. **使用 web-view 组件**显示文章（需要配置业务域名）
3. **使用 reLaunch 代替 navigateTo**（会关闭所有页面）

## 相关文档

- [微信小程序代码依赖分析文档](https://developers.weixin.qq.com/community/develop/article/doc/00020631afc6c8c6f62e7b91855c13)
- [uni-app 页面路由文档](https://uniapp.dcloud.net.cn/api/router.html)

