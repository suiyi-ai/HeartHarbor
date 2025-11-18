-- ============================================
-- 心理库数据库设置验证脚本
-- 用于验证表结构、数据完整性、索引和触发器
-- ============================================

-- ============================================
-- 第一步：验证表是否存在
-- ============================================
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes') 
        THEN '✓' 
        ELSE '✗' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY table_name;

-- ============================================
-- 第二步：验证分类数据
-- ============================================
SELECT 
    id,
    name,
    icon,
    color,
    sort_order,
    is_active,
    created_at
FROM article_categories 
ORDER BY sort_order;

-- 验证分类数量（应该是7个）
SELECT COUNT(*) as category_count FROM article_categories WHERE is_active = true;

-- ============================================
-- 第三步：验证文章数据
-- ============================================
-- 查看文章总数
SELECT COUNT(*) as total_articles FROM articles WHERE is_active = true;

-- 查看每个分类的文章数量
SELECT 
    c.name as category_name,
    COUNT(a.id) as article_count,
    SUM(CASE WHEN a.is_hot THEN 1 ELSE 0 END) as hot_count,
    SUM(CASE WHEN a.is_new THEN 1 ELSE 0 END) as new_count
FROM article_categories c
LEFT JOIN articles a ON a.category_id = c.id AND a.is_active = true
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;

-- 查看文章基本信息
SELECT 
    id,
    title,
    category_name,
    read_time,
    view_count,
    like_count,
    favorite_count,
    is_hot,
    is_new,
    is_featured,
    published_at,
    created_at
FROM articles
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20;

-- 验证文章是否有分类ID
SELECT 
    COUNT(*) as total_articles,
    COUNT(category_id) as articles_with_category_id,
    COUNT(*) - COUNT(category_id) as articles_without_category_id
FROM articles
WHERE is_active = true;

-- ============================================
-- 第四步：验证索引
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY tablename, indexname;

-- ============================================
-- 第五步：验证触发器
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('articles', 'article_categories', 'article_favorites', 'article_likes')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 第六步：验证约束
-- ============================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================
-- 第七步：验证外键关系
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY tc.table_name;

-- ============================================
-- 第八步：验证数据完整性
-- ============================================
-- 检查是否有文章没有分类
SELECT 
    id,
    title,
    category_name,
    category_id
FROM articles
WHERE is_active = true
AND (category_id IS NULL OR category_name IS NULL);

-- 检查是否有无效的分类ID
SELECT 
    a.id,
    a.title,
    a.category_id,
    a.category_name
FROM articles a
LEFT JOIN article_categories c ON a.category_id = c.id
WHERE a.is_active = true
AND a.category_id IS NOT NULL
AND c.id IS NULL;

-- 检查统计数据的一致性
SELECT 
    a.id,
    a.title,
    a.favorite_count as article_favorite_count,
    COUNT(af.id) as actual_favorite_count,
    a.like_count as article_like_count,
    COUNT(al.id) as actual_like_count
FROM articles a
LEFT JOIN article_favorites af ON a.id = af.article_id
LEFT JOIN article_likes al ON a.id = al.article_id
WHERE a.is_active = true
GROUP BY a.id, a.title, a.favorite_count, a.like_count
HAVING a.favorite_count != COUNT(af.id) OR a.like_count != COUNT(al.id);

-- ============================================
-- 第九步：性能测试查询
-- ============================================
-- 测试按分类查询
EXPLAIN ANALYZE
SELECT * FROM articles
WHERE category_name = '情绪管理'
AND is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- 测试按热门查询
EXPLAIN ANALYZE
SELECT * FROM articles
WHERE is_hot = true
AND is_active = true
ORDER BY view_count DESC
LIMIT 10;

-- 测试搜索查询
EXPLAIN ANALYZE
SELECT * FROM articles
WHERE title ILIKE '%焦虑%'
AND is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 第十步：生成设置报告
-- ============================================
SELECT 
    '数据库设置验证报告' as report_title,
    (SELECT COUNT(*) FROM article_categories WHERE is_active = true) as category_count,
    (SELECT COUNT(*) FROM articles WHERE is_active = true) as article_count,
    (SELECT COUNT(*) FROM article_favorites) as favorite_count,
    (SELECT COUNT(*) FROM article_read_history) as read_history_count,
    (SELECT COUNT(*) FROM article_likes) as like_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')) as index_count,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table IN ('articles', 'article_categories', 'article_favorites', 'article_likes')) as trigger_count;

-- ============================================
-- 验证完成
-- ============================================
-- 如果所有验证都通过，应该看到：
-- 1. 5个表都已创建
-- 2. 7个分类都已插入
-- 3. 8篇文章都已插入
-- 4. 所有索引都已创建
-- 5. 所有触发器都已创建
-- 6. 外键关系正确
-- 7. 数据完整性良好
-- ============================================

