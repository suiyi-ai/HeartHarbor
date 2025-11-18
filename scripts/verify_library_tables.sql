-- ============================================
-- 心理库表验证脚本
-- 用于验证表是否创建成功
-- ============================================

-- 1. 检查表是否存在
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes') 
        THEN '✅ 已创建' 
        ELSE '❌ 未找到' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY table_name;

-- 2. 检查表结构
-- 2.1 检查 article_categories 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'article_categories'
ORDER BY ordinal_position;

-- 2.2 检查 articles 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'articles'
ORDER BY ordinal_position;

-- 2.3 检查 article_favorites 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'article_favorites'
ORDER BY ordinal_position;

-- 2.4 检查 article_read_history 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'article_read_history'
ORDER BY ordinal_position;

-- 2.5 检查 article_likes 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'article_likes'
ORDER BY ordinal_position;

-- 3. 检查索引
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
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
    AND tc.table_name IN ('articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY tc.table_name;

-- 5. 检查触发器
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('articles', 'article_categories', 'article_favorites', 'article_likes')
ORDER BY event_object_table, trigger_name;

-- 6. 检查初始分类数据
SELECT 
    name,
    icon,
    color,
    sort_order,
    is_active
FROM article_categories
ORDER BY sort_order;

-- 7. 统计表记录数（如果有数据）
SELECT 
    'article_categories' as table_name,
    COUNT(*) as record_count
FROM article_categories
UNION ALL
SELECT 
    'articles' as table_name,
    COUNT(*) as record_count
FROM articles
UNION ALL
SELECT 
    'article_favorites' as table_name,
    COUNT(*) as record_count
FROM article_favorites
UNION ALL
SELECT 
    'article_read_history' as table_name,
    COUNT(*) as record_count
FROM article_read_history
UNION ALL
SELECT 
    'article_likes' as table_name,
    COUNT(*) as record_count
FROM article_likes;

