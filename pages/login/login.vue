<template>
	<view class="login-page">
		<view class="header">
			<text class="title">欢迎回来</text>
			<text class="subtitle">登录心屿，开启心理关怀之旅</text>
		</view>
		
		<view class="form-container">
			<view class="input-group">
				<view class="input-item">
					<text class="label">手机号</text>
					<input 
						v-model="phone" 
						class="input" 
						placeholder="请输入手机号"
						type="number"
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
	export default {
		data() {
			return {
				phone: '',
				password: ''
			}
		},
		methods: {
			handleLogin() {
				if (!this.phone) {
					uni.showToast({
						title: '请输入手机号',
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
				
				// 模拟登录成功
				uni.showLoading({
					title: '登录中...'
				})
				
				setTimeout(() => {
					uni.hideLoading()
					// 存储登录状态
					uni.setStorageSync('isLogin', true)
					uni.setStorageSync('userInfo', {
						phone: this.phone,
						name: '心屿用户'
					})
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 返回上一页或跳转到首页
					uni.navigateBack()
				}, 1500)
			},
			
			handleSocialLogin(type) {
				uni.showToast({
					title: `${type === 'wechat' ? '微信' : 'QQ'}登录功能开发中`,
					icon: 'none'
				})
			},
			
			navigateToRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
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