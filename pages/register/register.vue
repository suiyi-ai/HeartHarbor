<template>
	<view class="register-page">
		<view class="header">
			<text class="title">创建账号</text>
			<text class="subtitle">加入心屿，开启心理关怀之旅</text>
		</view>
		
		<view class="form-container">
			<view class="input-group">
				<view class="input-item">
					<text class="label">用户名</text>
					<input 
						v-model="username" 
						class="input" 
						placeholder="请输入用户名（3-20位字母、数字或下划线）"
					/>
				</view>
				<view class="input-item">
					<text class="label">邮箱</text>
					<input 
						v-model="email" 
						class="input" 
						placeholder="请输入邮箱地址"
					/>
				</view>
				<view class="input-item">
					<text class="label">密码</text>
					<input 
						v-model="password" 
						class="input" 
						placeholder="请输入密码（至少6位）"
						password
					/>
				</view>
				<view class="input-item">
					<text class="label">确认密码</text>
					<input 
						v-model="confirmPassword" 
						class="input" 
						placeholder="请再次输入密码"
						password
					/>
				</view>
				<view class="input-item">
					<text class="label">昵称</text>
					<input 
						v-model="nickname" 
						class="input" 
						placeholder="请输入昵称（可选）"
					/>
				</view>
			</view>
			
			<view class="agreement">
				<view class="checkbox-group">
					<checkbox-group @change="handleAgreementChange">
						<label class="checkbox-label">
							<checkbox :checked="agreed" color="#1890FF" />
							<text class="agreement-text">我已阅读并同意</text>
							<text class="agreement-link" @click="navigateToAgreement">《用户协议》</text>
						</label>
					</checkbox-group>
				</view>
			</view>
			
			<button class="register-btn" @click="handleRegister" :disabled="!agreed">注册</button>
			
			<view class="login-link">
				<text class="login-text">已有账号？</text>
				<text class="login-link-text" @click="navigateToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import authService from '@/utils/auth.js'
	
	export default {
		data() {
			return {
				username: '',
				email: '',
				password: '',
				confirmPassword: '',
				nickname: '',
				agreed: false
			}
		},
		methods: {
			validateForm() {
				if (!this.username) {
					uni.showToast({
						title: '请输入用户名',
						icon: 'none'
					})
					return false
				}
				
				if (!/^[a-zA-Z0-9_]{3,20}$/.test(this.username)) {
					uni.showToast({
						title: '用户名格式不正确（3-20位字母、数字或下划线）',
						icon: 'none'
					})
					return false
				}
				
				if (!this.email) {
					uni.showToast({
						title: '请输入邮箱地址',
						icon: 'none'
					})
					return false
				}
				
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
					uni.showToast({
						title: '邮箱格式不正确',
						icon: 'none'
					})
					return false
				}
				
				if (!this.password) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					})
					return false
				}
				
				if (this.password.length < 6) {
					uni.showToast({
						title: '密码至少需要6位',
						icon: 'none'
					})
					return false
				}
				
				if (this.password !== this.confirmPassword) {
					uni.showToast({
						title: '两次输入的密码不一致',
						icon: 'none'
					})
					return false
				}
				
				if (!this.agreed) {
					uni.showToast({
						title: '请同意用户协议',
						icon: 'none'
					})
					return false
				}
				
				return true
			},
			
			async handleRegister() {
				if (!this.validateForm()) {
					return
				}
				
				uni.showLoading({
					title: '注册中...'
				})
				
			try {
				const result = await authService.register({
					username: this.username,
					email: this.email,
					password: this.password,
					confirmPassword: this.confirmPassword,
					nickname: this.nickname || this.username
				})
					
					uni.hideLoading()
					
					if (result.success) {
						uni.showToast({
							title: '注册成功',
							icon: 'success',
							duration: 1000
						})
						
						// 注册成功后，用户已经自动登录（authService.register 已经保存了会话）
						// 跳转到"我的"页面
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
							title: result.message || '注册失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({
						title: error.message || '注册失败，请重试',
						icon: 'none'
					})
				}
			},
			
			handleAgreementChange(e) {
				this.agreed = e.detail.value.length > 0
			},
			
			navigateToAgreement() {
				uni.showToast({
					title: '用户协议查看功能开发中',
					icon: 'none'
				})
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
			}
		}
	}
</script>

<style scoped>
.register-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 40rpx 30rpx;
}

.header {
	text-align: center;
	margin-bottom: 60rpx;
	margin-top: 40rpx;
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

.agreement {
	margin-bottom: 60rpx;
}

.checkbox-group {
	display: flex;
	align-items: center;
	justify-content: center;
}

.checkbox-label {
	display: flex;
	align-items: center;
	font-size: 26rpx;
}

.agreement-text {
	color: #666;
}

.agreement-link {
	color: #1890FF;
}

.register-btn {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
	margin-bottom: 40rpx;
}

.register-btn:disabled {
	background: #ccc;
	color: #999;
}

.login-link {
	text-align: center;
}

.login-text {
	font-size: 26rpx;
	color: #666;
	margin-right: 10rpx;
}

.login-link-text {
	font-size: 26rpx;
	color: #1890FF;
	font-weight: 500;
}
</style>