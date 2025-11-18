-- ============================================
-- 为 users 表添加微信登录相关字段
-- 适用于 Supabase PostgreSQL 数据库
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- 检查并添加 wechat_openid 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'wechat_openid'
    ) THEN
        ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);
        COMMENT ON COLUMN users.wechat_openid IS '微信 OpenID，用于微信登录';
    END IF;
END $$;

-- 检查并添加 wechat_unionid 字段（可选，用于多应用统一用户）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'wechat_unionid'
    ) THEN
        ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100);
        CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid ON users(wechat_unionid);
        COMMENT ON COLUMN users.wechat_unionid IS '微信 UnionID，用于多应用统一用户标识';
    END IF;
END $$;

-- 验证字段是否添加成功
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('wechat_openid', 'wechat_unionid')
ORDER BY column_name;

-- ============================================
-- 执行完成后的验证步骤：
-- 1. 在 Supabase Dashboard 的 Table Editor 中查看 users 表
-- 2. 确认 wechat_openid 和 wechat_unionid 字段已添加
-- 3. 确认索引已创建
-- ============================================

