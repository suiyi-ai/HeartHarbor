<template>
	<view class="mine-page">
		<view class="user-info" v-if="isLogin">
			<view class="avatar-section">
				<view class="avatar">
					<text class="avatar-text">👤</text>
				</view>
				<view class="user-details">
					<text class="username">{{ userInfo.name || '心屿用户' }}</text>
					<text class="user-desc">专注于心理健康成长</text>
				</view>
			</view>
			
			<view class="stats">
				<view class="stat-item">
					<text class="stat-number">7</text>
					<text class="stat-label">连续记录</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">23</text>
					<text class="stat-label">树洞倾诉</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">15</text>
					<text class="stat-label">知识学习</text>
				</view>
			</view>
		</view>
		
		<!-- 未登录状态 -->
		<view class="login-prompt" v-else>
			<view class="prompt-content">
				<text class="prompt-icon">🔐</text>
				<text class="prompt-title">请先登录</text>
				<text class="prompt-desc">登录后即可查看个人数据和使用全部功能</text>
				<view class="login-buttons">
					<button class="login-btn" @click="navigateToLogin">登录</button>
					<button class="register-btn" @click="navigateToRegister">注册</button>
				</view>
			</view>
		</view>
		
		<view class="menu-list" v-if="isLogin">
			<view class="menu-item" @click="navigateTo('settings')">
				<text class="menu-icon">⚙️</text>
				<text class="menu-text">设置</text>
				<text class="menu-arrow">›</text>
			</view>
			<view class="menu-item" @click="navigateTo('records')">
				<text class="menu-icon">📊</text>
				<text class="menu-text">心情记录</text>
				<text class="menu-arrow">›</text>
			</view>
			<view class="menu-item" @click="navigateTo('favorites')">
				<text class="menu-icon">❤️</text>
				<text class="menu-text">收藏内容</text>
				<text class="menu-arrow">›</text>
			</view>
			<view class="menu-item" @click="navigateTo('feedback')">
				<text class="menu-icon">💬</text>
				<text class="menu-text">意见反馈</text>
				<text class="menu-arrow">›</text>
			</view>
			<view class="menu-item" @click="navigateTo('about')">
				<text class="menu-icon">ℹ️</text>
				<text class="menu-text">关于心屿</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>
		
		<view class="logout-section" v-if="isLogin">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isLogin: false,
				userInfo: {}
			}
		},
		onLoad() {
			this.checkLoginStatus()
		},
		methods: {
			checkLoginStatus() {
				this.isLogin = uni.getStorageSync('isLogin') || false
				this.userInfo = uni.getStorageSync('userInfo') || {}
			},
			navigateTo(page) {
				if (!this.isLogin) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				switch(page) {
					case 'settings':
						uni.showToast({
							title: '设置功能开发中',
							icon: 'none'
						})
						break
					case 'records':
						uni.showToast({
							title: '心情记录功能开发中',
							icon: 'none'
						})
						break
					case 'favorites':
						uni.showToast({
							title: '收藏功能开发中',
							icon: 'none'
						})
						break
					case 'feedback':
						uni.showToast({
							title: '意见反馈功能开发中',
							icon: 'none'
						})
						break
					case 'about':
						uni.showModal({
							title: '关于心屿',
							content: '心屿是一个专注于心理健康的微信小程序，旨在为用户提供温暖的心理支持和专业的心理知识。',
							showCancel: false,
							confirmText: '知道了'
						})
						break
				}
			},
			
			navigateToLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				})
			},
			
			navigateToRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
				})
			},
			
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('isLogin')
							uni.removeStorageSync('userInfo')
							this.isLogin = false
							this.userInfo = {}
							uni.showToast({
								title: '退出成功',
								icon: 'success'
							})
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
.mine-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 20rpx;
}

.user-info {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.avatar-section {
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 30rpx;
}

.avatar-text {
	font-size: 50rpx;
}

.user-details {
	flex: 1;
}

.username {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.user-desc {
	display: block;
	font-size: 26rpx;
	color: #666;
}

.stats {
	display: flex;
	justify-content: space-around;
}

.stat-item {
	text-align: center;
}

.stat-number {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #1890FF;
	margin-bottom: 10rpx;
}

.stat-label {
	display: block;
	font-size: 24rpx;
	color: #999;
}

.menu-list {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 2rpx solid #F5F5F5;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	font-size: 36rpx;
	margin-right: 20rpx;
	width: 60rpx;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.menu-arrow {
	font-size: 36rpx;
	color: #999;
}

.logout-section {
	margin-top: 40rpx;
	padding: 0 30rpx;
}

.logout-btn {
	width: 100%;
	height: 80rpx;
	background: #FF4D4F;
	color: white;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
}

/* 未登录状态样式 */
.login-prompt {
	background: #fff;
	border-radius: 20rpx;
	padding: 60rpx 40rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
	text-align: center;
}

.prompt-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.prompt-icon {
	font-size: 80rpx;
	margin-bottom: 30rpx;
}

.prompt-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.prompt-desc {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 50rpx;
	line-height: 1.5;
}

.login-buttons {
	display: flex;
	gap: 30rpx;
	width: 100%;
}

.login-buttons button {
	flex: 1;
	height: 80rpx;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
}

.login-buttons .login-btn {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
}

.login-buttons .register-btn {
	background: #fff;
	color: #1890FF;
	border: 2rpx solid #1890FF;
}

/* 未登录状态样式 */
.login-prompt {
	background: #fff;
	border-radius: 20rpx;
	padding: 60rpx 40rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
	text-align: center;
}

.prompt-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.prompt-icon {
	font-size: 80rpx;
	margin-bottom: 30rpx;
}

.prompt-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.prompt-desc {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 50rpx;
	line-height: 1.5;
}

.login-buttons {
	display: flex;
	gap: 30rpx;
	width: 100%;
}

.login-buttons button {
	flex: 1;
	height: 80rpx;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
}

.login-buttons .login-btn {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
}

.login-buttons .register-btn {
	background: #fff;
	color: #1890FF;
	border: 2rpx solid #1890FF;
}
</style>