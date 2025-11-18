# 心理库功能数据库表结构文档

## 📊 表结构概览

心理库功能需要以下 5 个数据表：

1. **article_categories** - 文章分类表
2. **articles** - 文章表
3. **article_favorites** - 文章收藏表
4. **article_read_history** - 阅读历史表
5. **article_likes** - 文章点赞表（可选）

---

## 1. article_categories（文章分类表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| name | VARCHAR(50) | NOT NULL, UNIQUE | - | 分类名称 |
| icon | VARCHAR(10) | - | '📚' | 分类图标（emoji） |
| color | VARCHAR(20) | - | '#F5F5F5' | 分类颜色（用于UI） |
| description | TEXT | - | - | 分类描述 |
| sort_order | INTEGER | - | 0 | 排序顺序 |
| is_active | BOOLEAN | - | true | 是否激活 |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | - | NOW() | 更新时间 |

### 索引

- `idx_article_categories_is_active` - 过滤激活的分类
- `idx_article_categories_sort_order` - 按排序顺序查询

### 初始数据

脚本会自动插入以下分类：
- 情绪管理 😊
- 压力应对 😰
- 人际关系 👥
- 自我成长 🌱
- 睡眠健康 😴
- 焦虑抑郁 😔
- 亲子关系 👨‍👩‍👧

---

## 2. articles（文章表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| title | VARCHAR(200) | NOT NULL | - | 文章标题 |
| category_id | UUID | FOREIGN KEY | - | 分类ID（外键） |
| category_name | VARCHAR(50) | - | - | 分类名称（冗余字段） |
| summary | TEXT | NOT NULL | - | 文章摘要 |
| content | TEXT | NOT NULL | - | 文章内容 |
| read_time | INTEGER | - | 5 | 阅读时间（分钟） |
| view_count | INTEGER | - | 0 | 浏览数 |
| like_count | INTEGER | - | 0 | 点赞数 |
| favorite_count | INTEGER | - | 0 | 收藏数 |
| is_hot | BOOLEAN | - | false | 是否热门 |
| is_new | BOOLEAN | - | false | 是否新文章 |
| is_featured | BOOLEAN | - | false | 是否精选 |
| is_active | BOOLEAN | - | true | 是否激活（软删除） |
| author_id | UUID | - | - | 作者ID（可选） |
| author_name | VARCHAR(100) | - | - | 作者名称 |
| cover_image_url | TEXT | - | - | 封面图片URL |
| tags | TEXT[] | - | - | 标签数组 |
| seo_keywords | VARCHAR(200) | - | - | SEO关键词 |
| seo_description | TEXT | - | - | SEO描述 |
| published_at | TIMESTAMPTZ | - | - | 发布时间 |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | - | NOW() | 更新时间 |

### 约束

- **外键约束**: `category_id` → `article_categories(id)` ON DELETE SET NULL

### 索引

- `idx_articles_category_id` - 按分类ID查询
- `idx_articles_category_name` - 按分类名称查询
- `idx_articles_created_at` - 按创建时间排序
- `idx_articles_published_at` - 按发布时间排序
- `idx_articles_is_active` - 过滤激活的文章
- `idx_articles_is_hot` - 查询热门文章
- `idx_articles_is_new` - 查询新文章
- `idx_articles_is_featured` - 查询精选文章
- `idx_articles_view_count` - 按浏览数排序
- `idx_articles_title` - 标题搜索
- `idx_articles_tags` - 标签搜索（GIN索引）

### 触发器

- `update_articles_updated_at` - 自动更新 `updated_at` 字段

---

## 3. article_favorites（文章收藏表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| article_id | UUID | NOT NULL, FOREIGN KEY | - | 文章ID（外键） |
| user_id | UUID | NOT NULL | - | 用户ID |
| created_at | TIMESTAMPTZ | - | NOW() | 收藏时间 |

### 约束

- **外键约束**: `article_id` → `articles(id)` ON DELETE CASCADE
- **唯一约束**: `UNIQUE(article_id, user_id)` - 确保每个用户只能收藏一次

### 索引

- `idx_article_favorites_article_id` - 按文章ID查询
- `idx_article_favorites_user_id` - 按用户ID查询
- `idx_article_favorites_created_at` - 按收藏时间排序
- `idx_article_favorites_article_user` - 复合索引，检查用户是否收藏

### 触发器

- `trigger_update_article_favorite_count` - 自动更新文章的 `favorite_count` 字段

---

## 4. article_read_history（阅读历史表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| article_id | UUID | NOT NULL, FOREIGN KEY | - | 文章ID（外键） |
| user_id | UUID | NOT NULL | - | 用户ID |
| read_progress | INTEGER | - | 0 | 阅读进度（0-100） |
| read_duration | INTEGER | - | 0 | 阅读时长（秒） |
| last_read_at | TIMESTAMPTZ | - | NOW() | 最后阅读时间 |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |

### 约束

- **外键约束**: `article_id` → `articles(id)` ON DELETE CASCADE
- **唯一约束**: `UNIQUE(article_id, user_id)` - 每个用户对每篇文章只有一条记录

### 索引

- `idx_article_read_history_article_id` - 按文章ID查询
- `idx_article_read_history_user_id` - 按用户ID查询
- `idx_article_read_history_last_read_at` - 按最后阅读时间排序
- `idx_article_read_history_article_user` - 复合索引

---

## 5. article_likes（文章点赞表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| article_id | UUID | NOT NULL, FOREIGN KEY | - | 文章ID（外键） |
| user_id | UUID | NOT NULL | - | 用户ID |
| created_at | TIMESTAMPTZ | - | NOW() | 点赞时间 |

### 约束

- **外键约束**: `article_id` → `articles(id)` ON DELETE CASCADE
- **唯一约束**: `UNIQUE(article_id, user_id)` - 确保每个用户只能点赞一次

### 索引

- `idx_article_likes_article_id` - 按文章ID查询
- `idx_article_likes_user_id` - 按用户ID查询
- `idx_article_likes_article_user` - 复合索引

### 触发器

- `trigger_update_article_like_count` - 自动更新文章的 `like_count` 字段

---

## 🔗 表关系图

```
article_categories (1) ──< (N) articles
                              │
                              │ (1)
                              │
                              ├──< (N) article_favorites
                              ├──< (N) article_read_history
                              └──< (N) article_likes
```

- 一个分类可以有多个文章（1:N）
- 一篇文章可以有多个收藏（1:N）
- 一篇文章可以有多个阅读记录（1:N）
- 一篇文章可以有多个点赞（1:N）
- 删除文章时，相关的收藏、阅读历史、点赞会自动删除（CASCADE）

---

## 📝 SQL 创建脚本

完整的 SQL 创建脚本位于：`scripts/create_library_tables.sql`

### 快速执行步骤

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`etvdmnsernfiegfeadad`
3. 进入 **SQL Editor**
4. 复制 `scripts/create_library_tables.sql` 中的全部内容
5. 粘贴到 SQL Editor
6. 点击 **Run** 执行

---

## ✅ 验证表是否创建成功

执行以下 SQL 查询：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes');
```

应该返回 5 行结果。

或者执行验证脚本：`scripts/verify_library_tables.sql`

---

## 🔍 示例查询

### 查询所有激活的文章（按时间倒序）

```sql
SELECT * 
FROM articles 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 20;
```

### 查询某个分类的文章

```sql
SELECT * 
FROM articles 
WHERE category_name = '情绪管理' 
  AND is_active = true 
ORDER BY created_at DESC;
```

### 查询热门文章

```sql
SELECT * 
FROM articles 
WHERE is_hot = true 
  AND is_active = true 
ORDER BY view_count DESC 
LIMIT 10;
```

### 查询用户收藏的文章

```sql
SELECT a.* 
FROM articles a
JOIN article_favorites af ON a.id = af.article_id
WHERE af.user_id = 'your-user-id'
ORDER BY af.created_at DESC;
```

### 查询用户阅读历史

```sql
SELECT a.*, arh.read_progress, arh.last_read_at
FROM articles a
JOIN article_read_history arh ON a.id = arh.article_id
WHERE arh.user_id = 'your-user-id'
ORDER BY arh.last_read_at DESC
LIMIT 50;
```

### 检查用户是否收藏了某篇文章

```sql
SELECT EXISTS(
    SELECT 1 
    FROM article_favorites 
    WHERE article_id = 'article-id' 
      AND user_id = 'user-id'
) as is_favorited;
```

### 增加文章浏览数

```sql
UPDATE articles 
SET view_count = view_count + 1 
WHERE id = 'article-id';
```

---

## 📊 数据统计查询

### 统计总文章数

```sql
SELECT COUNT(*) as total_articles
FROM articles
WHERE is_active = true;
```

### 按分类统计文章数

```sql
SELECT 
    category_name,
    COUNT(*) as article_count
FROM articles
WHERE is_active = true
GROUP BY category_name
ORDER BY article_count DESC;
```

### 统计最受欢迎的文章

```sql
SELECT 
    title,
    view_count,
    favorite_count,
    like_count
FROM articles
WHERE is_active = true
ORDER BY (view_count + favorite_count * 2 + like_count) DESC
LIMIT 10;
```

---

## ⚠️ 注意事项

1. **外键级联删除**：删除文章时会自动删除相关的收藏、阅读历史、点赞
2. **唯一约束**：每个用户对每篇文章只能收藏/点赞一次
3. **软删除**：使用 `is_active` 字段实现软删除，不会真正删除数据
4. **自动统计**：收藏数和点赞数通过触发器自动更新
5. **性能优化**：已创建必要的索引，但根据实际使用情况可能需要调整
6. **时间戳**：使用 `TIMESTAMPTZ` 类型存储时间，自动处理时区
7. **数组字段**：`tags` 字段使用 PostgreSQL 数组类型，支持标签搜索

---

## 🔄 数据迁移（如果需要）

如果之前使用本地存储，可以编写迁移脚本将本地数据导入数据库：

```sql
-- 示例：插入文章数据
INSERT INTO articles (title, category_name, summary, content, read_time, is_hot, is_new, published_at)
VALUES 
    ('文章标题1', '情绪管理', '文章摘要1', '文章内容1', 5, true, false, NOW()),
    ('文章标题2', '压力应对', '文章摘要2', '文章内容2', 8, true, false, NOW());
```

---

## 🛠️ 维护建议

1. **定期清理**：考虑添加数据归档机制（定期归档旧文章）
2. **索引优化**：根据查询模式调整索引
3. **性能监控**：监控慢查询，优化性能瓶颈
4. **备份策略**：定期备份重要数据
5. **内容审核**：添加内容审核机制，确保文章质量

