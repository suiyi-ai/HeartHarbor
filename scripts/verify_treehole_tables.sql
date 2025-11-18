-- ============================================
-- 树洞表验证脚本
-- 用于验证表是否创建成功
-- ============================================

-- 1. 检查表是否存在
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('treehole_posts', 'treehole_likes', 'treehole_comments') 
        THEN '✅ 已创建' 
        ELSE '❌ 未找到' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('treehole_posts', 'treehole_likes', 'treehole_comments')
ORDER BY table_name;

-- 2. 检查表结构
-- 2.1 检查 treehole_posts 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'treehole_posts'
ORDER BY ordinal_position;

-- 2.2 检查 treehole_likes 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'treehole_likes'
ORDER BY ordinal_position;

-- 2.3 检查 treehole_comments 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'treehole_comments'
ORDER BY ordinal_position;

-- 3. 检查索引
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('treehole_posts', 'treehole_likes', 'treehole_comments')
ORDER BY tablename, indexname;

-- 4. 检查外键约束
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('treehole_likes', 'treehole_comments')
ORDER BY tc.table_name;

-- 5. 检查触发器
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'treehole_posts';

-- 6. 统计表记录数（如果有数据）
SELECT 
    'treehole_posts' as table_name,
    COUNT(*) as record_count
FROM treehole_posts
UNION ALL
SELECT 
    'treehole_likes' as table_name,
    COUNT(*) as record_count
FROM treehole_likes
UNION ALL
SELECT 
    'treehole_comments' as table_name,
    COUNT(*) as record_count
FROM treehole_comments;
