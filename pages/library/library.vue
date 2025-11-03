<template>
	<view class="library-page">
		<view class="header">
			<text class="title">心理知识库</text>
			<text class="subtitle">专业心理知识，助你更好成长</text>
		</view>
		
		<view class="search-bar">
			<view class="search-input">
				<text class="search-icon">🔍</text>
				<input class="input" placeholder="搜索心理知识..." v-model="searchText" />
			</view>
		</view>
		
		<view class="category-tabs">
			<scroll-view class="tabs-scroll" scroll-x="true" enable-flex>
				<view class="tabs">
					<view 
						v-for="(tab, index) in tabs" 
						:key="index"
						:class="['tab', {active: activeTab === index}]"
						@click="activeTab = index">
						{{tab}}
					</view>
				</view>
			</scroll-view>
		</view>
		
		<view class="content-list">
			<view class="article-item" v-for="(article, index) in filteredArticles" :key="index">
				<view class="article-header">
					<text class="article-title">{{article.title}}</text>
					<text class="article-category">{{article.category}}</text>
				</view>
				<text class="article-summary">{{article.summary}}</text>
				<view class="article-footer">
					<text class="read-time">{{article.readTime}}分钟阅读</text>
					<text class="read-btn" @click="readArticle(article)">阅读全文</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchText: '',
				activeTab: 0,
				tabs: ['全部', '情绪管理', '压力应对', '人际关系', '自我成长', '睡眠健康'],
				articles: [
					{
						title: '如何有效管理焦虑情绪',
						category: '情绪管理',
						summary: '焦虑是常见的情绪反应，学习识别焦虑信号并采取有效措施可以帮助你更好地管理情绪...',
						readTime: 5,
						content: '焦虑管理详细内容...'
					},
					{
						title: '工作压力大的应对策略',
						category: '压力应对',
						summary: '现代职场压力普遍存在，掌握科学的压力管理方法对保持心理健康至关重要...',
						readTime: 8,
						content: '压力应对详细内容...'
					},
					{
						title: '改善人际关系的5个技巧',
						category: '人际关系',
						summary: '良好的人际关系是心理健康的重要保障，学习有效的沟通技巧可以改善人际关系...',
						readTime: 6,
						content: '人际关系详细内容...'
					},
					{
						title: '提升自我认知的方法',
						category: '自我成长',
						summary: '自我认知是个人成长的基础，通过反思和觉察可以更好地了解自己...',
						readTime: 7,
						content: '自我成长详细内容...'
					},
					{
						title: '改善睡眠质量的实用建议',
						category: '睡眠健康',
						summary: '良好的睡眠对心理健康至关重要，掌握科学的睡眠习惯可以显著改善睡眠质量...',
						readTime: 4,
						content: '睡眠健康详细内容...'
					}
				]
			}
		},
		computed: {
			filteredArticles() {
				let filtered = this.articles
				
				// 按分类筛选
				if (this.activeTab > 0) {
					const category = this.tabs[this.activeTab]
					filtered = filtered.filter(article => article.category === category)
				}
				
				// 按搜索关键词筛选
				if (this.searchText) {
					const keyword = this.searchText.toLowerCase()
					filtered = filtered.filter(article => 
						article.title.toLowerCase().includes(keyword) ||
						article.summary.toLowerCase().includes(keyword)
					)
				}
				
				return filtered
			}
		},
		methods: {
			readArticle(article) {
				uni.showModal({
					title: article.title,
					content: article.content,
					showCancel: false,
					confirmText: '知道了'
				})
			}
		}
	}
</script>

<style scoped>
.library-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 20rpx;
}

.header {
	text-align: center;
	margin-bottom: 40rpx;
}

.title {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: #1890FF;
	margin-bottom: 10rpx;
}

.subtitle {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.search-bar {
	margin-bottom: 30rpx;
}

.search-input {
	background: #fff;
	border-radius: 40rpx;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.search-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	color: #999;
}

.input {
	flex: 1;
	font-size: 28rpx;
}

.category-tabs {
	margin-bottom: 30rpx;
}

.tabs-scroll {
	white-space: nowrap;
}

.tabs {
	display: inline-flex;
	gap: 20rpx;
}

.tab {
	background: #fff;
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
	white-space: nowrap;
	box-shadow: 0 2rpx 10rpx rgba(24, 144, 255, 0.1);
}

.tab.active {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
}

.article-item {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.article-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.article-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	flex: 1;
	margin-right: 20rpx;
}

.article-category {
	font-size: 22rpx;
	color: #1890FF;
	background: #E6F3FF;
	padding: 5rpx 15rpx;
	border-radius: 15rpx;
}

.article-summary {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
	margin-bottom: 20rpx;
	display: block;
}

.article-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.read-time {
	font-size: 24rpx;
	color: #999;
}

.read-btn {
	font-size: 26rpx;
	color: #1890FF;
	background: #E6F3FF;
	padding: 10rpx 20rpx;
	border-radius: 15rpx;
}
</style>