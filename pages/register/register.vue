<template>
	<view class="register-page">
		<view class="register-header">
			<text class="register-title">创建账户</text>
			<text class="register-subtitle">加入心屿社区</text>
		</view>
		
		<view class="register-form">
			<view class="input-group">
				<text class="input-label">邮箱地址</text>
				<input class="input-field" placeholder="请输入邮箱地址" type="email" v-model="email" />
			</view>
			
			<view class="input-group">
				<text class="input-label">设置密码</text>
				<input class="input-field" password placeholder="请设置登录密码" v-model="password" />
			</view>
			
			<view class="input-group">
				<text class="input-label">确认密码</text>
				<input class="input-field" password placeholder="请再次输入密码" v-model="confirmPassword" />
			</view>
			
			<view class="agreement">
				<view class="agreement-checkbox">
					<checkbox class="checkbox" :checked="agreementChecked" @click="toggleAgreement" />
				</view>
				<text class="agreement-text">我已阅读并同意</text>
				<text class="agreement-link" @click="navigateToAgreement">《用户协议》</text>
				<text class="agreement-text">和</text>
				<text class="agreement-link" @click="navigateToPrivacy">《隐私政策》</text>
			</view>
			
			<button class="register-submit-btn" @click="handleRegister">注册</button>
		</view>
		
		<view class="register-footer">
			<text>已有账户？</text>
			<text class="login-link" @click="navigateToLogin">立即登录</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				email: '',
				password: '',
				confirmPassword: '',
				agreementChecked: false
			}
		},
		methods: {
			toggleAgreement() {
				this.agreementChecked = !this.agreementChecked
			},
			handleRegister() {
				// 表单验证
				if (!this.email) {
					uni.showToast({
						title: '请输入邮箱地址',
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
				
				if (!this.password) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					})
					return
				}
				
				if (this.password.length < 6) {
					uni.showToast({
						title: '密码长度至少6位',
						icon: 'none'
					})
					return
				}
				
				if (this.password !== this.confirmPassword) {
					uni.showToast({
						title: '两次密码输入不一致',
						icon: 'none'
					})
					return
				}
				
				if (!this.agreementChecked) {
					uni.showToast({
						title: '请先阅读并同意协议',
						icon: 'none'
					})
					return
				}
				
				// 模拟注册成功（后续会替换为Supabase集成）
				uni.showToast({
					title: '注册成功，已自动登录',
					icon: 'success'
				})
				
				// 注册成功后，自动登录
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
			navigateToAgreement() {
				uni.showToast({
					title: '用户协议查看功能开发中',
					icon: 'none'
				})
			},
			navigateToPrivacy() {
				uni.showToast({
					title: '隐私政策查看功能开发中',
					icon: 'none'
				})
			},
			navigateToLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				})
			}
		}
	}
</script>

<style scoped>
.register-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 40rpx;
}

.register-header {
	text-align: center;
	margin-bottom: 60rpx;
	padding-top: 60rpx;
}

.register-title {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.register-subtitle {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.register-form {
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



.agreement {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 40rpx;
	padding: 20rpx;
	background: #F5F9FF;
	border-radius: 10rpx;
}

.agreement-checkbox {
	margin-right: 10rpx;
}

.checkbox {
	transform: scale(0.8);
}

.agreement-text {
	font-size: 24rpx;
	color: #666;
	margin-right: 5rpx;
}

.agreement-link {
	font-size: 24rpx;
	color: #1890FF;
	margin-right: 5rpx;
}

.register-submit-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
}

.register-footer {
	text-align: center;
	margin-top: 40rpx;
}

.register-footer text {
	font-size: 26rpx;
	color: #666;
}

.login-link {
	color: #1890FF;
	margin-left: 10rpx;
}
</style>