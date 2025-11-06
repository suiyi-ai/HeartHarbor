<template>
	<view class="register-page">
		<view class="header">
			<text class="title">加入心屿</text>
			<text class="subtitle">开启您的心理关怀之旅</text>
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
					<text class="label">验证码</text>
					<view class="code-input-group">
						<input 
							v-model="code" 
							class="code-input" 
							placeholder="请输入验证码"
							type="number"
						/>
						<button 
							class="send-code-btn" 
							:disabled="!canSendCode"
							@click="sendCode"
						>
							{{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
						</button>
					</view>
				</view>
				<view class="input-item">
					<text class="label">设置密码</text>
					<input 
						v-model="password" 
						class="input" 
						placeholder="请设置密码"
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
			</view>
			
			<view class="agreement">
				<label class="agreement-checkbox">
					<checkbox 
						:checked="agreed" 
						@change="agreed = $event.detail.value.length > 0" 
						color="#1890FF"
					/>
					<text class="agreement-text">
						我已阅读并同意
						<text class="agreement-link" @click="showAgreement">《用户协议》</text>
						和
						<text class="agreement-link" @click="showPrivacy">《隐私政策》</text>
					</text>
				</label>
			</view>
			
			<button class="register-btn" :disabled="!agreed" @click="handleRegister">注册</button>
			
			<view class="login-link">
				<text class="login-text">已有账号？</text>
				<text class="login-link-text" @click="navigateToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				phone: '',
				code: '',
				password: '',
				confirmPassword: '',
				agreed: false,
				countdown: 0,
				canSendCode: true
			}
		},
		methods: {
			sendCode() {
				if (!this.phone) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}
				
				if (!/^1[3-9]\d{9}$/.test(this.phone)) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					})
					return
				}
				
				// 模拟发送验证码
				this.countdown = 60
				this.canSendCode = false
				
				const timer = setInterval(() => {
					this.countdown--
					if (this.countdown <= 0) {
						this.canSendCode = true
						clearInterval(timer)
					}
				}, 1000)
				
				uni.showToast({
					title: '验证码已发送',
					icon: 'success'
				})
			},
			
			handleRegister() {
				if (!this.phone) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}
				
				if (!this.code) {
					uni.showToast({
						title: '请输入验证码',
						icon: 'none'
					})
					return
				}
				
				if (!this.password) {
					uni.showToast({
						title: '请设置密码',
						icon: 'none'
					})
					return
				}
				
				if (this.password.length < 6) {
					uni.showToast({
						title: '密码长度不能少于6位',
						icon: 'none'
					})
					return
				}
				
				if (this.password !== this.confirmPassword) {
					uni.showToast({
						title: '两次输入的密码不一致',
						icon: 'none'
					})
					return
				}
				
				// 模拟注册成功
				uni.showLoading({
					title: '注册中...'
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
						title: '注册成功',
						icon: 'success'
					})
					
					// 返回上一页或跳转到首页
					uni.navigateBack()
				}, 1500)
			},
			
			showAgreement() {
				uni.showModal({
					title: '用户协议',
					content: '心屿用户协议内容...',
					showCancel: false,
					confirmText: '知道了'
				})
			},
			
			showPrivacy() {
				uni.showModal({
					title: '隐私政策',
					content: '心屿隐私政策内容...',
					showCancel: false,
					confirmText: '知道了'
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

.code-input-group {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.code-input {
	flex: 1;
	height: 80rpx;
	border: 2rpx solid #E8E8E8;
	border-radius: 20rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
	background: #F8F8F8;
	box-sizing: border-box;
}

.send-code-btn {
	width: 200rpx;
	height: 80rpx;
	background: #1890FF;
	color: white;
	border-radius: 20rpx;
	font-size: 24rpx;
	border: none;
	white-space: nowrap;
}

.send-code-btn:disabled {
	background: #ccc;
}

.agreement {
	margin-bottom: 60rpx;
}

.agreement-checkbox {
	display: flex;
	align-items: flex-start;
	font-size: 24rpx;
	color: #666;
	line-height: 1.5;
}

.agreement-text {
	flex: 1;
	margin-left: 10rpx;
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