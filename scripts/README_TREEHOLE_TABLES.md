# 树洞功能数据库表创建指南

## 📋 快速开始

### 步骤 1: 登录 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`etvdmnsernfiegfeadad`
3. 进入 **SQL Editor**（左侧菜单）

### 步骤 2: 执行创建脚本

1. 打开 `scripts/create_treehole_tables.sql` 文件
2. 复制全部 SQL 代码
3. 粘贴到 Supabase SQL Editor
4. 点击 **Run** 按钮执行

### 步骤 3: 验证表是否创建成功

1. 打开 `scripts/verify_treehole_tables.sql` 文件
2. 复制全部 SQL 代码
3. 在 SQL Editor 中执行
4. 检查结果，应该看到 3 个表都已创建

或者直接在 **Table Editor** 中查看，应该能看到：
- ✅ `treehole_posts`
- ✅ `treehole_likes`
- ✅ `treehole_comments`

---

## 📊 表结构总览

### 1. treehole_posts（帖子表）

存储所有树洞帖子信息。

**主要字段：**
- `id` - UUID 主键
- `user_id` - 用户ID
- `content` - 帖子内容
- `emotion` - 情绪标签
- `like_count` - 点赞数
- `comment_count` - 评论数
- `is_active` - 是否活跃（软删除）
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 2. treehole_likes（点赞表）

存储用户对帖子的点赞记录。

**主要字段：**
- `id` - UUID 主键
- `post_id` - 帖子ID（外键）
- `user_id` - 用户ID
- `created_at` - 创建时间

**约束：**
- 每个用户对每个帖子只能点赞一次（UNIQUE 约束）

### 3. treehole_comments（评论表）

存储帖子的评论信息。

**主要字段：**
- `id` - UUID 主键
- `post_id` - 帖子ID（外键）
- `user_id` - 用户ID
- `content` - 评论内容
- `is_anonymous` - 是否匿名
- `created_at` - 创建时间

---

## 🔗 表关系

```
treehole_posts (1) ──< (N) treehole_likes
     │
     │ (1)
     │
     └──< (N) treehole_comments
```

- 一个帖子可以有多个点赞
- 一个帖子可以有多个评论
- 删除帖子时，相关点赞和评论会自动删除（CASCADE）

---

## 📝 详细文档

完整的表结构文档请查看：`scripts/treehole_tables_schema.md`

---

## ⚠️ 常见问题

### Q1: 执行脚本时提示表已存在？

**A:** 脚本使用了 `CREATE TABLE IF NOT EXISTS`，如果表已存在会跳过创建，这是正常的。如果想重新创建，需要先删除现有表。

### Q2: 如何删除表重新创建？

```sql
-- 注意：这会删除所有数据！
DROP TABLE IF EXISTS treehole_comments CASCADE;
DROP TABLE IF EXISTS treehole_likes CASCADE;
DROP TABLE IF EXISTS treehole_posts CASCADE;

-- 然后重新执行 create_treehole_tables.sql
```

### Q3: 如何查看表的数据？

在 Supabase Dashboard 的 **Table Editor** 中，选择对应的表即可查看数据。

### Q4: 如何修改表结构？

在 Supabase Dashboard 的 **Table Editor** 中，点击表名，然后使用 **Alter Table** 功能，或者直接在 SQL Editor 中执行 `ALTER TABLE` 语句。

---

## 🔍 测试查询

创建表后，可以执行以下测试查询：

```sql
-- 插入测试帖子
INSERT INTO treehole_posts (user_id, content, emotion)
VALUES 
    ('00000000-0000-0000-0000-000000000000', '这是一条测试帖子', 'happy');

-- 查询所有帖子
SELECT * FROM treehole_posts ORDER BY created_at DESC;

-- 删除测试数据
DELETE FROM treehole_posts WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. SQL 脚本是否正确复制
2. Supabase 项目是否正确
3. 是否有足够的权限创建表
4. 查看 Supabase Dashboard 的错误提示
