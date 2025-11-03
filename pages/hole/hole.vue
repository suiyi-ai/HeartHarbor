<template>
	<view class="hole-page">
		<view class="header">
			<text class="title">树洞</text>
			<text class="subtitle">在这里倾诉你的心声</text>
		</view>
		
		<view class="content">
			<view class="input-area">
				<textarea 
					class="textarea" 
					placeholder="写下你的心事..." 
					v-model="content"
					maxlength="500"
				></textarea>
				<text class="word-count">{{content.length}}/500</text>
			</view>
			
			<view class="actions">
				<button class="btn btn-primary" @click="submitContent">匿名发布</button>
				<button class="btn btn-secondary" @click="clearContent">清空</button>
			</view>
			
			<view class="posts">
				<view class="post-item" v-for="(post, index) in posts" :key="index">
					<view class="post-content">{{post.content}}</view>
					<view class="post-time">{{post.time}}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				content: '',
				posts: [
					{
						content: '今天工作压力好大，感觉有点喘不过气来...',
						time: '2024-11-01 14:30'
					},
					{
						content: '和家人吵架了，心情很糟糕，不知道该怎么办',
						time: '2024-11-01 10:15'
					}
				]
			}
		},
		methods: {
			submitContent() {
				if (!this.content.trim()) {
					uni.showToast({
						title: '请输入内容',
						icon: 'none'
					})
					return
				}
				
				const now = new Date()
				const timeStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`
				
				this.posts.unshift({
					content: this.content,
					time: timeStr
				})
				
				this.content = ''
				uni.showToast({
					title: '发布成功',
					icon: 'success'
				})
			},
			clearContent() {
				this.content = ''
			}
		}
	}
</script>

<style scoped>
.hole-page {
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

.content {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.input-area {
	margin-bottom: 40rpx;
}

.textarea {
	width: 100%;
	height: 200rpx;
	background: #F8F9FA;
	border: 2rpx solid #E6F3FF;
	border-radius: 15rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.word-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.actions {
	display: flex;
	gap: 20rpx;
	margin-bottom: 40rpx;
}

.btn {
	flex: 1;
	height: 80rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
	border: none;
}

.btn-primary {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
}

.btn-secondary {
	background: #F5F5F5;
	color: #666;
}

.posts {
	border-top: 2rpx solid #F0F0F0;
	padding-top: 30rpx;
}

.post-item {
	background: #F8F9FA;
	border-radius: 15rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.post-content {
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
	margin-bottom: 10rpx;
}

.post-time {
	font-size: 22rpx;
	color: #999;
	text-align: right;
}
</style>