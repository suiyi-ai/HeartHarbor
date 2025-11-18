-- ============================================
-- 创建心情记录表 (mood_records)
-- 适用于 Supabase PostgreSQL 数据库
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- 创建心情记录表
CREATE TABLE IF NOT EXISTS mood_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mood_type VARCHAR(20) NOT NULL, -- 心情类型：happy, sad, anxious, angry, neutral, tired, confused, grateful
    mood_score INTEGER DEFAULT 5, -- 心情评分 1-10
    note TEXT, -- 备注内容
    weather VARCHAR(20), -- 天气（可选）
    location VARCHAR(100), -- 地点（可选）
    tags TEXT[], -- 标签数组
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mood_records_user_id ON mood_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_created_at ON mood_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_records_mood_type ON mood_records(mood_type);
CREATE INDEX IF NOT EXISTS idx_mood_records_user_created ON mood_records(user_id, created_at DESC);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_mood_records_updated_at ON mood_records;
CREATE TRIGGER update_mood_records_updated_at
    BEFORE UPDATE ON mood_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE mood_records IS '用户心情记录表';
COMMENT ON COLUMN mood_records.mood_type IS '心情类型：happy(开心), sad(难过), anxious(焦虑), angry(愤怒), neutral(平静), tired(疲惫), confused(困惑), grateful(感恩)';
COMMENT ON COLUMN mood_records.mood_score IS '心情评分，范围1-10，5为中性';
COMMENT ON COLUMN mood_records.note IS '心情备注，用户可记录详细内容';
COMMENT ON COLUMN mood_records.weather IS '天气情况（可选）';
COMMENT ON COLUMN mood_records.location IS '记录地点（可选）';
COMMENT ON COLUMN mood_records.tags IS '标签数组，用于分类和搜索';

-- 验证表是否创建成功
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mood_records'
ORDER BY ordinal_position;

-- ============================================
-- 执行完成后的验证步骤：
-- 1. 在 Supabase Dashboard 的 Table Editor 中查看 mood_records 表
-- 2. 确认所有字段和索引已创建
-- 3. 确认触发器已创建
-- ============================================

