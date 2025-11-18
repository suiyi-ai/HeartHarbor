# 心理库文章数据存储说明

## 概述

本文档说明如何将心理库文章数据存储到 Supabase 数据库中。

## 步骤

### 1. 创建数据库表

首先，执行 `scripts/create_library_tables.sql` 脚本创建必要的数据库表：

- `article_categories` - 文章分类表
- `articles` - 文章表
- `article_favorites` - 文章收藏表
- `article_read_history` - 阅读历史表
- `article_likes` - 文章点赞表（可选）

### 2. 插入文章数据

执行 `scripts/insert_library_articles.sql` 脚本插入文章数据。

这个脚本会：
- 插入 8 篇文章到 `articles` 表
- 自动关联文章和分类（通过 `category_name` 字段）
- 设置文章的属性（热门、新文章、阅读时间、浏览数等）

### 3. 验证数据

执行以下 SQL 查询验证数据：

```sql
-- 查看文章数量
SELECT COUNT(*) as article_count FROM articles WHERE is_active = true;

-- 查看每个分类的文章数量
SELECT 
    c.name as category_name,
    COUNT(a.id) as article_count
FROM article_categories c
LEFT JOIN articles a ON a.category_id = c.id AND a.is_active = true
GROUP BY c.name
ORDER BY c.sort_order;

-- 查看热门文章
SELECT id, title, category_name, view_count, is_hot, is_new
FROM articles
WHERE is_active = true
ORDER BY is_hot DESC, view_count DESC;
```

## 功能说明

### 文章列表加载

- 从数据库加载文章列表
- 支持按分类筛选
- 支持搜索（标题搜索）
- 支持分页加载
- 自动加载收藏状态

### 文章详情

- 从数据库加载文章详情
- 自动保存阅读历史
- 自动增加浏览数
- 显示收藏状态

### 收藏功能

- 收藏状态存储在 `article_favorites` 表
- 支持添加/取消收藏
- 收藏数自动更新（通过数据库触发器）
- 支持本地存储作为备用

### 阅读历史

- 阅读历史存储在 `article_read_history` 表
- 自动记录阅读进度和阅读时长
- 支持查询用户的阅读历史
- 支持本地存储作为备用

## 注意事项

1. **用户登录**：收藏和阅读历史功能需要用户登录。如果用户未登录，功能会使用本地存储作为备用。

2. **数据同步**：数据库操作失败时，会自动使用本地存储作为备用，确保功能可用。

3. **搜索功能**：当前搜索功能使用标题字段。如果需要更复杂的搜索（如全文搜索），可以使用 PostgreSQL 的全文搜索功能或 Supabase 的 RPC 函数。

4. **分类关联**：文章通过 `category_name` 字段关联分类，同时也有 `category_id` 外键关联。如果分类不存在，`category_id` 可能为 NULL。

5. **数据格式**：数据库中的字段使用下划线命名（如 `view_count`），前端代码会自动转换为驼峰命名（如 `viewCount`）。

## 故障排除

### 文章加载失败

如果文章加载失败，检查：
1. 数据库表是否创建成功
2. 文章数据是否插入成功
3. Supabase 连接是否正常
4. 用户是否已登录（如果需要）

### 收藏功能不工作

如果收藏功能不工作，检查：
1. `article_favorites` 表是否创建成功
2. 用户是否已登录
3. 数据库触发器是否正常工作
4. 网络连接是否正常

### 阅读历史不保存

如果阅读历史不保存，检查：
1. `article_read_history` 表是否创建成功
2. 用户是否已登录
3. 数据库连接是否正常
4. 浏览数是否正常更新

## 后续改进

1. **全文搜索**：实现更强大的全文搜索功能
2. **推荐系统**：基于用户阅读历史推荐相关文章
3. **阅读统计**：统计用户的阅读时长和阅读习惯
4. **文章评分**：允许用户对文章进行评分
5. **评论功能**：允许用户对文章进行评论

