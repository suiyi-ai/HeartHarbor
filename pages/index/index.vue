<template>
	<view class="home-page">
		<!-- 顶部Banner -->
		<view class="banner">
			<view class="welcome-section">
				<text class="greeting">下午好，心屿用户</text>
				<text class="sub-greeting">今天的心情如何？</text>
			</view>
			<view class="user-status">
				<text class="status-text">已连续记录7天</text>
				<view class="status-badge">良好</view>
			</view>
		</view>
		
		<!-- 小程序功能介绍 -->
		<view class="feature-intro">
			<text class="section-title">小程序功能介绍</text>
			<view class="feature-grid">
				<view class="feature-item">
					<view class="feature-icon">🌳</view>
					<text class="feature-title">树洞倾诉</text>
					<text class="feature-desc">匿名分享心事，获得温暖回应，让情绪得到释放</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">🤖</view>
					<text class="feature-title">AI心理伙伴</text>
					<text class="feature-desc">24小时在线陪伴，提供专业心理支持和情绪疏导</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">📊</view>
					<text class="feature-title">心理测评</text>
					<text class="feature-desc">专业心理测试工具，帮助您更好地了解自己的心理状态</text>
				</view>
				<view class="feature-item">
					<view class="feature-icon">🎵</view>
					<text class="feature-title">放松音乐</text>
					<text class="feature-desc">精选放松音乐库，帮助缓解压力，改善睡眠质量</text>
				</view>
			</view>
		</view>
		
		<!-- 今日心情记录 -->
		<view class="mood-section">
			<text class="section-title">记录今日心情</text>
			<view class="mood-selector">
				<view 
					v-for="(mood, index) in moods" 
					:key="index"
					:class="['mood-item', {active: selectedMood === index}]"
					@click="selectMood(index)">
					<text class="mood-emoji">{{mood.emoji}}</text>
					<text class="mood-text">{{mood.text}}</text>
				</view>
			</view>
			<view class="mood-input">
				<input 
					class="input" 
					placeholder="想记录些什么吗？（可选）" 
					v-model="moodNote"
				/>
				<button class="save-btn" @click="saveMood">保存</button>
			</view>
		</view>
		
		<!-- 心理知识卡片 -->
		<view class="knowledge-section">
			<text class="section-title">今日心理知识</text>
			<view class="knowledge-cards">
				<view class="knowledge-card">
					<text class="card-title">情绪管理小贴士</text>
					<text class="card-content">当感到焦虑时，尝试深呼吸5秒，保持5秒，再缓慢呼气5秒，重复几次可以帮助平静情绪。</text>
				</view>
				<view class="knowledge-card">
					<text class="card-title">健康睡眠建议</text>
					<text class="card-content">保持规律的睡眠时间，睡前1小时避免使用电子设备，有助于提高睡眠质量。</text>
				</view>
			</view>
		</view>
		
		<!-- 推荐内容 -->
		<view class="recommend-section">
			<text class="section-title">推荐内容</text>
			<view class="recommend-list">
				<view class="recommend-item">
					<text class="recommend-title">如何应对工作压力</text>
					<text class="recommend-desc">实用的压力管理技巧</text>
				</view>
				<view class="recommend-item">
					<text class="recommend-title">周末放松活动</text>
					<text class="recommend-desc">适合周末的心理放松方式</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedMood: -1,
				moodNote: '',
				moods: [
					{ emoji: '😊', text: '开心' },
					{ emoji: '😐', text: '平静' },
					{ emoji: '😔', text: '难过' },
					{ emoji: '😰', text: '焦虑' },
					{ emoji: '😴', text: '疲惫' }
				]
			}
		},
		methods: {
			selectMood(index) {
				this.selectedMood = index
			},
			saveMood() {
				if (this.selectedMood === -1) {
					uni.showToast({
						title: '请选择心情',
						icon: 'none'
					})
					return
				}
				
				const mood = this.moods[this.selectedMood]
				uni.showToast({
					title: `心情记录成功：${mood.text}`,
					icon: 'success'
				})
				
				// 重置选择
				this.selectedMood = -1
				this.moodNote = ''
			},
			navigateTo(page) {
				switch(page) {
					case 'hole':
						uni.switchTab({
							url: '/pages/hole/hole',
							success: () => {
								console.log('导航成功：跳转到树洞页面')
							},
							fail: (err) => {
								console.error('导航失败:', err)
								uni.showToast({
									title: '页面跳转失败，请重试',
									icon: 'none'
								})
							}
						})
						break
					case 'ai':
						uni.switchTab({
							url: '/pages/ai/ai',
							success: () => {
								console.log('导航成功：跳转到AI伙伴页面')
							},
							fail: (err) => {
								console.error('导航失败:', err)
								uni.showToast({
									title: '页面跳转失败，请重试',
									icon: 'none'
								})
							}
						})
						break
					case 'test':
						uni.showToast({
							title: '心理测试功能开发中',
							icon: 'none'
						})
						break
					case 'music':
						uni.showToast({
							title: '放松音乐功能开发中',
							icon: 'none'
						})
						break
				}
			}
		}
	}
</script>

<style scoped>
.home-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 20rpx;
}

/* 顶部Banner */
.banner {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	color: white;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.3);
}

.welcome-section {
	margin-bottom: 20rpx;
}

.greeting {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.sub-greeting {
	display: block;
	font-size: 28rpx;
	opacity: 0.9;
}

.user-status {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.status-text {
	font-size: 26rpx;
}

.status-badge {
	background: rgba(255, 255, 255, 0.2);
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

/* 小程序功能介绍 */
.feature-intro {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
}

.feature-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 25rpx 20rpx;
	background: #F8F9FA;
	border-radius: 15rpx;
	transition: all 0.3s;
}

.feature-item:hover {
	background: #E6F3FF;
	transform: translateY(-2rpx);
}

.feature-icon {
	font-size: 50rpx;
	margin-bottom: 15rpx;
}

.feature-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #1890FF;
	margin-bottom: 10rpx;
	text-align: center;
}

.feature-desc {
	font-size: 22rpx;
	color: #666;
	text-align: center;
	line-height: 1.4;
}

/* 心情记录 */
.mood-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.mood-selector {
	display: flex;
	justify-content: space-between;
	margin-bottom: 30rpx;
}

.mood-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx;
	border-radius: 15rpx;
	background: #F8F9FA;
	transition: all 0.3s;
}

.mood-item.active {
	background: #E6F3FF;
	border: 2rpx solid #1890FF;
}

.mood-emoji {
	font-size: 40rpx;
	margin-bottom: 10rpx;
}

.mood-text {
	font-size: 24rpx;
	color: #666;
}

.mood-input {
	display: flex;
	gap: 20rpx;
}

.input {
	flex: 1;
	height: 80rpx;
	background: #F8F9FA;
	border: 2rpx solid #E6F3FF;
	border-radius: 40rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
}

.save-btn {
	width: 120rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 40rpx;
	font-size: 28rpx;
	border: none;
}

/* 知识卡片 */
.knowledge-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.knowledge-cards {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.knowledge-card {
	background: #F8F9FA;
	border-radius: 15rpx;
	padding: 25rpx;
}

.card-title {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #1890FF;
	margin-bottom: 15rpx;
}

.card-content {
	display: block;
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
}

/* 推荐内容 */
.recommend-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.recommend-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.recommend-item {
	background: #F8F9FA;
	border-radius: 15rpx;
	padding: 25rpx;
}

.recommend-title {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.recommend-desc {
	display: block;
	font-size: 24rpx;
	color: #666;
}
</style>
