# 心理库数据库设置指南

本文档说明如何在 Supabase 数据库中设置心理库功能所需的表和数据。

## 前提条件

1. 已创建 Supabase 项目
2. 已获取 Supabase 项目 URL 和 API Key
3. 已在小程序配置中设置 Supabase 连接信息

## 设置步骤

### 第一步：创建数据库表结构

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 创建新查询
4. 复制 `scripts/create_library_tables_improved.sql` 的全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行脚本

**执行后应创建以下表：**
- `article_categories` - 文章分类表
- `articles` - 文章表
- `article_favorites` - 文章收藏表
- `article_read_history` - 阅读历史表
- `article_likes` - 文章点赞表（可选）

**执行后应创建以下索引：**
- 文章表的多个索引（分类、时间、状态等）
- 收藏表、阅读历史表、点赞表的索引

**执行后应创建以下触发器：**
- 自动更新 `updated_at` 字段
- 自动更新文章收藏数
- 自动更新文章点赞数

**执行后应插入以下数据：**
- 7 个文章分类（情绪管理、压力应对、人际关系等）

### 第二步：插入文章数据

1. 在 **SQL Editor** 中创建新查询
2. 复制 `scripts/insert_library_articles_improved.sql` 的全部内容
3. 粘贴到 SQL Editor 中
4. 点击 **Run** 执行脚本

**执行后应插入以下数据：**
- 8 篇示例文章
- 每篇文章都关联到相应的分类
- 文章的 `category_id` 字段会自动更新

### 第三步：验证数据

执行以下 SQL 查询验证数据是否正确插入：

```sql
-- 查看所有分类
SELECT id, name, icon, sort_order FROM article_categories ORDER BY sort_order;

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
ORDER BY is_hot DESC, view_count DESC
LIMIT 10;

-- 查看所有文章的基本信息
SELECT 
    id,
    title,
    category_name,
    read_time,
    view_count,
    is_hot,
    is_new,
    published_at
FROM articles
WHERE is_active = true
ORDER BY created_at DESC;
```

### 第四步：配置数据库权限（可选）

如果启用了 Row Level Security (RLS)，需要创建相应的策略：

```sql
-- 允许所有用户读取激活的文章
CREATE POLICY "Allow public read access to articles" 
ON articles FOR SELECT 
USING (is_active = true);

-- 允许用户管理自己的收藏
CREATE POLICY "Allow users to manage their own favorites" 
ON article_favorites FOR ALL 
USING (auth.uid() = user_id);

-- 允许用户管理自己的阅读历史
CREATE POLICY "Allow users to manage their own read history" 
ON article_read_history FOR ALL 
USING (auth.uid() = user_id);
```

**注意：** 如果未启用 RLS，可以跳过此步骤。

## 常见问题

### 1. 表已存在错误

如果出现 "relation already exists" 错误，说明表已经创建。可以：
- 跳过表创建步骤，直接插入数据
- 或者先删除表（**注意：会删除所有数据**）：
  ```sql
  DROP TABLE IF EXISTS article_likes CASCADE;
  DROP TABLE IF EXISTS article_read_history CASCADE;
  DROP TABLE IF EXISTS article_favorites CASCADE;
  DROP TABLE IF EXISTS articles CASCADE;
  DROP TABLE IF EXISTS article_categories CASCADE;
  ```

### 2. 文章重复插入

`insert_library_articles_improved.sql` 使用 `ON CONFLICT (title) DO UPDATE` 来避免重复插入。如果文章标题已存在，会更新文章内容而不是插入新记录。

### 3. 分类关联失败

确保先执行 `create_library_tables_improved.sql` 插入分类数据，然后再执行 `insert_library_articles_improved.sql` 插入文章数据。文章的 `category_id` 会在插入后自动更新。

### 4. 触发器未创建

如果触发器未创建，可以手动执行：

```sql
-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 articles 表创建更新时间触发器
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5. 索引未创建

索引会在表创建后自动创建。如果索引未创建，可以手动执行：

```sql
-- 创建文章表索引
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_name ON articles(category_name);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_active ON articles(is_active);
```

## 数据维护

### 添加新文章

可以通过 Supabase Dashboard 的 Table Editor 手动添加，或者执行 SQL：

```sql
INSERT INTO articles (
    title,
    category_name,
    summary,
    content,
    read_time,
    is_hot,
    is_new,
    is_active,
    author_name,
    published_at
) VALUES (
    '文章标题',
    '分类名称',
    '文章摘要',
    '文章内容',
    5,
    false,
    true,
    true,
    '心理专家',
    NOW()
) ON CONFLICT (title) DO UPDATE SET
    summary = EXCLUDED.summary,
    content = EXCLUDED.content,
    updated_at = NOW();
```

### 更新文章

```sql
UPDATE articles 
SET 
    title = '新标题',
    summary = '新摘要',
    content = '新内容',
    updated_at = NOW()
WHERE id = '文章ID';
```

### 删除文章（软删除）

```sql
UPDATE articles 
SET is_active = false, updated_at = NOW()
WHERE id = '文章ID';
```

### 硬删除文章

```sql
DELETE FROM articles WHERE id = '文章ID';
```

**注意：** 硬删除会级联删除相关的收藏、阅读历史、点赞记录。

## 性能优化

### 1. 定期清理过期数据

```sql
-- 删除30天前的阅读历史（可选）
DELETE FROM article_read_history 
WHERE last_read_at < NOW() - INTERVAL '30 days';
```

### 2. 更新统计信息

```sql
-- 更新文章浏览数统计
UPDATE articles 
SET view_count = (
    SELECT COUNT(*) 
    FROM article_read_history 
    WHERE article_id = articles.id
);
```

### 3. 重建索引

```sql
-- 重建索引（如果需要）
REINDEX TABLE articles;
REINDEX TABLE article_favorites;
REINDEX TABLE article_read_history;
```

## 支持

如果遇到问题，请检查：
1. Supabase 项目是否正常运行
2. API Key 是否正确配置
3. 数据库表是否正确创建
4. 小程序中的 Supabase 连接配置是否正确

更多信息请参考 Supabase 官方文档：https://supabase.com/docs

