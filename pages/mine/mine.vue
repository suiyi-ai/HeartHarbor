<template>
	<view class="mine-page">
		<view class="user-info" v-if="isLogin">
			<view class="avatar-section" @click="editProfile">
				<view class="avatar">
					<image v-if="userInfo.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-image" />
					<text v-else class="avatar-text">{{ userInfo.avatarText || '👤' }}</text>
				</view>
				<view class="user-details">
					<text class="username">{{ userInfo.name || '心屿用户' }}</text>
					<text class="user-desc">{{ userInfo.bio || '专注于心理健康成长' }}</text>
					<text class="user-email" v-if="userInfo.email">{{ userInfo.email }}</text>
				</view>
				<text class="edit-icon">✏️</text>
			</view>
			
			<view class="stats">
				<view class="stat-item" @click="navigateToMyTreehole">
					<text class="stat-number">{{ stats.treeholeCount || 0 }}</text>
					<text class="stat-label">树洞倾诉</text>
				</view>
				<view class="stat-item" @click="navigateToFavoritesPage">
					<text class="stat-number">{{ stats.favoriteCount || 0 }}</text>
					<text class="stat-label">收藏文章</text>
				</view>
				<view class="stat-item" @click="navigateToMoodRecords">
					<text class="stat-number">{{ stats.moodRecordCount || 0 }}</text>
					<text class="stat-label">心情记录</text>
				</view>
				<view class="stat-item" @click="navigateToMyConversations">
					<text class="stat-number">{{ stats.conversationCount || 0 }}</text>
					<text class="stat-label">AI对话</text>
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
			<view class="menu-group">
				<view class="menu-group-title">我的内容</view>
				<view class="menu-item" @click="navigateToMyConversations">
					<text class="menu-icon">💬</text>
					<text class="menu-text">我的对话</text>
					<text class="menu-badge" v-if="stats.conversationCount > 0">{{ stats.conversationCount }}</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="navigateToMyTreehole">
					<text class="menu-icon">🌳</text>
					<text class="menu-text">我的树洞</text>
					<text class="menu-badge" v-if="stats.treeholeCount > 0">{{ stats.treeholeCount }}</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="navigateToFavoritesPage">
					<text class="menu-icon">❤️</text>
					<text class="menu-text">我的收藏</text>
					<text class="menu-badge" v-if="stats.favoriteCount > 0">{{ stats.favoriteCount }}</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="navigateToMoodRecords">
					<text class="menu-icon">📊</text>
					<text class="menu-text">心情记录</text>
					<text class="menu-badge" v-if="stats.moodRecordCount > 0">{{ stats.moodRecordCount }}</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="navigateToReadHistory">
					<text class="menu-icon">📖</text>
					<text class="menu-text">阅读历史</text>
					<text class="menu-badge" v-if="stats.readHistoryCount > 0">{{ stats.readHistoryCount }}</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
			
			<view class="menu-group">
				<view class="menu-group-title">其他</view>
				<view class="menu-item" @click="navigateTo('settings')">
					<text class="menu-icon">⚙️</text>
					<text class="menu-text">设置</text>
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
		</view>
		
		<view class="logout-section" v-if="isLogin">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
	import authService from '@/utils/auth.js'
	import conversationService from '@/utils/supabase.js'
	
	export default {
		data() {
			return {
				isLogin: false,
				userInfo: {},
				stats: {
					treeholeCount: 0,
					favoriteCount: 0,
					readHistoryCount: 0,
					conversationCount: 0,
					moodRecordCount: 0
				},
				isLoadingStats: false
			}
		},
		onLoad() {
			this.checkLoginStatus()
		},
		onShow() {
			// 页面显示时重新检查登录状态（用户可能在其他页面登录/退出）
			this.checkLoginStatus()
			// 如果已登录，加载统计数据
			if (this.isLogin) {
				this.loadUserStats()
			}
		},
		methods: {
			checkLoginStatus() {
				// 优先检查 authService 的登录状态
				try {
					const currentUserStr = uni.getStorageSync('current_user')
					const authToken = uni.getStorageSync('auth_token')
					
					if (currentUserStr && authToken) {
						try {
							const currentUser = JSON.parse(currentUserStr)
							this.isLogin = true
							this.userInfo = {
								name: currentUser.username || currentUser.nickname || '心屿用户',
								email: currentUser.email || '',
								avatar: currentUser.avatar_url || '',
								bio: currentUser.bio || '',
								avatarText: this.getAvatarText(currentUser.username || currentUser.nickname || '心屿用户')
							}
							return
						} catch (e) {
							console.error('解析用户信息失败:', e)
						}
					}
				} catch (error) {
					console.error('检查登录状态失败:', error)
				}
				
				// 兼容旧版本的登录状态检查
				this.isLogin = uni.getStorageSync('isLogin') || false
				const oldUserInfo = uni.getStorageSync('userInfo') || {}
				this.userInfo = {
					name: oldUserInfo.name || '心屿用户',
					email: oldUserInfo.email || '',
					avatar: oldUserInfo.avatar || '',
					bio: oldUserInfo.bio || '',
					avatarText: this.getAvatarText(oldUserInfo.name || '心屿用户')
				}
			},
			
			// 获取头像文字（取用户名首字符）
			getAvatarText(name) {
				if (!name) return '👤'
				// 如果是中文，取第一个字符
				if (/[\u4e00-\u9fa5]/.test(name)) {
					return name.charAt(0)
				}
				// 如果是英文，取首字母大写
				return name.charAt(0).toUpperCase()
			},
			
			// 加载用户统计数据
			async loadUserStats() {
				if (this.isLoadingStats) return
				
				this.isLoadingStats = true
				try {
					const stats = await conversationService.supabaseService.getUserStats()
					this.stats = stats
				} catch (error) {
					console.error('加载统计数据失败:', error)
					// 失败时使用默认值
					this.stats = {
						treeholeCount: 0,
						favoriteCount: 0,
						readHistoryCount: 0,
						conversationCount: 0,
						moodRecordCount: 0
					}
				} finally {
					this.isLoadingStats = false
				}
			},
			
			// 编辑资料
			editProfile() {
				uni.showToast({
					title: '编辑资料功能开发中',
					icon: 'none'
				})
			},
			
			// 跳转到我的对话
			navigateToMyConversations() {
				uni.switchTab({
					url: '/pages/ai/ai',
					success: () => {
						console.log('导航成功：跳转到AI对话页面')
					},
					fail: (err) => {
						console.error('导航失败:', err)
						uni.showToast({
							title: '页面跳转失败，请重试',
							icon: 'none'
						})
					}
				})
			},
			
			// 跳转到我的树洞
			navigateToMyTreehole() {
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
			},
			
			// 跳转到阅读历史
			navigateToReadHistory() {
				uni.showToast({
					title: '阅读历史功能开发中',
					icon: 'none'
				})
			},
			
			// 跳转到心情记录
			navigateToMoodRecords() {
				if (!this.isLogin) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				console.log('点击心情记录，准备跳转到 /pages/mood/mood')
				uni.navigateTo({
					url: '/pages/mood/mood',
					success: () => {
						console.log('✅ 导航成功：跳转到心情记录页面')
					},
					fail: (err) => {
						console.error('❌ navigateTo 失败:', err)
						// 如果 navigateTo 失败，尝试使用 reLaunch
						uni.reLaunch({
							url: '/pages/mood/mood',
							success: () => {
								console.log('✅ 使用 reLaunch 导航成功')
							},
							fail: (err2) => {
								console.error('❌ reLaunch 也失败:', err2)
								uni.showToast({
									title: '页面跳转失败：' + (err2.errMsg || '未知错误'),
									icon: 'none',
									duration: 3000
								})
							}
						})
					}
				})
			},
			
			// 跳转到收藏内容
			navigateToFavoritesPage() {
				if (!this.isLogin) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				console.log('点击我的收藏，准备跳转到 /pages/favorites/favorites')
				uni.navigateTo({
					url: '/pages/favorites/favorites',
					success: () => {
						console.log('✅ 导航成功：跳转到收藏页面')
					},
					fail: (err) => {
						console.error('❌ navigateTo 失败:', err)
						// 如果 navigateTo 失败，尝试使用 reLaunch
						uni.reLaunch({
							url: '/pages/favorites/favorites',
							success: () => {
								console.log('✅ 使用 reLaunch 导航成功')
							},
							fail: (err2) => {
								console.error('❌ reLaunch 也失败:', err2)
								uni.showToast({
									title: '页面跳转失败：' + (err2.errMsg || '未知错误'),
									icon: 'none',
									duration: 3000
								})
							}
						})
					}
				})
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
						this.navigateToMoodRecords()
						break
					case 'favorites':
						this.navigateToFavoritesPage()
						break
					case 'feedback':
						uni.showModal({
							title: '意见反馈',
							editable: true,
							placeholderText: '请输入您的意见或建议...',
							success: (res) => {
								if (res.confirm && res.content) {
									// 这里可以发送反馈到服务器
									uni.showToast({
										title: '感谢您的反馈',
										icon: 'success'
									})
								}
							}
						})
						break
					case 'about':
						uni.showModal({
							title: '关于心屿',
							content: '心屿是一个专注于心理健康的微信小程序，旨在为用户提供温暖的心理支持和专业的心理知识。\n\n版本：1.0.0\n\n我们致力于帮助用户：\n• 管理情绪和压力\n• 学习心理健康知识\n• 获得情感支持和陪伴\n• 记录成长历程',
							showCancel: false,
							confirmText: '知道了'
						})
						break
				}
			},
			
			navigateToLogin() {
				uni.navigateTo({
					url: '/pages/login/login',
					success: () => {
						console.log('导航成功：跳转到登录页面')
					},
					fail: (err) => {
						console.error('导航失败:', err)
						uni.showToast({
							title: '页面跳转失败，请重试',
							icon: 'none'
						})
					}
				})
			},
			
			navigateToRegister() {
				uni.navigateTo({
					url: '/pages/register/register',
					success: () => {
						console.log('导航成功：跳转到注册页面')
					},
					fail: (err) => {
						console.error('导航失败:', err)
						uni.showToast({
							title: '页面跳转失败，请重试',
							icon: 'none'
						})
					}
				})
			},
			
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							// 使用authService退出登录，确保清除所有会话信息
							try {
								authService.logout()
							} catch (error) {
								console.error('退出登录失败:', error)
							}
							
							// 清除本地存储的用户信息
							uni.removeStorageSync('isLogin')
							uni.removeStorageSync('userInfo')
							uni.removeStorageSync('current_user')
							uni.removeStorageSync('auth_token')
							
							this.isLogin = false
							this.userInfo = {}
							
							uni.showToast({
								title: '退出成功',
								icon: 'success'
							})
							
							// 退出后，跳转到首页
							setTimeout(() => {
								uni.switchTab({
									url: '/pages/index/index',
									success: () => {
										console.log('导航成功：跳转到首页')
									},
									fail: (err) => {
										console.error('导航失败:', err)
										// 如果 switchTab 失败，使用 reLaunch
										uni.reLaunch({
											url: '/pages/index/index'
										})
									}
								})
							}, 1200)
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
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.user-info {
	background: linear-gradient(135deg, #B3D9FF 0%, #E6F3FF 100%);
	border-radius: 24rpx;
	padding: 40rpx 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.15);
}

.avatar-section {
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
	position: relative;
}

.avatar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 30rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

.avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.avatar-text {
	font-size: 56rpx;
	color: #4A90E2;
	font-weight: bold;
}

.user-details {
	flex: 1;
}

.username {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #2C5F8D;
	margin-bottom: 12rpx;
}

.user-desc {
	display: block;
	font-size: 26rpx;
	color: #5A7FA3;
	margin-bottom: 8rpx;
}

.user-email {
	display: block;
	font-size: 24rpx;
	color: #7A9BC4;
}

.edit-icon {
	font-size: 32rpx;
	color: #4A90E2;
	padding: 10rpx;
}

.stats {
	display: flex;
	justify-content: space-around;
	background: rgba(255, 255, 255, 0.6);
	border-radius: 16rpx;
	padding: 30rpx 20rpx;
}

.stat-item {
	text-align: center;
	flex: 1;
	position: relative;
}

.stat-item::after {
	content: '';
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 2rpx;
	height: 60rpx;
	background: rgba(74, 144, 226, 0.2);
}

.stat-item:last-child::after {
	display: none;
}

.stat-number {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #4A90E2;
	margin-bottom: 12rpx;
	transition: transform 0.2s;
}

.stat-item:active .stat-number {
	transform: scale(1.1);
}

.stat-label {
	display: block;
	font-size: 24rpx;
	color: #7A9BC4;
}

.menu-list {
	margin-bottom: 30rpx;
}

.menu-group {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
	margin-bottom: 30rpx;
}

.menu-group-title {
	padding: 24rpx 30rpx;
	font-size: 26rpx;
	color: #7A9BC4;
	font-weight: 500;
	background: linear-gradient(135deg, #F0F8FF 0%, #FFFFFF 100%);
	border-bottom: 2rpx solid #E6F3FF;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 32rpx 30rpx;
	border-bottom: 2rpx solid #F5F9FF;
	position: relative;
	transition: background-color 0.2s;
}

.menu-item:active {
	background-color: #F0F8FF;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	font-size: 40rpx;
	margin-right: 24rpx;
	width: 60rpx;
	text-align: center;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #2C5F8D;
	font-weight: 500;
}

.menu-badge {
	background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9F 100%);
	color: white;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	margin-right: 16rpx;
	min-width: 32rpx;
	text-align: center;
	line-height: 1.4;
}

.menu-arrow {
	font-size: 32rpx;
	color: #B0C4DE;
}

.logout-section {
	margin-top: 40rpx;
	padding: 0 30rpx;
}

.logout-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #FF6B9D 0%, #FF8E9F 100%);
	color: white;
	border-radius: 44rpx;
	font-size: 32rpx;
	border: none;
	box-shadow: 0 4rpx 16rpx rgba(255, 107, 157, 0.3);
	transition: transform 0.2s;
}

.logout-btn:active {
	transform: scale(0.98);
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