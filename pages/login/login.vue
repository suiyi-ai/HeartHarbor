<template>
	<view class="login-page">
		<view class="login-header">
			<text class="login-title">欢迎回来</text>
			<text class="login-subtitle">登录心屿账户</text>
		</view>
		
		<view class="login-form">
			<view class="input-group">
				<text class="input-label">邮箱地址</text>
				<input class="input-field" placeholder="请输入邮箱地址" type="email" v-model="email" />
			</view>
			
			<view class="input-group">
				<text class="input-label">密码</text>
				<input class="input-field" password placeholder="请输入密码" v-model="password" />
			</view>
			
			<view class="forgot-password">
				<text @click="navigateToForgotPassword">忘记密码？</text>
			</view>
			
			<button class="login-submit-btn" @click="handleLogin">登录</button>
		</view>
		
		<view class="login-footer">
			<text>还没有账户？</text>
			<text class="register-link" @click="navigateToRegister">立即注册</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				email: '',
				password: ''
			}
		},
		methods: {
			handleLogin() {
				// 表单验证
				if (!this.email) {
					uni.showToast({
						title: '请输入邮箱地址',
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
				
				// 邮箱格式验证
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				if (!emailRegex.test(this.email)) {
					uni.showToast({
						title: '邮箱格式不正确',
						icon: 'none'
					})
					return
				}
				
				// 模拟登录成功（后续会替换为Supabase集成）
				uni.showToast({
					title: '登录功能开发中',
					icon: 'none'
				})
				
				// 登录成功后，调用 mine.vue 的回调
				// 获取页面栈中的 mine.vue 页面实例
				const pages = getCurrentPages()
				const prevPage = pages[pages.length - 2]
				if (prevPage && prevPage.route === 'pages/mine/mine') {
					prevPage.$vm.handleLoginSuccess && prevPage.$vm.handleLoginSuccess()
				}
				
				// 延迟返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			},
			navigateToForgotPassword() {
				uni.showToast({
					title: '忘记密码功能开发中',
					icon: 'none'
				})
			},
			navigateToRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
				})
			}
		}
	}
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 40rpx;
}

.login-header {
	text-align: center;
	margin-bottom: 60rpx;
	padding-top: 60rpx;
}

.login-title {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.login-subtitle {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.login-form {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.input-group {
	margin-bottom: 40rpx;
}

.input-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
	font-weight: 500;
}

.input-field {
	width: 100%;
	height: 80rpx;
	background: #F5F9FF;
	border-radius: 40rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
	border: 2rpx solid #E6F3FF;
	box-sizing: border-box;
}

.input-field:focus {
	border-color: #1890FF;
}

.forgot-password {
	text-align: right;
	margin-bottom: 40rpx;
}

.forgot-password text {
	font-size: 26rpx;
	color: #1890FF;
}

.login-submit-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	margin-bottom: 40rpx;
}



.login-footer {
	text-align: center;
	margin-top: 40rpx;
}

.login-footer text {
	font-size: 26rpx;
	color: #666;
}

.register-link {
	color: #1890FF;
	margin-left: 10rpx;
}
</style>