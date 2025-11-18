-- ============================================
-- 树洞功能数据库表创建脚本
-- 适用于 Supabase PostgreSQL 数据库
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建树洞帖子表 (treehole_posts)
CREATE TABLE IF NOT EXISTS treehole_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    emotion VARCHAR(20) DEFAULT 'neutral',
    is_anonymous BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_treehole_posts_user_id ON treehole_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_treehole_posts_created_at ON treehole_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treehole_posts_is_active ON treehole_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_treehole_posts_emotion ON treehole_posts(emotion);

-- 2. 创建树洞点赞表 (treehole_likes)
CREATE TABLE IF NOT EXISTS treehole_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES treehole_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_treehole_likes_post_id ON treehole_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_treehole_likes_user_id ON treehole_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_treehole_likes_post_user ON treehole_likes(post_id, user_id);

-- 3. 创建树洞评论表 (treehole_comments)
CREATE TABLE IF NOT EXISTS treehole_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES treehole_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_treehole_comments_post_id ON treehole_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_treehole_comments_user_id ON treehole_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_treehole_comments_created_at ON treehole_comments(created_at);

-- 4. 创建更新时间触发器函数（用于自动更新 updated_at 字段）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 treehole_posts 表创建触发器
DROP TRIGGER IF EXISTS update_treehole_posts_updated_at ON treehole_posts;
CREATE TRIGGER update_treehole_posts_updated_at
    BEFORE UPDATE ON treehole_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 表结构说明
-- ============================================

-- treehole_posts 表字段说明：
-- - id: UUID 主键，自动生成
-- - user_id: UUID 用户ID，关联发布者
-- - content: TEXT 帖子内容
-- - emotion: VARCHAR(20) 情绪标签 (happy, sad, anxious, angry, neutral, tired, confused, grateful)
-- - is_anonymous: BOOLEAN 是否匿名，默认 true
-- - like_count: INTEGER 点赞数，默认 0
-- - comment_count: INTEGER 评论数，默认 0
-- - is_active: BOOLEAN 是否活跃，默认 true（用于软删除）
-- - created_at: TIMESTAMPTZ 创建时间
-- - updated_at: TIMESTAMPTZ 更新时间

-- treehole_likes 表字段说明：
-- - id: UUID 主键，自动生成
-- - post_id: UUID 帖子ID，外键关联 treehole_posts(id)
-- - user_id: UUID 用户ID，点赞者
-- - created_at: TIMESTAMPTZ 创建时间
-- - UNIQUE(post_id, user_id): 唯一约束，确保每个用户只能点赞一次

-- treehole_comments 表字段说明：
-- - id: UUID 主键，自动生成
-- - post_id: UUID 帖子ID，外键关联 treehole_posts(id)
-- - user_id: UUID 用户ID，评论者
-- - content: TEXT 评论内容
-- - is_anonymous: BOOLEAN 是否匿名，默认 true
-- - created_at: TIMESTAMPTZ 创建时间

-- ============================================
-- 执行完成后的验证步骤：
-- 1. 在 Supabase Dashboard 的 Table Editor 中查看是否出现以下表：
--    - treehole_posts
--    - treehole_likes
--    - treehole_comments
-- 2. 或者执行验证脚本 scripts/verify_treehole_tables.sql
-- ============================================
