<template>
	<view class="article-detail-page">
		<!-- 文章头部 -->
		<view class="article-header">
			<view class="header-content">
				<view class="article-title-wrapper">
					<text class="article-title">{{article.title || '加载中...'}}</text>
					<view class="article-badges">
						<text class="article-badge hot" v-if="article.isHot">🔥 热门</text>
						<text class="article-badge new" v-if="article.isNew">✨ 新</text>
					</view>
				</view>
				<view class="article-meta">
					<view class="meta-item">
						<text class="meta-icon">⏱</text>
						<text class="meta-text">{{article.readTime || 0}}分钟阅读</text>
					</view>
					<view class="meta-item">
						<text class="meta-icon">👁</text>
						<text class="meta-text">{{article.viewCount || 0}}次浏览</text>
					</view>
					<view class="meta-item">
						<text class="meta-icon">📅</text>
						<text class="meta-text">{{formatDate(article.date)}}</text>
					</view>
				</view>
				<view class="article-category" :style="{backgroundColor: getCategoryColor(article.category)}">
					<text class="category-icon">{{getCategoryIcon(article.category)}}</text>
					<text class="category-text">{{article.category}}</text>
				</view>
			</view>
		</view>
		
		<!-- 文章内容 -->
		<scroll-view class="article-content" scroll-y="true">
			<view class="content-wrapper">
				<view class="article-body" v-if="article.content">
					<text class="content-text">{{article.content}}</text>
				</view>
				<view class="loading-content" v-else>
					<view class="loading-spinner">
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
					</view>
					<text class="loading-text">加载中...</text>
				</view>
			</view>
		</scroll-view>
		
		<!-- 底部操作栏 -->
		<view class="article-footer">
			<view class="footer-actions">
				<view 
					class="action-btn favorite-btn" 
					:class="{active: article.isFavorited}"
					@click="toggleFavorite"
				>
					<text class="action-icon">{{article.isFavorited ? '❤️' : '🤍'}}</text>
					<text class="action-text">{{article.isFavorited ? '已收藏' : '收藏'}}</text>
				</view>
				<view class="action-btn share-btn" @click="shareArticle">
					<text class="action-icon">🔗</text>
					<text class="action-text">分享</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import conversationService from '@/utils/supabase.js'
	
	export default {
		data() {
			return {
				articleId: null,
				article: {
					title: '',
					category: '',
					content: '',
					readTime: 0,
					viewCount: 0,
					likeCount: 0,
					favoriteCount: 0,
					date: '',
					isHot: false,
					isNew: false,
					isFavorited: false,
					authorName: '',
					coverImageUrl: '',
					tags: []
				},
				
				// 文章数据（备用数据，当数据库加载失败时使用）
				articlesData: [
					{
						id: 1,
						title: '如何有效管理焦虑情绪',
						category: '情绪管理',
						readTime: 5,
						viewCount: 1250,
						date: '2024-01-15',
						isHot: true,
						isNew: false,
						content: `焦虑是生活中常见的情绪反应，适当的焦虑可以帮助我们提高警惕性，但过度的焦虑会影响我们的日常生活和心理健康。本文将帮助你了解焦虑的成因，识别焦虑信号，并学习有效的应对方法。

一、认识焦虑

焦虑是一种对未来可能发生的不确定事件的担忧和恐惧。常见的焦虑症状包括：
- 心理症状：担心、恐惧、紧张、注意力不集中
- 身体症状：心跳加快、呼吸急促、出汗、肌肉紧张
- 行为症状：回避、拖延、易怒

二、焦虑的成因

1. 压力事件：工作压力、学业压力、人际关系压力
2. 性格因素：完美主义、过度担心、缺乏自信
3. 生活环境：生活变化、重大事件、环境压力
4. 生理因素：遗传、神经递质失衡

三、管理焦虑的方法

1. 深呼吸练习
   - 找一个安静的地方，坐下或躺下
   - 慢慢吸气，数到4
   - 屏住呼吸，数到4
   - 慢慢呼气，数到4
   - 重复5-10次

2. 正念冥想
   - 专注于当下，接受当前的状态
   - 观察自己的情绪，不评判
   - 每天练习10-20分钟

3. 运动放松
   - 有氧运动：散步、跑步、游泳
   - 瑜伽、太极等放松运动
   - 每周至少3次，每次30分钟

4. 认知重构
   - 识别负面思维
   - 挑战不合理的想法
   - 用更合理的想法替代

5. 时间管理
   - 制定合理的计划
   - 设置优先级
   - 避免过度承诺

6. 寻求支持
   - 与朋友、家人分享
   - 寻求专业心理咨询
   - 参加支持小组

四、何时寻求帮助

如果焦虑严重影响你的日常生活，建议寻求专业帮助：
- 焦虑持续时间超过6个月
- 严重影响工作、学习或社交
- 出现身体症状
- 有自伤或自杀的想法

记住，焦虑是可以管理和治疗的。通过学习和实践，你可以更好地应对焦虑，提高生活质量。`
					},
					{
						id: 2,
						title: '工作压力大的应对策略',
						category: '压力应对',
						readTime: 8,
						viewCount: 980,
						date: '2024-01-20',
						isHot: true,
						isNew: false,
						content: `现代职场压力普遍存在，长期的工作压力不仅影响工作效率，还会损害身心健康。本文将为你提供实用的压力管理策略，帮助你在工作中保持平衡和健康。

一、认识工作压力

工作压力来源：
- 工作量过大
- 时间紧迫
- 人际关系复杂
- 职业发展不确定性
- 工作与生活失衡

二、压力管理的核心策略

1. 时间管理
   - 制定每日工作计划
   - 使用优先级矩阵（重要/紧急）
   - 避免多任务处理
   - 设置合理的时间限制

2. 任务分解
   - 将大任务分解为小步骤
   - 设定可实现的短期目标
   - 庆祝小成就
   - 逐步推进

3. 建立界限
   - 设定工作与生活的边界
   - 学会说"不"
   - 避免过度承诺
   - 保护个人时间

4. 放松技巧
   - 深呼吸练习
   - 渐进性肌肉放松
   - 短暂休息（每工作50分钟休息10分钟）
   - 午休时间放松

5. 运动与健康
   - 定期运动（每周至少150分钟）
   - 保持充足睡眠（7-9小时）
   - 健康饮食
   - 避免过度依赖咖啡因和酒精

6. 社交支持
   - 与同事建立良好关系
   - 寻求家人朋友支持
   - 参加职业发展活动
   - 建立支持网络

7. 技能提升
   - 持续学习新技能
   - 提高工作效率
   - 寻求反馈和改进
   - 增强自信心

三、应对压力的实用技巧

1. 5-4-3-2-1  grounding技巧
   - 说出5个你看到的东西
   - 说出4个你触摸到的东西
   - 说出3个你听到的声音
   - 说出2个你闻到的气味
   - 说出1个你尝到的味道

2. 工作环境优化
   - 整理工作空间
   - 减少干扰
   - 使用自然光
   - 保持通风

3. 沟通技巧
   - 清晰表达需求
   - 积极倾听
   - 寻求反馈
   - 处理冲突

四、长期压力管理

1. 职业规划
   - 设定职业目标
   - 制定发展计划
   - 寻求成长机会
   - 评估职业满意度

2. 工作与生活平衡
   - 设定明确的界限
   - 培养兴趣爱好
   - 花时间与家人朋友相处
   - 享受休闲活动

3. 自我照顾
   - 定期体检
   - 管理健康问题
   - 寻求心理支持
   - 保持积极心态

记住，压力管理是一个持续的过程。通过实践这些策略，你可以更好地应对工作压力，保持身心健康和工作效率。`
					},
					{
						id: 3,
						title: '改善人际关系的5个技巧',
						category: '人际关系',
						readTime: 6,
						viewCount: 756,
						date: '2024-01-25',
						isHot: false,
						isNew: true,
						content: `良好的人际关系是心理健康的重要保障。无论是在工作、学习还是生活中，有效的人际沟通技巧都能帮助我们建立更健康、更和谐的关系。本文将分享5个实用的人际关系改善技巧。

一、积极倾听

积极倾听是建立良好人际关系的基础：
- 全神贯注：放下手机，保持眼神接触
- 不打断：让对方完整表达想法
- 理解而非评判：尝试理解对方的观点
- 反馈确认：用你的话重复对方的意思
- 表达理解：使用"我理解你的感受"等话语

二、表达理解与共情

共情是理解他人情感的能力：
- 识别情绪：注意对方的情绪状态
- 表达理解：承认对方的感受
- 避免建议：有时候只需要倾听和理解
- 使用"我"语句：表达自己的感受而非指责
- 尊重差异：接受不同的观点和感受

三、尊重差异

每个人都是独特的个体：
- 接受不同：尊重他人的观点和选择
- 避免评判：不轻易评判他人的行为
- 寻求共同点：寻找共同兴趣和价值观
- 开放心态：愿意学习和理解新观点
- 包容多样性：接受文化、背景的差异

四、建立信任

信任是健康关系的基础：
- 诚实透明：保持真实和透明
- 遵守承诺：说到做到
- 保密尊重：保护他人的隐私
- 支持鼓励：在困难时提供支持
- 承担责任：承认错误并改正

五、有效沟通

有效沟通是解决冲突的关键：
- 清晰表达：用简洁明了的语言表达
- 非暴力沟通：使用"我"语句，避免指责
- 及时反馈：及时表达自己的感受和需求
- 处理冲突：冷静面对，寻求解决方案
- 建立共识：寻找双方都能接受的方案

实践建议：

1. 每天练习一个技巧
2. 记录你的进步
3. 寻求反馈
4. 持续学习和改进
5. 保持耐心和坚持

记住，改善人际关系是一个持续的过程。通过实践这些技巧，你可以建立更健康、更和谐的人际关系，提升生活质量。`
					},
					{
						id: 4,
						title: '提升自我认知的方法',
						category: '自我成长',
						readTime: 7,
						viewCount: 642,
						date: '2024-02-01',
						isHot: false,
						isNew: false,
						content: `自我认知是个人成长的基础，通过反思和觉察可以更好地了解自己。本文将介绍提升自我认知的实用方法，帮助你更好地认识自己。

一、什么是自我认知

自我认知是对自己的了解，包括：
- 了解自己的情绪和感受
- 认识自己的优势和不足
- 理解自己的价值观和信念
- 知道自己的需求和目标

二、提升自我认知的方法

1. 反思日记
   - 每天记录自己的感受和想法
   - 回顾一天的经历
   - 分析自己的行为和反应
   - 寻找模式和趋势

2. 寻求反馈
   - 向朋友、家人寻求反馈
   - 接受建设性的批评
   - 从不同角度了解自己
   - 保持开放心态

3. 心理测试
   - 性格测试（如MBTI）
   - 情绪智力测试
   - 价值观测试
   - 职业兴趣测试

4. 冥想练习
   - 正念冥想
   - 身体扫描
   - 情绪观察
   - 自我觉察

5. 专业咨询
   - 心理咨询
   - 职业咨询
   - 个人成长辅导
   - 心理评估

三、实践建议

1. 每天花时间反思
2. 记录自己的观察
3. 接受不完美的自己
4. 持续学习和成长
5. 保持耐心和坚持

通过提升自我认知，你可以更好地了解自己，做出更好的决定，提升生活质量。`
					},
					{
						id: 5,
						title: '改善睡眠质量的实用建议',
						category: '睡眠健康',
						readTime: 4,
						viewCount: 892,
						date: '2024-02-05',
						isHot: false,
						isNew: false,
						content: `良好的睡眠对心理健康至关重要，掌握科学的睡眠习惯可以显著改善睡眠质量。本文提供改善睡眠质量的实用建议。

一、睡眠的重要性

良好的睡眠可以：
- 恢复体力和精力
- 巩固记忆和学习
- 调节情绪和压力
- 增强免疫系统
- 促进身体修复

二、改善睡眠的方法

1. 规律作息
   - 固定睡觉和起床时间
   - 即使周末也保持规律
   - 建立生物钟
   - 避免频繁改变作息

2. 睡前放松
   - 睡前1小时停止工作
   - 避免刺激性活动
   - 进行放松练习
   - 阅读轻松的内容

3. 环境优化
   - 保持卧室凉爽（18-22°C）
   - 保持黑暗和安静
   - 使用舒适的床具
   - 减少电子设备使用

4. 避免刺激
   - 睡前避免咖啡因
   - 避免大量进食
   - 避免饮酒
   - 避免剧烈运动

5. 适度运动
   - 白天进行有氧运动
   - 避免睡前运动
   - 规律运动习惯
   - 选择适合的运动

三、应对失眠

如果经常失眠：
- 建立睡前仪式
- 使用放松技巧
- 避免在床上思考问题
- 如果20分钟未入睡，起床活动
- 寻求专业帮助

通过改善睡眠质量，你可以提升身心健康，提高生活质量。`
					},
					{
						id: 6,
						title: '认识抑郁症：症状与应对',
						category: '焦虑抑郁',
						readTime: 6,
						viewCount: 523,
						date: '2024-02-10',
						isHot: false,
						isNew: true,
						content: `抑郁症是一种常见的心理健康问题，了解其症状和应对方法对及时干预至关重要。本文将帮助你认识抑郁症，并提供应对建议。

一、认识抑郁症

抑郁症是一种情绪障碍，表现为：
- 持续的悲伤或低落情绪
- 失去兴趣和乐趣
- 疲劳和能量不足
- 睡眠问题
- 食欲改变
- 注意力不集中
- 自我价值感低
- 自杀想法

二、抑郁症的成因

1. 生物因素：遗传、神经递质失衡
2. 心理因素：性格、思维方式
3. 环境因素：压力、创伤、生活事件
4. 社会因素：人际关系、社会支持

三、应对方法

1. 寻求专业帮助
   - 心理咨询
   - 药物治疗
   - 心理治疗
   - 住院治疗（严重时）

2. 建立支持网络
   - 与家人朋友沟通
   - 参加支持小组
   - 寻求社会支持
   - 建立信任关系

3. 自我照顾
   - 保持规律作息
   - 健康饮食
   - 适度运动
   - 放松技巧

4. 认知行为疗法
   - 识别负面思维
   - 挑战不合理想法
   - 改变行为模式
   - 建立积极思维

5. 药物治疗
   - 抗抑郁药物
   - 按医嘱服药
   - 定期复查
   - 注意副作用

四、何时寻求帮助

如果出现以下情况，应立即寻求帮助：
- 持续的情绪低落超过2周
- 严重影响日常生活
- 有自杀想法
- 无法自行应对

记住，抑郁症是可以治疗的。通过及时干预和持续治疗，大多数患者可以恢复正常生活。`
					},
					{
						id: 7,
						title: '如何与孩子建立良好的沟通',
						category: '亲子关系',
						readTime: 5,
						viewCount: 456,
						date: '2024-02-15',
						isHot: false,
						isNew: false,
						content: `良好的亲子沟通是建立健康亲子关系的基础。本文将分享与孩子建立良好沟通的方法和技巧，帮助家长更好地理解和支持孩子。

一、有效沟通的重要性

良好的亲子沟通可以：
- 建立信任和亲密关系
- 帮助孩子表达情感
- 解决冲突和问题
- 促进孩子成长
- 增强家庭凝聚力

二、沟通技巧

1. 积极倾听
   - 全神贯注地听
   - 不打断孩子
   - 理解孩子的感受
   - 给予反馈和确认

2. 表达理解
   - 承认孩子的感受
   - 使用"我理解"等话语
   - 避免否定和评判
   - 表达支持和关心

3. 设定界限
   - 明确规则和期望
   - 保持一致性
   - 解释规则的原因
   - 给予适当的自由

4. 鼓励表达
   - 创造安全的环境
   - 鼓励孩子分享想法
   - 尊重孩子的观点
   - 避免强迫和压力

5. 建立信任
   - 遵守承诺
   - 保持诚实
   - 尊重隐私
   - 给予支持

三、处理冲突

当发生冲突时：
- 保持冷静
- 倾听双方观点
- 寻找共同点
- 寻求解决方案
- 达成共识

四、实践建议

1. 每天花时间与孩子交流
2. 创造无压力的交流环境
3. 尊重孩子的独立性
4. 保持耐心和理解
5. 持续学习和改进

通过建立良好的沟通，你可以更好地理解和支持孩子，建立健康的亲子关系。`
					},
					{
						id: 8,
						title: '情绪调节的5种有效方法',
						category: '情绪管理',
						readTime: 5,
						viewCount: 678,
						date: '2024-02-20',
						isHot: false,
						isNew: false,
						content: `情绪调节是情绪管理的重要组成部分，掌握有效的情绪调节方法可以帮助我们更好地应对生活中的各种情绪。本文将介绍5种有效的情绪调节方法。

一、认知重构

认知重构是通过改变思维方式来调节情绪：
- 识别负面思维
- 挑战不合理想法
- 用更合理的想法替代
- 保持客观和理性
- 寻找积极方面

二、情绪表达

适当地表达情绪可以帮助调节情绪：
- 写日记记录感受
- 与信任的人分享
- 通过艺术表达
- 使用"我"语句表达
- 避免压抑情绪

三、放松技巧

放松技巧可以帮助缓解紧张和压力：
- 深呼吸练习
- 渐进性肌肉放松
- 冥想和正念
- 瑜伽和太极
- 听音乐和阅读

四、运动释放

运动是释放情绪的有效方式：
- 有氧运动（跑步、游泳）
- 力量训练
- 瑜伽和拉伸
- 户外活动
- 团队运动

五、寻求支持

寻求支持是情绪调节的重要方式：
- 与朋友家人交流
- 寻求专业帮助
- 参加支持小组
- 建立支持网络
- 接受帮助和支持

实践建议：

1. 识别自己的情绪
2. 选择适合的调节方法
3. 练习和坚持
4. 保持耐心
5. 寻求帮助（需要时）

通过掌握这些情绪调节方法，你可以更好地管理情绪，提升生活质量。`
					}
				]
			}
		},
		
		onLoad(options) {
			if (options.id) {
				this.articleId = options.id // 使用UUID，不需要parseInt
				this.loadArticle()
			} else if (options.title) {
				// 如果没有ID，尝试通过标题查找
				this.findArticleByTitle(decodeURIComponent(options.title))
			}
		},
		
		onShow() {
			// 刷新收藏状态
			this.checkFavoriteStatus()
		},
		
		methods: {
			// 加载文章
			async loadArticle() {
				try {
					// 从数据库加载文章详情
					const articleData = await conversationService.supabaseService.getArticleById(this.articleId)
					
					// 转换数据格式
					this.article = {
						id: articleData.id,
						title: articleData.title,
						category: articleData.category,
						content: articleData.content,
						readTime: articleData.readTime,
						viewCount: articleData.viewCount,
						likeCount: articleData.likeCount,
						favoriteCount: articleData.favoriteCount,
						date: articleData.date ? new Date(articleData.date).toISOString().split('T')[0] : '',
						isHot: articleData.isHot,
						isNew: articleData.isNew,
						isFavorited: false, // 需要单独查询
						authorName: articleData.authorName,
						coverImageUrl: articleData.coverImageUrl,
						tags: articleData.tags || []
					}
					
					// 检查收藏状态
					await this.checkFavoriteStatus()
					
					// 保存阅读历史（会自动增加浏览数）
					await this.saveReadHistory()
				} catch (error) {
					console.error('加载文章失败:', error)
					// 如果数据库加载失败，尝试从本地数据查找（备用方案）
					const articleData = this.articlesData.find(a => a.id === this.articleId || a.id === parseInt(this.articleId))
					if (articleData) {
						this.article = { ...articleData }
						// 异步方法需要 await
						this.checkFavoriteStatus().catch(err => console.error('检查收藏状态失败:', err))
						this.saveReadHistory().catch(err => console.error('保存阅读历史失败:', err))
					} else {
						// 如果没有找到，使用默认数据
						this.article = {
							id: this.articleId,
							title: '文章标题',
							category: '心理知识',
							content: '文章内容加载中...',
							readTime: 5,
							viewCount: 0,
							likeCount: 0,
							favoriteCount: 0,
							date: new Date().toISOString().split('T')[0],
							isHot: false,
							isNew: false,
							isFavorited: false,
							authorName: '',
							coverImageUrl: '',
							tags: []
						}
						uni.showToast({
							title: '文章加载失败',
							icon: 'none'
						})
					}
				}
			},
			
			// 通过标题查找文章
			async findArticleByTitle(title) {
				try {
					// 从数据库搜索文章
					const articles = await conversationService.supabaseService.getArticles({
						search: title,
						limit: 1
					})
					
					if (articles && articles.length > 0) {
						const articleData = articles[0]
						this.article = {
							id: articleData.id,
							title: articleData.title,
							category: articleData.category,
							content: articleData.content,
							readTime: articleData.readTime,
							viewCount: articleData.viewCount,
							likeCount: articleData.likeCount,
							favoriteCount: articleData.favoriteCount,
							date: articleData.date ? new Date(articleData.date).toISOString().split('T')[0] : '',
							isHot: articleData.isHot,
							isNew: articleData.isNew,
							isFavorited: false
						}
						this.articleId = articleData.id
						await this.checkFavoriteStatus()
						await this.saveReadHistory()
					}
				} catch (error) {
					console.error('查找文章失败:', error)
					// 如果数据库查找失败，尝试从本地数据查找
					const articleData = this.articlesData.find(a => a.title === title)
					if (articleData) {
						this.article = { ...articleData }
						this.articleId = articleData.id
						// 异步方法需要 await
						this.checkFavoriteStatus().catch(err => console.error('检查收藏状态失败:', err))
						this.saveReadHistory().catch(err => console.error('保存阅读历史失败:', err))
					}
				}
			},
			
			// 检查收藏状态
			async checkFavoriteStatus() {
				try {
					// 从数据库检查收藏状态
					this.article.isFavorited = await conversationService.supabaseService.checkUserFavoriteArticle(this.article.id)
				} catch (error) {
					console.error('检查收藏状态失败:', error)
					// 如果数据库失败，使用本地存储作为备用
					try {
						const favorites = uni.getStorageSync('library_favorites') || []
						this.article.isFavorited = favorites.includes(this.article.id)
					} catch (e) {
						console.error('检查本地收藏失败:', e)
						this.article.isFavorited = false
					}
				}
			},
			
			// 切换收藏
			async toggleFavorite() {
				try {
					// 从数据库切换收藏状态
					const result = await conversationService.supabaseService.toggleArticleFavorite(this.article.id)
					this.article.isFavorited = result.favorited
					
					// 更新收藏数（数据库触发器会自动更新）
					if (result.favorited) {
						this.article.favoriteCount = (this.article.favoriteCount || 0) + 1
					} else {
						this.article.favoriteCount = Math.max(0, (this.article.favoriteCount || 0) - 1)
					}
					
					// 同时更新本地存储（作为备用）
					try {
						let favorites = uni.getStorageSync('library_favorites') || []
						if (result.favorited) {
							if (!favorites.includes(this.article.id)) {
								favorites.push(this.article.id)
							}
						} else {
							favorites = favorites.filter(id => id !== this.article.id)
						}
						uni.setStorageSync('library_favorites', favorites)
					} catch (error) {
						console.error('更新本地收藏失败:', error)
					}
					
					uni.showToast({
						title: result.favorited ? '已收藏' : '已取消收藏',
						icon: 'success',
						duration: 1000
					})
				} catch (error) {
					console.error('切换收藏失败:', error)
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				}
			},
			
			// 保存阅读历史
			async saveReadHistory() {
				try {
					// 保存到数据库（会自动增加浏览数）
					await conversationService.supabaseService.saveArticleReadHistory(this.article.id, 100, 0)
					
					// 同时更新本地存储（作为备用）
					try {
						let history = uni.getStorageSync('library_read_history') || []
						history = history.filter(h => h.id !== this.article.id)
						history.unshift({
							id: this.article.id,
							title: this.article.title,
							category: this.article.category,
							date: new Date().toISOString()
						})
						history = history.slice(0, 50)
						uni.setStorageSync('library_read_history', history)
					} catch (error) {
						console.error('保存本地阅读历史失败:', error)
					}
					
					// 更新浏览数（数据库已自动更新，这里同步本地显示）
					this.article.viewCount = (this.article.viewCount || 0) + 1
				} catch (error) {
					console.error('保存阅读历史失败:', error)
					// 如果数据库失败，只更新本地存储
					try {
						let history = uni.getStorageSync('library_read_history') || []
						history = history.filter(h => h.id !== this.article.id)
						history.unshift({
							id: this.article.id,
							title: this.article.title,
							category: this.article.category,
							date: new Date().toISOString()
						})
						history = history.slice(0, 50)
						uni.setStorageSync('library_read_history', history)
					} catch (e) {
						console.error('保存本地阅读历史失败:', e)
					}
				}
			},
			
			// 分享文章
			shareArticle() {
				uni.showShareMenu({
					withShareTicket: true,
					success: () => {
						console.log('分享成功')
					},
					fail: (err) => {
						console.error('分享失败:', err)
						uni.showToast({
							title: '分享功能暂不可用',
							icon: 'none'
						})
					}
				})
			},
			
			// 获取分类图标
			getCategoryIcon(category) {
				const icons = {
					'情绪管理': '😊',
					'压力应对': '😰',
					'人际关系': '👥',
					'自我成长': '🌱',
					'睡眠健康': '😴',
					'焦虑抑郁': '😔',
					'亲子关系': '👨‍👩‍👧'
				}
				return icons[category] || '📚'
			},
			
			// 获取分类颜色
			getCategoryColor(category) {
				const colors = {
					'情绪管理': '#FFE5E5',
					'压力应对': '#FFF4E5',
					'人际关系': '#E5F3FF',
					'自我成长': '#E5FFE5',
					'睡眠健康': '#F0E5FF',
					'焦虑抑郁': '#FFE5F0',
					'亲子关系': '#FFF0E5'
				}
				return colors[category] || '#F5F5F5'
			},
			
			// 格式化日期
			formatDate(dateStr) {
				if (!dateStr) return ''
				const date = new Date(dateStr)
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}
		}
	}
</script>

<style scoped>
.article-detail-page {
	min-height: 100vh;
	background: #F5F9FF;
	display: flex;
	flex-direction: column;
}

/* 文章头部 */
.article-header {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	padding: 40rpx 30rpx 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.2);
}

.header-content {
	color: white;
}

.article-title-wrapper {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.article-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
	line-height: 1.5;
	flex: 1;
	margin-right: 15rpx;
}

.article-badges {
	display: flex;
	gap: 8rpx;
	flex-shrink: 0;
}

.article-badge {
	font-size: 20rpx;
	padding: 4rpx 10rpx;
	border-radius: 10rpx;
	font-weight: 500;
	background: rgba(255, 255, 255, 0.3);
	color: #fff;
}

.article-meta {
	display: flex;
	gap: 30rpx;
	margin-bottom: 20rpx;
	flex-wrap: wrap;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.meta-icon {
	font-size: 24rpx;
}

.meta-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
}

.article-category {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	background: rgba(255, 255, 255, 0.2);
}

.category-icon {
	font-size: 24rpx;
}

.category-text {
	font-size: 24rpx;
	color: #fff;
	font-weight: 500;
}

/* 文章内容 */
.article-content {
	flex: 1;
	height: 0;
}

.content-wrapper {
	padding: 40rpx 30rpx 120rpx;
}

.article-body {
	background: #fff;
	border-radius: 24rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.content-text {
	font-size: 30rpx;
	line-height: 2;
	color: #333;
	white-space: pre-wrap;
	word-wrap: break-word;
}

.loading-content {
	text-align: center;
	padding: 100rpx 20rpx;
}

.loading-spinner {
	display: flex;
	justify-content: center;
	gap: 8rpx;
	margin-bottom: 20rpx;
}

.spinner-dot {
	font-size: 40rpx;
	color: #1890FF;
	animation: dotPulse 1.4s infinite ease-in-out both;
}

.spinner-dot:nth-child(1) {
	animation-delay: -0.32s;
}

.spinner-dot:nth-child(2) {
	animation-delay: -0.16s;
}

@keyframes dotPulse {
	0%, 80%, 100% {
		transform: scale(0.6);
		opacity: 0.5;
	}
	40% {
		transform: scale(1.2);
		opacity: 1;
	}
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

/* 底部操作栏 */
.article-footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	padding: 20rpx 30rpx;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
	z-index: 100;
}

.footer-actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	background: #F5F5F5;
	transition: all 0.3s;
}

.action-btn:active {
	transform: scale(0.95);
}

.action-btn.active {
	background: #FFE5E5;
}

.action-icon {
	font-size: 32rpx;
}

.action-text {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.action-btn.active .action-text {
	color: #FF6B6B;
}

.share-btn {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.share-btn .action-text {
	color: #fff;
}

.share-btn .action-icon {
	filter: brightness(0) invert(1);
}
</style>

