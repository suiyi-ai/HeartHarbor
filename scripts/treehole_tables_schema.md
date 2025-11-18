# 树洞功能数据库表结构文档

## 📊 表结构概览

树洞功能需要以下 3 个数据表：

1. **treehole_posts** - 树洞帖子表
2. **treehole_likes** - 点赞表
3. **treehole_comments** - 评论表

---

## 1. treehole_posts（树洞帖子表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| user_id | UUID | NOT NULL | - | 用户ID，关联发布者 |
| content | TEXT | NOT NULL | - | 帖子内容 |
| emotion | VARCHAR(20) | - | 'neutral' | 情绪标签 |
| is_anonymous | BOOLEAN | - | true | 是否匿名 |
| like_count | INTEGER | - | 0 | 点赞数 |
| comment_count | INTEGER | - | 0 | 评论数 |
| is_active | BOOLEAN | - | true | 是否活跃（软删除） |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | - | NOW() | 更新时间 |

### 索引

- `idx_treehole_posts_user_id` - 按用户ID查询
- `idx_treehole_posts_created_at` - 按创建时间排序（降序）
- `idx_treehole_posts_is_active` - 过滤活跃帖子
- `idx_treehole_posts_emotion` - 按情绪标签查询

### 触发器

- `update_treehole_posts_updated_at` - 自动更新 `updated_at` 字段

### 情绪标签值

- `happy` - 开心
- `sad` - 难过
- `anxious` - 焦虑
- `angry` - 愤怒
- `neutral` - 平静
- `tired` - 疲惫
- `confused` - 困惑
- `grateful` - 感恩

---

## 2. treehole_likes（点赞表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| post_id | UUID | NOT NULL, FOREIGN KEY | - | 帖子ID，外键关联 treehole_posts(id) |
| user_id | UUID | NOT NULL | - | 用户ID，点赞者 |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |

### 约束

- **外键约束**: `post_id` → `treehole_posts(id)` ON DELETE CASCADE
- **唯一约束**: `UNIQUE(post_id, user_id)` - 确保每个用户只能点赞一次

### 索引

- `idx_treehole_likes_post_id` - 按帖子ID查询点赞
- `idx_treehole_likes_user_id` - 按用户ID查询点赞
- `idx_treehole_likes_post_user` - 复合索引，检查用户是否点赞

---

## 3. treehole_comments（评论表）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 主键，自动生成 |
| post_id | UUID | NOT NULL, FOREIGN KEY | - | 帖子ID，外键关联 treehole_posts(id) |
| user_id | UUID | NOT NULL | - | 用户ID，评论者 |
| content | TEXT | NOT NULL | - | 评论内容 |
| is_anonymous | BOOLEAN | - | true | 是否匿名 |
| created_at | TIMESTAMPTZ | - | NOW() | 创建时间 |

### 约束

- **外键约束**: `post_id` → `treehole_posts(id)` ON DELETE CASCADE

### 索引

- `idx_treehole_comments_post_id` - 按帖子ID查询评论
- `idx_treehole_comments_user_id` - 按用户ID查询评论
- `idx_treehole_comments_created_at` - 按创建时间排序

---

## 🔗 表关系图

```
treehole_posts (1) ──< (N) treehole_likes
     │
     │ (1)
     │
     └──< (N) treehole_comments
```

- 一个帖子可以有多个点赞（1:N）
- 一个帖子可以有多个评论（1:N）
- 删除帖子时，相关的点赞和评论会自动删除（CASCADE）

---

## 📝 SQL 创建脚本

完整的 SQL 创建脚本位于：`scripts/create_treehole_tables.sql`

### 快速执行步骤

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目：`etvdmnsernfiegfeadad`
3. 进入 **SQL Editor**
4. 复制 `scripts/create_treehole_tables.sql` 中的全部内容
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
  AND table_name IN ('treehole_posts', 'treehole_likes', 'treehole_comments');
```

应该返回 3 行结果。

或者执行验证脚本：`scripts/verify_treehole_tables.sql`

---

## 🔍 示例查询

### 查询所有活跃的帖子（按时间倒序）

```sql
SELECT * 
FROM treehole_posts 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 20;
```

### 查询某个帖子的点赞数

```sql
SELECT COUNT(*) as like_count
FROM treehole_likes
WHERE post_id = 'your-post-id';
```

### 查询某个帖子的所有评论

```sql
SELECT * 
FROM treehole_comments 
WHERE post_id = 'your-post-id' 
ORDER BY created_at ASC;
```

### 查询用户是否点赞了某个帖子

```sql
SELECT EXISTS(
    SELECT 1 
    FROM treehole_likes 
    WHERE post_id = 'your-post-id' 
      AND user_id = 'your-user-id'
) as is_liked;
```

---

## 📊 数据统计查询

### 统计总帖子数

```sql
SELECT COUNT(*) as total_posts
FROM treehole_posts
WHERE is_active = true;
```

### 统计总点赞数

```sql
SELECT SUM(like_count) as total_likes
FROM treehole_posts
WHERE is_active = true;
```

### 统计总评论数

```sql
SELECT SUM(comment_count) as total_comments
FROM treehole_posts
WHERE is_active = true;
```

### 按情绪统计帖子数

```sql
SELECT emotion, COUNT(*) as count
FROM treehole_posts
WHERE is_active = true
GROUP BY emotion
ORDER BY count DESC;
```

---

## ⚠️ 注意事项

1. **外键级联删除**：删除帖子时会自动删除相关的点赞和评论
2. **唯一约束**：每个用户对每个帖子只能点赞一次
3. **软删除**：使用 `is_active` 字段实现软删除，不会真正删除数据
4. **匿名性**：所有帖子默认匿名，`is_anonymous` 字段为 true
5. **性能优化**：已创建必要的索引，但根据实际使用情况可能需要调整
6. **时间戳**：使用 `TIMESTAMPTZ` 类型存储时间，自动处理时区

---

## 🔄 数据迁移（如果需要）

如果之前使用本地存储，可以编写迁移脚本将本地数据导入数据库：

```sql
-- 示例：从本地存储导入数据（需要手动执行）
-- 注意：user_id 需要是有效的 UUID
INSERT INTO treehole_posts (user_id, content, emotion, is_anonymous, like_count, comment_count, created_at)
VALUES 
    ('user-uuid-here', '帖子内容1', 'happy', true, 0, 0, NOW()),
    ('user-uuid-here', '帖子内容2', 'sad', true, 0, 0, NOW());
```

---

## 🛠️ 维护建议

1. **定期清理**：考虑添加数据归档机制（定期归档旧帖子）
2. **索引优化**：根据查询模式调整索引
3. **性能监控**：监控慢查询，优化性能瓶颈
4. **备份策略**：定期备份重要数据

