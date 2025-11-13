<template>
	<view class="login-page">
		<view class="header">
			<text class="title">欢迎回来</text>
			<text class="subtitle">登录心屿，开启心理关怀之旅</text>
		</view>
		
		<view class="form-container">
			<view class="input-group">
				<view class="input-item">
					<text class="label">用户名/邮箱</text>
					<input 
						v-model="identifier" 
						class="input" 
						placeholder="请输入用户名或邮箱"
					/>
				</view>
				<view class="input-item">
					<text class="label">密码</text>
					<input 
						v-model="password" 
						class="input" 
						placeholder="请输入密码"
						password
					/>
				</view>
			</view>
			
			<view class="forgot-password">
				<text class="forgot-text" @click="navigateToForgot">忘记密码？</text>
			</view>
			
			<button class="login-btn" @click="handleLogin">登录</button>
			
			<view class="divider">
				<text class="divider-text">或使用以下方式登录</text>
			</view>
			
			<view class="social-login">
				<view class="social-item" @click="handleSocialLogin('wechat')">
					<text class="social-icon">💬</text>
					<text class="social-text">微信登录</text>
				</view>
			</view>
			
			<view class="register-link">
				<text class="register-text">还没有账号？</text>
				<text class="register-link-text" @click="navigateToRegister">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script>
	import authService from '@/utils/auth.js'
	
	export default {
		data() {
			return {
				identifier: '',
				password: ''
			}
		},
		methods: {
			async handleLogin() {
				if (!this.identifier) {
					uni.showToast({
						title: '请输入用户名或邮箱',
						icon: 'none'
					})
					return
				}
				
				if (!this.password) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					})
					return
				}
				
				uni.showLoading({
					title: '登录中...'
				})
				
				try {
					const result = await authService.login(this.identifier, this.password)
					uni.hideLoading()
					
					if (result.success) {
						uni.showToast({
							title: '登录成功',
							icon: 'success',
							duration: 1000
						})
						
						// 登录成功后，清除之前的匿名用户对话缓存
						// 这样用户登录后会看到自己的对话，而不是匿名用户的对话
						
						// 等待 Toast 显示后再跳转
						// 使用 reLaunch 确保能正确跳转到 tabBar 页面
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/mine/mine',
								success: () => {
									console.log('导航成功：跳转到我的页面')
								},
								fail: (err) => {
									console.error('导航失败:', err)
									// 如果 reLaunch 失败，尝试使用 switchTab
									uni.switchTab({
										url: '/pages/mine/mine',
										success: () => {
											console.log('使用 switchTab 导航成功')
										},
										fail: (err2) => {
											console.error('switchTab 也失败:', err2)
											uni.showToast({
												title: '跳转失败，请手动切换到"我的"页面',
												icon: 'none',
												duration: 2000
											})
										}
									})
								}
							})
						}, 1200)
					} else {
						uni.showToast({
							title: result.message || '登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({
						title: error.message || '登录失败，请重试',
						icon: 'none'
					})
				}
			},
			
			async handleSocialLogin(type) {
				if (type !== 'wechat') {
					uni.showToast({
						title: '暂不支持该登录方式',
						icon: 'none'
					})
					return
				}

				uni.showLoading({
					title: '微信登录中...'
				})

				try {
					const result = await authService.loginWithWeChat()
					uni.hideLoading()

					if (result.success) {
						uni.showToast({
							title: '登录成功',
							icon: 'success',
							duration: 1000
						})

						// 登录成功后跳转到"我的"页面
						// 使用 reLaunch 确保能正确跳转到 tabBar 页面
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/mine/mine',
								success: () => {
									console.log('导航成功：跳转到我的页面')
								},
								fail: (err) => {
									console.error('导航失败:', err)
									// 如果 reLaunch 失败，尝试使用 switchTab
									uni.switchTab({
										url: '/pages/mine/mine',
										success: () => {
											console.log('使用 switchTab 导航成功')
										},
										fail: (err2) => {
											console.error('switchTab 也失败:', err2)
											uni.showToast({
												title: '跳转失败，请手动切换到"我的"页面',
												icon: 'none',
												duration: 2000
											})
										}
									})
								}
							})
						}, 1200)
					} else {
						uni.showToast({
							title: result.message || '登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					
					// 处理特定的错误情况
					let errorMessage = '微信登录失败，请重试'
					if (error.message) {
						if (error.message.includes('getUserProfile')) {
							errorMessage = '需要授权才能使用微信登录'
						} else if (error.message.includes('login')) {
							errorMessage = '获取微信登录凭证失败'
						} else {
							errorMessage = error.message
						}
					}

					uni.showToast({
						title: errorMessage,
						icon: 'none',
						duration: 2000
					})
				}
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
			
			navigateToForgot() {
				uni.showToast({
					title: '忘记密码功能开发中',
					icon: 'none'
				})
			}
		}
	}
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 40rpx 30rpx;
}

.header {
	text-align: center;
	margin-bottom: 80rpx;
	margin-top: 60rpx;
}

.title {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.subtitle {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.form-container {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.input-group {
	margin-bottom: 40rpx;
}

.input-item {
	margin-bottom: 40rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
	font-weight: 500;
}

.input {
	width: 100%;
	height: 80rpx;
	border: 2rpx solid #E8E8E8;
	border-radius: 20rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
	background: #F8F8F8;
	box-sizing: border-box;
}

.input:focus {
	border-color: #1890FF;
	background: #fff;
}

.forgot-password {
	text-align: right;
	margin-bottom: 60rpx;
}

.forgot-text {
	font-size: 26rpx;
	color: #1890FF;
}

.login-btn {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
	margin-bottom: 40rpx;
}

.divider {
	text-align: center;
	margin: 40rpx 0;
	position: relative;
}

.divider::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 50%;
	height: 2rpx;
	background: #E8E8E8;
}

.divider-text {
	background: #fff;
	padding: 0 30rpx;
	font-size: 24rpx;
	color: #999;
	position: relative;
	z-index: 1;
}

.social-login {
	display: flex;
	justify-content: center;
	gap: 60rpx;
	margin-bottom: 60rpx;
}

.social-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.social-icon {
	font-size: 60rpx;
	margin-bottom: 10rpx;
}

.social-text {
	font-size: 24rpx;
	color: #666;
}

.register-link {
	text-align: center;
}

.register-text {
	font-size: 26rpx;
	color: #666;
	margin-right: 10rpx;
}

.register-link-text {
	font-size: 26rpx;
	color: #1890FF;
	font-weight: 500;
}
</style>