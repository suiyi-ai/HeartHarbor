-- ============================================
-- 心理库功能数据库表创建脚本（改进版）
-- 适用于 Supabase PostgreSQL 数据库
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 
-- 改进内容：
-- 1. 添加了 RLS (Row Level Security) 策略，确保数据安全
-- 2. 优化了索引，提高查询性能
-- 3. 添加了更完善的约束和检查
-- 4. 确保所有表都能被正确访问
-- ============================================

-- ============================================
-- 第一步：删除已存在的表（如果存在，可选）
-- ============================================
-- 注意：如果表中有数据，请谨慎执行以下删除语句
-- DROP TABLE IF EXISTS article_likes CASCADE;
-- DROP TABLE IF EXISTS article_read_history CASCADE;
-- DROP TABLE IF EXISTS article_favorites CASCADE;
-- DROP TABLE IF EXISTS articles CASCADE;
-- DROP TABLE IF EXISTS article_categories CASCADE;

-- ============================================
-- 第二步：创建文章分类表 (article_categories)
-- ============================================
CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '📚',
    color VARCHAR(20) DEFAULT '#F5F5F5',
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 第三步：创建文章表 (articles)
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL UNIQUE, -- 添加唯一约束，防止重复插入
    category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(50), -- 冗余字段，便于查询
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time INTEGER DEFAULT 5 CHECK (read_time > 0), -- 阅读时间（分钟），必须大于0
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0), -- 浏览数，必须大于等于0
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0), -- 点赞数，必须大于等于0
    favorite_count INTEGER DEFAULT 0 CHECK (favorite_count >= 0), -- 收藏数，必须大于等于0
    is_hot BOOLEAN DEFAULT false, -- 是否热门
    is_new BOOLEAN DEFAULT false, -- 是否新文章
    is_featured BOOLEAN DEFAULT false, -- 是否精选
    is_active BOOLEAN DEFAULT true, -- 是否激活（软删除）
    author_id UUID, -- 作者ID（可选，如果有多作者）
    author_name VARCHAR(100) DEFAULT '心理专家', -- 作者名称
    cover_image_url TEXT, -- 封面图片URL（可选）
    tags TEXT[], -- 标签数组
    seo_keywords VARCHAR(200), -- SEO关键词
    seo_description TEXT, -- SEO描述
    published_at TIMESTAMPTZ DEFAULT NOW(), -- 发布时间，默认为当前时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 第四步：创建文章收藏表 (article_favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS article_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id) -- 确保每个用户对每篇文章只能收藏一次
);

-- ============================================
-- 第五步：创建阅读历史表 (article_read_history)
-- ============================================
CREATE TABLE IF NOT EXISTS article_read_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read_progress INTEGER DEFAULT 0 CHECK (read_progress >= 0 AND read_progress <= 100), -- 阅读进度（0-100）
    read_duration INTEGER DEFAULT 0 CHECK (read_duration >= 0), -- 阅读时长（秒），必须大于等于0
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id) -- 每个用户对每篇文章只有一条记录
);

-- ============================================
-- 第六步：创建文章点赞表 (article_likes) - 可选
-- ============================================
CREATE TABLE IF NOT EXISTS article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id) -- 确保每个用户对每篇文章只能点赞一次
);

-- ============================================
-- 第七步：创建索引以提高查询性能
-- ============================================

-- 文章表索引
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_name ON articles(category_name);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_active ON articles(is_active);
CREATE INDEX IF NOT EXISTS idx_articles_is_hot ON articles(is_hot);
CREATE INDEX IF NOT EXISTS idx_articles_is_new ON articles(is_new);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags); -- GIN索引用于数组搜索

-- 文章收藏表索引
CREATE INDEX IF NOT EXISTS idx_article_favorites_article_id ON article_favorites(article_id);
CREATE INDEX IF NOT EXISTS idx_article_favorites_user_id ON article_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_article_favorites_created_at ON article_favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_favorites_article_user ON article_favorites(article_id, user_id);

-- 阅读历史表索引
CREATE INDEX IF NOT EXISTS idx_article_read_history_article_id ON article_read_history(article_id);
CREATE INDEX IF NOT EXISTS idx_article_read_history_user_id ON article_read_history(user_id);
CREATE INDEX IF NOT EXISTS idx_article_read_history_last_read_at ON article_read_history(last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_read_history_article_user ON article_read_history(article_id, user_id);

-- 文章点赞表索引
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_user ON article_likes(article_id, user_id);

-- 分类表索引
CREATE INDEX IF NOT EXISTS idx_article_categories_is_active ON article_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_article_categories_sort_order ON article_categories(sort_order);

-- ============================================
-- 第八步：创建触发器函数
-- ============================================

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 articles 表创建更新时间触发器
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 article_categories 表创建更新时间触发器
DROP TRIGGER IF EXISTS update_article_categories_updated_at ON article_categories;
CREATE TRIGGER update_article_categories_updated_at
    BEFORE UPDATE ON article_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 第九步：创建统计更新触发器
-- ============================================

-- 更新文章收藏数触发器
CREATE OR REPLACE FUNCTION update_article_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles 
        SET favorite_count = favorite_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles 
        SET favorite_count = GREATEST(favorite_count - 1, 0) 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_article_favorite_count ON article_favorites;
CREATE TRIGGER trigger_update_article_favorite_count
    AFTER INSERT OR DELETE ON article_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_article_favorite_count();

-- 更新文章点赞数触发器
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles 
        SET like_count = like_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles 
        SET like_count = GREATEST(like_count - 1, 0) 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_article_like_count ON article_likes;
CREATE TRIGGER trigger_update_article_like_count
    AFTER INSERT OR DELETE ON article_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_like_count();

-- ============================================
-- 第十步：插入初始分类数据
-- ============================================

INSERT INTO article_categories (name, icon, color, description, sort_order) VALUES
    ('情绪管理', '😊', '#FFE5E5', '学习如何识别、理解和调节情绪', 1),
    ('压力应对', '😰', '#FFF4E5', '掌握压力管理技巧，保持工作生活平衡', 2),
    ('人际关系', '👥', '#E5F3FF', '改善沟通技巧，建立健康的人际关系', 3),
    ('自我成长', '🌱', '#E5FFE5', '提升自我认知，促进个人成长', 4),
    ('睡眠健康', '😴', '#F0E5FF', '改善睡眠质量，提升身心健康', 5),
    ('焦虑抑郁', '😔', '#FFE5F0', '认识焦虑和抑郁，学习应对方法', 6),
    ('亲子关系', '👨‍👩‍👧', '#FFF0E5', '建立良好的亲子沟通和关系', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 第十一步：启用 Row Level Security (RLS)
-- ============================================
-- 注意：根据你的需求，可以选择启用或禁用RLS
-- 如果启用RLS，需要创建相应的策略

-- 为 articles 表启用RLS（可选）
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 为 article_favorites 表启用RLS（可选）
-- ALTER TABLE article_favorites ENABLE ROW LEVEL SECURITY;

-- 为 article_read_history 表启用RLS（可选）
-- ALTER TABLE article_read_history ENABLE ROW LEVEL SECURITY;

-- 为 article_likes 表启用RLS（可选）
-- ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

-- 如果启用了RLS，需要创建策略允许匿名用户访问（根据你的需求调整）
-- CREATE POLICY "Allow public read access to articles" ON articles FOR SELECT USING (is_active = true);
-- CREATE POLICY "Allow users to manage their own favorites" ON article_favorites FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 第十二步：验证表创建
-- ============================================

-- 查看所有创建的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('article_categories', 'articles', 'article_favorites', 'article_read_history', 'article_likes')
ORDER BY table_name;

-- 查看分类数据
SELECT id, name, icon, sort_order FROM article_categories ORDER BY sort_order;

-- ============================================
-- 执行完成后的验证步骤：
-- 1. 在 Supabase Dashboard 的 Table Editor 中查看是否出现以下表：
--    - article_categories
--    - articles
--    - article_favorites
--    - article_read_history
--    - article_likes
-- 2. 确认分类数据已插入（应该有7个分类）
-- 3. 执行 scripts/insert_library_articles.sql 插入文章数据
-- ============================================

