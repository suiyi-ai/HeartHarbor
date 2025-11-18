# 心理库功能数据库表创建指南

## 📋 快速开始

### 步骤 1: 登录 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`etvdmnsernfiegfeadad`
3. 进入 **SQL Editor**（左侧菜单）

### 步骤 2: 执行创建脚本

1. 打开 `scripts/create_library_tables.sql` 文件
2. 复制全部 SQL 代码
3. 粘贴到 Supabase SQL Editor
4. 点击 **Run** 按钮执行

### 步骤 3: 验证表是否创建成功

1. 打开 `scripts/verify_library_tables.sql` 文件
2. 复制全部 SQL 代码
3. 在 SQL Editor 中执行
4. 检查结果，应该看到 5 个表都已创建

或者直接在 **Table Editor** 中查看，应该能看到：
- ✅ `article_categories`
- ✅ `articles`
- ✅ `article_favorites`
- ✅ `article_read_history`
- ✅ `article_likes`

---

## 📊 表结构总览

### 1. article_categories（分类表）

存储文章分类信息，包括分类名称、图标、颜色等。

**主要字段：**
- `name` - 分类名称（唯一）
- `icon` - 分类图标（emoji）
- `color` - 分类颜色（用于UI）
- `sort_order` - 排序顺序

### 2. articles（文章表）

存储所有心理知识文章信息。

**主要字段：**
- `title` - 文章标题
- `category_id` / `category_name` - 分类信息
- `summary` - 文章摘要
- `content` - 文章内容
- `read_time` - 阅读时间（分钟）
- `view_count` - 浏览数
- `like_count` - 点赞数
- `favorite_count` - 收藏数
- `is_hot` / `is_new` / `is_featured` - 文章标签

### 3. article_favorites（收藏表）

存储用户对文章的收藏记录。

**主要字段：**
- `article_id` - 文章ID（外键）
- `user_id` - 用户ID
- `created_at` - 收藏时间

**约束：**
- 每个用户对每个文章只能收藏一次（UNIQUE 约束）

### 4. article_read_history（阅读历史表）

存储用户的阅读历史记录。

**主要字段：**
- `article_id` - 文章ID（外键）
- `user_id` - 用户ID
- `read_progress` - 阅读进度（0-100）
- `read_duration` - 阅读时长（秒）
- `last_read_at` - 最后阅读时间

**约束：**
- 每个用户对每篇文章只有一条记录（UNIQUE 约束）

### 5. article_likes（点赞表）

存储用户对文章的点赞记录（可选功能）。

**主要字段：**
- `article_id` - 文章ID（外键）
- `user_id` - 用户ID
- `created_at` - 点赞时间

**约束：**
- 每个用户对每个文章只能点赞一次（UNIQUE 约束）

---

## 🔗 表关系

```
article_categories (1) ──< (N) articles
                              │
                              ├──< (N) article_favorites
                              ├──< (N) article_read_history
                              └──< (N) article_likes
```

- 一个分类可以有多个文章
- 一篇文章可以有多个收藏
- 一篇文章可以有多个阅读记录
- 一篇文章可以有多个点赞
- 删除文章时，相关数据会自动删除（CASCADE）

---

## 📝 详细文档

完整的表结构文档请查看：`scripts/library_tables_schema.md`

---

## ⚠️ 常见问题

### Q1: 执行脚本时提示表已存在？

**A:** 脚本使用了 `CREATE TABLE IF NOT EXISTS`，如果表已存在会跳过创建，这是正常的。如果想重新创建，需要先删除现有表。

### Q2: 如何删除表重新创建？

```sql
-- 注意：这会删除所有数据！
DROP TABLE IF EXISTS article_likes CASCADE;
DROP TABLE IF EXISTS article_read_history CASCADE;
DROP TABLE IF EXISTS article_favorites CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;

-- 然后重新执行 create_library_tables.sql
```

### Q3: 如何查看表的数据？

在 Supabase Dashboard 的 **Table Editor** 中，选择对应的表即可查看数据。

### Q4: 如何修改表结构？

在 Supabase Dashboard 的 **Table Editor** 中，点击表名，然后使用 **Alter Table** 功能，或者直接在 SQL Editor 中执行 `ALTER TABLE` 语句。

### Q5: 触发器不工作怎么办？

检查触发器是否创建成功：
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'articles';
```

如果触发器不存在，重新执行创建脚本中的触发器部分。

---

## 🔍 测试查询

创建表后，可以执行以下测试查询：

```sql
-- 查看所有分类
SELECT * FROM article_categories ORDER BY sort_order;

-- 插入测试文章
INSERT INTO articles (title, category_name, summary, content, read_time, is_hot)
VALUES 
    ('测试文章', '情绪管理', '这是一篇测试文章', '文章内容...', 5, true);

-- 查询文章
SELECT * FROM articles WHERE is_active = true;

-- 删除测试数据
DELETE FROM articles WHERE title = '测试文章';
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. SQL 脚本是否正确复制
2. Supabase 项目是否正确
3. 是否有足够的权限创建表
4. 查看 Supabase Dashboard 的错误提示

