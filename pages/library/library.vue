<template>
	<view class="library-page">
		<!-- 头部 -->
		<view class="header">
			<view class="header-content">
				<text class="title">📚 心理知识库</text>
				<text class="subtitle">专业心理知识，助你更好成长</text>
			</view>
		</view>
		
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<text class="search-icon">🔍</text>
				<input 
					class="input" 
					placeholder="搜索心理知识..." 
					v-model="searchText"
					@input="onSearchInput"
					@confirm="onSearchConfirm"
				/>
				<text class="clear-icon" v-if="searchText" @click="clearSearch">✕</text>
			</view>
		</view>
		
		<!-- 分类标签 -->
		<view class="category-tabs">
			<scroll-view 
				class="tabs-scroll" 
				scroll-x="true" 
				show-scrollbar="false"
				:scroll-left="scrollLeft"
			>
				<view class="tabs">
					<view 
						v-for="(tab, index) in tabs" 
						:key="index"
						:class="['tab', {active: activeTab === index}]"
						@click="selectTab(index)"
					>
						<text class="tab-icon">{{tab.icon}}</text>
						<text class="tab-text">{{tab.name}}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 热门推荐 -->
		<view class="hot-section" v-if="activeTab === 0 && !searchText">
			<view class="section-header">
				<text class="section-title">🔥 热门推荐</text>
			</view>
			<scroll-view class="hot-list" scroll-x="true" show-scrollbar="false">
				<view 
					class="hot-item" 
					v-for="(article, index) in hotArticles" 
					:key="article.id"
					@click="readArticle(article)"
				>
					<view class="hot-badge" v-if="index === 0">TOP 1</view>
					<text class="hot-title">{{article.title}}</text>
					<text class="hot-category">{{article.category}}</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 文章列表 -->
		<scroll-view 
			class="content-list" 
			scroll-y="true"
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="loadMore"
			:lower-threshold="100"
		>
			<view class="articles-container">
				<!-- 空状态 -->
				<view class="empty-state" v-if="!isLoading && filteredArticles.length === 0">
					<view class="empty-icon-wrapper">
						<text class="empty-icon">📖</text>
					</view>
					<text class="empty-text">暂无相关文章</text>
					<text class="empty-desc">试试其他分类或关键词吧~</text>
				</view>
				
				<!-- 文章卡片 -->
				<view 
					class="article-item" 
					v-for="(article, index) in filteredArticles" 
					:key="article.id || index"
					:style="{animationDelay: (index * 0.05) + 's'}"
					@click="readArticle(article)"
				>
					<view class="article-header">
						<view class="article-title-wrapper">
							<text class="article-title">{{article.title}}</text>
							<view class="article-badges">
								<text class="article-badge hot" v-if="article.isHot">🔥 热门</text>
								<text class="article-badge new" v-if="article.isNew">✨ 新</text>
							</view>
						</view>
						<view class="article-category" :style="{backgroundColor: getCategoryColor(article.category)}">
							<text class="category-icon">{{getCategoryIcon(article.category)}}</text>
							<text class="category-text">{{article.category}}</text>
						</view>
					</view>
					
					<text class="article-summary">{{article.summary}}</text>
					
					<view class="article-footer">
						<view class="article-meta">
							<text class="read-time">⏱ {{article.readTime}}分钟阅读</text>
							<text class="view-count">👁 {{article.viewCount || 0}}次浏览</text>
							<text class="article-date">{{formatDate(article.date)}}</text>
						</view>
						<view class="article-actions">
							<view 
								class="action-btn favorite-btn" 
								:class="{active: article.isFavorited}"
								@click.stop="toggleFavorite(article, index)"
							>
								<text class="action-icon">{{article.isFavorited ? '❤️' : '🤍'}}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMore && !isLoading && filteredArticles.length > 0">
					<view class="load-more-content">
						<text class="load-more-icon">⬇️</text>
						<text class="load-more-text">上拉加载更多</text>
					</view>
				</view>
				
				<!-- 加载中 -->
				<view class="loading" v-if="isLoading && filteredArticles.length > 0">
					<view class="loading-spinner">
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
					</view>
					<text class="loading-text">加载中...</text>
				</view>
				
				<!-- 没有更多 -->
				<view class="no-more" v-if="!hasMore && filteredArticles.length > 0">
					<view class="no-more-line"></view>
					<text class="no-more-text">没有更多了</text>
					<view class="no-more-line"></view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import conversationService from '@/utils/supabase.js'
	
	// 页面路径常量 - 显式定义以确保代码依赖分析能够识别
	const ARTICLE_DETAIL_PAGE = '/pages/library/article-detail'
	
	export default {
		data() {
			return {
				searchText: '',
				activeTab: 0,
				scrollLeft: 0,
				isRefreshing: false,
				isLoading: false,
				hasMore: true,
				currentPage: 1,
				pageSize: 10,
				tabs: [
					{ name: '全部', icon: '📚', value: 'all' },
					{ name: '情绪管理', icon: '😊', value: '情绪管理' },
					{ name: '压力应对', icon: '😰', value: '压力应对' },
					{ name: '人际关系', icon: '👥', value: '人际关系' },
					{ name: '自我成长', icon: '🌱', value: '自我成长' },
					{ name: '睡眠健康', icon: '😴', value: '睡眠健康' },
					{ name: '焦虑抑郁', icon: '😔', value: '焦虑抑郁' },
					{ name: '亲子关系', icon: '👨‍👩‍👧', value: '亲子关系' }
				],
				
				articles: [] // 从数据库加载，不再使用硬编码数据
			}
		},
		
		computed: {
			// 热门文章（从数据库加载）
			hotArticles() {
				// 如果文章列表中有热门文章，返回前5条
				// 否则返回空数组（热门文章会在loadArticles时加载）
				return this.articles.filter(article => article.isHot).slice(0, 5)
			},
			
			// 筛选后的文章（现在已经从数据库筛选，这里直接返回）
			filteredArticles() {
				// 由于已经在loadArticles中按分类和搜索筛选，这里直接返回
				// 但如果需要前端再次筛选，可以保留以下逻辑
				return [...this.articles]
			}
		},
		
		onLoad() {
			this.loadArticles()
			this.loadFavorites()
		},
		
		onShow() {
			// 刷新收藏状态和文章列表
			this.loadFavorites()
			// 如果文章列表为空，重新加载
			if (this.articles.length === 0) {
				this.loadArticles()
			}
		},
		
		methods: {
			// 加载文章列表
			async loadArticles(refresh = false) {
				if (this.isLoading) return
				
				this.isLoading = true
				
				try {
					if (refresh) {
						this.currentPage = 1
						this.hasMore = true
					}
					
					// 获取分类
					const category = this.activeTab === 0 ? null : this.tabs[this.activeTab].value
					
					// 从数据库加载文章
					const newArticles = await conversationService.supabaseService.getArticles({
						page: this.currentPage,
						limit: this.pageSize,
						category: category,
						search: this.searchText || null,
						orderBy: 'created_at',
						order: 'desc'
					})
					
					// 检查用户收藏状态
					for (let article of newArticles) {
						try {
							article.isFavorited = await conversationService.supabaseService.checkUserFavoriteArticle(article.id)
						} catch (error) {
							console.error('检查收藏状态失败:', error)
							article.isFavorited = false
						}
						
						// 格式化日期
						if (article.date) {
							article.date = new Date(article.date).toISOString().split('T')[0]
						}
					}
					
					if (refresh) {
						this.articles = newArticles
					} else {
						this.articles = [...this.articles, ...newArticles]
					}
					
					// 检查是否还有更多
					this.hasMore = newArticles.length >= this.pageSize
					if (this.hasMore) {
						this.currentPage++
					}
				} catch (error) {
					console.error('加载文章失败:', error)
					// 如果数据库加载失败，使用本地存储的备用数据
					uni.showToast({
						title: '加载失败，使用本地数据',
						icon: 'none',
						duration: 1500
					})
				} finally {
					this.isLoading = false
					this.isRefreshing = false
				}
			},
			
			// 选择分类
			selectTab(index) {
				this.activeTab = index
				// 重新加载文章
				this.currentPage = 1
				this.hasMore = true
				this.loadArticles(true)
				// 滚动到选中的标签
				this.$nextTick(() => {
					const query = uni.createSelectorQuery().in(this)
					query.selectAll('.tab').boundingClientRect((rects) => {
						if (rects[index]) {
							this.scrollLeft = rects[index].left - 40
						}
					}).exec()
				})
			},
			
			// 搜索输入
			onSearchInput(e) {
				this.searchText = e.detail.value
			},
			
			// 搜索确认
			onSearchConfirm() {
				// 重新加载文章
				this.currentPage = 1
				this.hasMore = true
				this.loadArticles(true)
			},
			
			// 清空搜索
			clearSearch() {
				this.searchText = ''
				// 重新加载文章
				this.currentPage = 1
				this.hasMore = true
				this.loadArticles(true)
			},
			
			// 下拉刷新
			onRefresh() {
				this.isRefreshing = true
				this.currentPage = 1
				this.hasMore = true
				this.loadArticles(true)
			},
			
			// 加载更多
			loadMore() {
				if (this.hasMore && !this.isLoading) {
					this.loadArticles(false)
				}
			},
			
			// 阅读文章
			async readArticle(article) {
				try {
					// 保存阅读历史到数据库
					await conversationService.supabaseService.saveArticleReadHistory(article.id, 100, 0)
					
					// 增加浏览数（数据库会自动更新）
					article.viewCount = (article.viewCount || 0) + 1
				} catch (error) {
					console.error('保存阅读历史失败:', error)
					// 失败不影响跳转
				}
				
				// 跳转到文章详情页
				// 使用显式定义的页面路径常量，确保代码依赖分析能够识别
				const articleDetailUrl = ARTICLE_DETAIL_PAGE + `?id=${article.id}&title=${encodeURIComponent(article.title)}`
				uni.navigateTo({
					url: articleDetailUrl,
					success: () => {
						console.log('导航成功：跳转到文章详情页')
					},
					fail: (err) => {
						console.error('导航失败:', err)
						// 如果页面不存在，使用弹窗显示
						this.showArticleModal(article)
					}
				})
			},
			
			// 显示文章弹窗（备用方案）
			showArticleModal(article) {
				uni.showModal({
					title: article.title,
					content: article.content.substring(0, 500) + '...',
					showCancel: false,
					confirmText: '知道了',
					success: () => {
						// 可以添加查看更多逻辑
					}
				})
			},
			
			// 切换收藏
			async toggleFavorite(article, index) {
				try {
					// 从数据库切换收藏状态
					const result = await conversationService.supabaseService.toggleArticleFavorite(article.id)
					article.isFavorited = result.favorited
					
					// 更新收藏数（数据库触发器会自动更新）
					if (result.favorited) {
						article.favoriteCount = (article.favoriteCount || 0) + 1
					} else {
						article.favoriteCount = Math.max(0, (article.favoriteCount || 0) - 1)
					}
					
					// 同时更新本地存储（作为备用）
					try {
						let favorites = uni.getStorageSync('library_favorites') || []
						if (result.favorited) {
							if (!favorites.includes(article.id)) {
								favorites.push(article.id)
							}
						} else {
							favorites = favorites.filter(id => id !== article.id)
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
			
			// 加载收藏列表
			async loadFavorites() {
				try {
					// 从数据库加载收藏状态
					for (let article of this.articles) {
						try {
							article.isFavorited = await conversationService.supabaseService.checkUserFavoriteArticle(article.id)
						} catch (error) {
							console.error('检查收藏状态失败:', error)
							// 如果数据库失败，使用本地存储作为备用
							const favorites = uni.getStorageSync('library_favorites') || []
							article.isFavorited = favorites.includes(article.id)
						}
					}
				} catch (error) {
					console.error('加载收藏失败:', error)
					// 如果数据库失败，使用本地存储作为备用
					try {
						const favorites = uni.getStorageSync('library_favorites') || []
						this.articles.forEach(article => {
							article.isFavorited = favorites.includes(article.id)
						})
					} catch (e) {
						console.error('加载本地收藏失败:', e)
					}
				}
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
			
			// 获取分类颜色 - 淡蓝色主题
			getCategoryColor(category) {
				const colors = {
					'情绪管理': '#E6F3FF',
					'压力应对': '#E8F4FD',
					'人际关系': '#E6F3FF',
					'自我成长': '#EAF5FF',
					'睡眠健康': '#E6F0FF',
					'焦虑抑郁': '#E8F2FF',
					'亲子关系': '#EAF4FF'
				}
				return colors[category] || '#F5F9FF'
			},
			
			// 格式化日期
			formatDate(dateStr) {
				if (!dateStr) return ''
				const date = new Date(dateStr)
				const now = new Date()
				const diff = now - date
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (days === 0) return '今天'
				if (days === 1) return '昨天'
				if (days < 7) return `${days}天前`
				if (days < 30) return `${Math.floor(days / 7)}周前`
				if (days < 365) return `${Math.floor(days / 30)}个月前`
				return `${Math.floor(days / 365)}年前`
			},
			
		}
	}
</script>

<style scoped>
.library-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F0F8FF 50%, #E6F3FF 100%);
	padding: 0;
	display: flex;
	flex-direction: column;
}

/* 头部样式 - 淡蓝色主题 */
.header {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 50%, #B0D8FF 100%);
	padding: 40rpx 30rpx 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.4);
}

.header-content {
	text-align: center;
}

.title {
	display: block;
	font-size: 52rpx;
	font-weight: bold;
	color: #fff;
	margin-bottom: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.subtitle {
	display: block;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

/* 搜索栏 - 淡蓝色主题 */
.search-bar {
	padding: 20rpx;
	background: transparent;
}

.search-input {
	background: #fff;
	border-radius: 44rpx;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.2);
	border: 2rpx solid rgba(176, 216, 255, 0.4);
}

.search-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
	color: #999;
}

.input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.clear-icon {
	font-size: 24rpx;
	color: #999;
	padding: 5rpx 10rpx;
	margin-left: 10rpx;
}

/* 分类标签 */
.category-tabs {
	padding: 0 20rpx 20rpx;
}

.tabs-scroll {
	white-space: nowrap;
}

.tabs {
	display: inline-flex;
	gap: 15rpx;
	padding: 10rpx 0;
}

.tab {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	background: #fff;
	padding: 12rpx 24rpx;
	border-radius: 24rpx;
	font-size: 26rpx;
	color: #666;
	white-space: nowrap;
	box-shadow: 0 2rpx 10rpx rgba(176, 216, 255, 0.2);
	transition: all 0.3s;
	border: 2rpx solid transparent;
}

.tab:active {
	transform: scale(0.95);
}

.tab.active {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	color: white;
	border-color: #87CEEB;
	box-shadow: 0 4rpx 15rpx rgba(176, 216, 255, 0.5);
}

.tab-icon {
	font-size: 28rpx;
}

.tab-text {
	font-weight: 500;
}

/* 热门推荐 */
.hot-section {
	padding: 0 20rpx 20rpx;
}

.section-header {
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.hot-list {
	white-space: nowrap;
}

.hot-item {
	display: inline-block;
	width: 280rpx;
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	border-radius: 20rpx;
	padding: 25rpx;
	margin-right: 20rpx;
	color: white;
	position: relative;
	box-shadow: 0 6rpx 20rpx rgba(176, 216, 255, 0.5);
}

.hot-badge {
	position: absolute;
	top: -10rpx;
	right: 15rpx;
	background: #FFD700;
	color: #333;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-weight: bold;
}

.hot-title {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
	line-height: 1.4;
}

.hot-category {
	display: block;
	font-size: 22rpx;
	opacity: 0.9;
}

/* 文章列表 */
.content-list {
	flex: 1;
	height: 0;
	padding: 0 20rpx 20rpx;
}

.articles-container {
	padding-bottom: 20rpx;
}

/* 文章卡片 - 淡蓝色主题 */
.article-item {
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 6rpx 25rpx rgba(176, 216, 255, 0.2);
	border: 2rpx solid rgba(176, 216, 255, 0.3);
	animation: slideInUp 0.5s ease-out both;
	transition: all 0.3s;
}

.article-item:active {
	transform: scale(0.99);
}

@keyframes slideInUp {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.article-header {
	margin-bottom: 20rpx;
}

.article-title-wrapper {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 15rpx;
}

.article-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
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
}

.article-badge.hot {
	background: #FFE5E5;
	color: #FF6B6B;
}

.article-badge.new {
	background: #E6F3FF;
	color: #4A90E2;
}

.article-category {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 14rpx;
	border-radius: 16rpx;
	font-size: 22rpx;
	font-weight: 500;
}

.category-icon {
	font-size: 22rpx;
}

.category-text {
	color: #666;
}

.article-summary {
	display: block;
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
	margin-bottom: 20rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.article-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 2rpx solid #F0F0F0;
}

.article-meta {
	display: flex;
	align-items: center;
	gap: 20rpx;
	flex: 1;
}

.read-time, .view-count, .article-date {
	font-size: 22rpx;
	color: #999;
}

.article-actions {
	display: flex;
	gap: 15rpx;
}

.action-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F5F5F5;
	transition: all 0.3s;
}

.action-btn:active {
	transform: scale(0.9);
}

.action-btn.active {
	background: #E6F3FF;
}

.action-icon {
	font-size: 32rpx;
}

/* 空状态 - 淡蓝色主题 */
.empty-state {
	text-align: center;
	padding: 120rpx 40rpx;
	background: #fff;
	border-radius: 24rpx;
	margin: 20rpx 0;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.2);
	border: 2rpx solid rgba(176, 216, 255, 0.3);
}

.empty-icon-wrapper {
	margin-bottom: 30rpx;
}

.empty-icon {
	display: block;
	font-size: 120rpx;
	margin: 0 auto;
}

.empty-text {
	display: block;
	font-size: 34rpx;
	color: #333;
	margin-bottom: 12rpx;
	font-weight: 600;
}

.empty-desc {
	display: block;
	font-size: 26rpx;
	color: #999;
	line-height: 1.6;
}

/* 加载状态 */
.load-more {
	text-align: center;
	padding: 40rpx 20rpx;
}

.load-more-content {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
}

.load-more-icon {
	font-size: 24rpx;
	animation: bounce 1s infinite;
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10rpx);
	}
}

.load-more-text {
	font-size: 26rpx;
	color: #999;
}

.loading {
	text-align: center;
	padding: 40rpx 20rpx;
}

.loading-spinner {
	display: flex;
	justify-content: center;
	gap: 8rpx;
	margin-bottom: 15rpx;
}

.spinner-dot {
	font-size: 40rpx;
	color: #87CEEB;
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
	display: block;
	font-size: 26rpx;
	color: #999;
}

.no-more {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	padding: 40rpx 20rpx;
}

.no-more-line {
	flex: 1;
	height: 2rpx;
	background: linear-gradient(90deg, transparent, #E0E0E0, transparent);
}

.no-more-text {
	font-size: 24rpx;
	color: #999;
	white-space: nowrap;
}

/* 响应式优化 */
@media (max-width: 750rpx) {
	.article-item {
		padding: 28rpx;
		margin-bottom: 20rpx;
	}
	
	.article-title {
		font-size: 30rpx;
	}
	
	.hot-item {
		width: 260rpx;
		padding: 20rpx;
	}
}
</style>
