<template>
	<view class="favorites-page">
		<!-- 头部 -->
		<view class="header">
			<text class="title">❤️ 我的收藏</text>
			<text class="subtitle">共 {{ favorites.length }} 篇文章</text>
		</view>
		
		<!-- 收藏列表 -->
		<scroll-view 
			class="favorites-list" 
			scroll-y="true"
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="loadMore"
			:lower-threshold="100"
		>
			<view class="empty-state" v-if="!isLoading && favorites.length === 0">
				<text class="empty-icon">📚</text>
				<text class="empty-text">还没有收藏文章</text>
				<text class="empty-desc">去心理库发现感兴趣的文章吧~</text>
				<button class="goto-library-btn" @click="gotoLibrary">去心理库</button>
			</view>
			
			<view 
				class="article-item" 
				v-for="(article, index) in favorites" 
				:key="article.id || index"
				:style="{animationDelay: (index * 0.05) + 's'}"
				@click="readArticle(article)"
			>
				<view class="article-header">
					<view class="article-title-wrapper">
						<text class="article-title">{{ article.title }}</text>
						<view class="article-badges">
							<text class="article-badge hot" v-if="article.isHot">🔥</text>
							<text class="article-badge new" v-if="article.isNew">✨</text>
						</view>
					</view>
					<text class="article-category">{{ getCategoryIcon(article.category) }} {{ article.category }}</text>
				</view>
				
				<text class="article-summary" v-if="article.summary">{{ article.summary }}</text>
				
				<view class="article-footer">
					<view class="article-meta">
						<text class="meta-item">⏱️ {{ article.readTime || 5 }}分钟</text>
						<text class="meta-item">👁️ {{ article.viewCount || 0 }}</text>
						<text class="meta-item">❤️ {{ article.favoriteCount || 0 }}</text>
					</view>
					<text class="article-date">{{ formatDate(article.favoritedAt || article.date) }}</text>
				</view>
			</view>
			
			<view class="loading-more" v-if="isLoadingMore">
				<text>加载中...</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import conversationService from '@/utils/supabase.js'
	
	export default {
		data() {
			return {
				favorites: [],
				isLoading: false,
				isRefreshing: false,
				isLoadingMore: false,
				currentPage: 1,
				hasMore: true
			}
		},
		onLoad() {
			this.loadFavorites()
		},
		onShow() {
			// 页面显示时刷新收藏列表
			this.loadFavorites(true)
		},
		methods: {
			async loadFavorites(refresh = false) {
				if (this.isLoading) return
				
				if (refresh) {
					this.currentPage = 1
					this.hasMore = true
					this.favorites = []
				}
				
				if (!this.hasMore) return
				
				this.isLoading = true
				
				try {
					const newFavorites = await conversationService.supabaseService.getUserFavoriteArticles(
						this.currentPage,
						20
					)
					
					if (refresh) {
						this.favorites = newFavorites
					} else {
						this.favorites = [...this.favorites, ...newFavorites]
					}
					
					this.hasMore = newFavorites.length >= 20
					if (this.hasMore) {
						this.currentPage++
					}
				} catch (error) {
					console.error('加载收藏失败:', error)
					if (error.message && error.message.includes('Could not find the table')) {
						uni.showToast({
							title: '请先在数据库中创建收藏表',
							icon: 'none',
							duration: 3000
						})
					}
				} finally {
					this.isLoading = false
					this.isRefreshing = false
					this.isLoadingMore = false
				}
			},
			
			async onRefresh() {
				this.isRefreshing = true
				await this.loadFavorites(true)
			},
			
			async loadMore() {
				if (this.isLoadingMore || !this.hasMore) return
				this.isLoadingMore = true
				await this.loadFavorites()
			},
			
			readArticle(article) {
				uni.navigateTo({
					url: `/pages/library/article-detail?id=${article.id}`,
					success: () => {
						console.log('导航成功：跳转到文章详情')
					},
					fail: (err) => {
						console.error('导航失败:', err)
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						})
					}
				})
			},
			
			gotoLibrary() {
				uni.switchTab({
					url: '/pages/library/library',
					success: () => {
						console.log('导航成功：跳转到心理库')
					},
					fail: (err) => {
						console.error('导航失败:', err)
					}
				})
			},
			
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
				
				const month = date.getMonth() + 1
				const day = date.getDate()
				return `${month}月${day}日`
			}
		}
	}
</script>

<style scoped>
.favorites-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F0F8FF 50%, #E6F3FF 100%);
	display: flex;
	flex-direction: column;
}

.header {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 50%, #B0D8FF 100%);
	padding: 40rpx 30rpx 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.4);
}

.title {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #2C5F8D;
	margin-bottom: 10rpx;
}

.subtitle {
	display: block;
	font-size: 26rpx;
	color: #5A7FA3;
}

.favorites-list {
	flex: 1;
	padding: 20rpx;
}

.empty-state {
	text-align: center;
	padding: 150rpx 0;
}

.empty-icon {
	display: block;
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	display: block;
	font-size: 32rpx;
	color: #999;
	margin-bottom: 16rpx;
}

.empty-desc {
	display: block;
	font-size: 26rpx;
	color: #ccc;
	margin-bottom: 50rpx;
}

.goto-library-btn {
	width: 300rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #4A90E2 0%, #87CEEB 100%);
	color: white;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
	box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
}

.article-item {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.1);
	animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
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
	margin-bottom: 12rpx;
}

.article-title {
	flex: 1;
	font-size: 32rpx;
	font-weight: bold;
	color: #2C5F8D;
	line-height: 1.4;
	margin-right: 16rpx;
}

.article-badges {
	display: flex;
	gap: 8rpx;
}

.article-badge {
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.article-badge.hot {
	background: #FFE5E5;
	color: #FF6B9D;
}

.article-badge.new {
	background: #E6F3FF;
	color: #4A90E2;
}

.article-category {
	font-size: 24rpx;
	color: #7A9BC4;
}

.article-summary {
	display: block;
	font-size: 26rpx;
	color: #5A7FA3;
	line-height: 1.6;
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
}

.article-meta {
	display: flex;
	gap: 20rpx;
}

.meta-item {
	font-size: 22rpx;
	color: #999;
}

.article-date {
	font-size: 22rpx;
	color: #B0C4DE;
}

.loading-more {
	text-align: center;
	padding: 30rpx;
	color: #999;
	font-size: 26rpx;
}
</style>

