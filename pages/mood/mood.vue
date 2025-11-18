<template>
	<view class="mood-page">
		<!-- 统计卡片 -->
		<view class="stats-section">
			<view class="stat-card">
				<text class="stat-number">{{ stats.total || 0 }}</text>
				<text class="stat-label">总记录数</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ stats.averageScore || 5.0 }}</text>
				<text class="stat-label">平均心情</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ getRecentMoodText() }}</text>
				<text class="stat-label">最近心情</text>
			</view>
		</view>
		
		<!-- 快速记录 -->
		<view class="quick-record-section">
			<text class="section-title">📝 快速记录</text>
			<view class="mood-selector">
				<view 
					v-for="(mood, index) in moods" 
					:key="index"
					:class="['mood-item', {active: selectedMood === mood.value}]"
					@click="selectMood(mood.value)"
				>
					<text class="mood-icon">{{ mood.icon }}</text>
					<text class="mood-text">{{ mood.label }}</text>
				</view>
			</view>
			<view class="note-input">
				<textarea 
					v-model="moodNote" 
					class="textarea" 
					placeholder="记录一下今天的心情吧..."
					maxlength="500"
				/>
				<text class="char-count">{{ moodNote.length }}/500</text>
			</view>
			<button class="save-btn" @click="saveMood">保存记录</button>
		</view>
		
		<!-- 历史记录 -->
		<view class="history-section">
			<text class="section-title">📊 历史记录</text>
			<scroll-view 
				class="records-list" 
				scroll-y="true"
				:refresher-enabled="true"
				:refresher-triggered="isRefreshing"
				@refresherrefresh="onRefresh"
				@scrolltolower="loadMore"
				:lower-threshold="100"
			>
				<view class="empty-state" v-if="!isLoading && records.length === 0">
					<text class="empty-icon">📝</text>
					<text class="empty-text">还没有心情记录</text>
					<text class="empty-desc">开始记录你的心情吧~</text>
				</view>
				
				<view 
					class="record-item" 
					v-for="(record, index) in records" 
					:key="record.id || index"
					:style="{animationDelay: (index * 0.05) + 's'}"
				>
					<view class="record-header">
						<view class="record-mood">
							<text class="mood-icon-large">{{ getMoodIcon(record.mood_type) }}</text>
							<text class="mood-type">{{ getMoodLabel(record.mood_type) }}</text>
						</view>
						<view class="record-actions">
							<text class="delete-btn" @click="deleteRecord(record.id)">删除</text>
						</view>
					</view>
					<view class="record-content" v-if="record.note">
						<text class="note-text">{{ record.note }}</text>
					</view>
					<view class="record-footer">
						<text class="record-date">{{ formatDate(record.created_at) }}</text>
						<text class="record-score" v-if="record.mood_score">评分: {{ record.mood_score }}/10</text>
					</view>
				</view>
				
				<view class="loading-more" v-if="isLoadingMore">
					<text>加载中...</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import conversationService from '@/utils/supabase.js'
	
	export default {
		data() {
			return {
				selectedMood: 'neutral',
				moodNote: '',
				records: [],
				stats: {
					total: 0,
					averageScore: 5.0,
					moodDistribution: {},
					recentMood: null
				},
				isLoading: false,
				isRefreshing: false,
				isLoadingMore: false,
				currentPage: 1,
				hasMore: true,
				moods: [
					{ value: 'happy', label: '开心', icon: '😊' },
					{ value: 'sad', label: '难过', icon: '😢' },
					{ value: 'anxious', label: '焦虑', icon: '😰' },
					{ value: 'angry', label: '愤怒', icon: '😠' },
					{ value: 'neutral', label: '平静', icon: '😐' },
					{ value: 'tired', label: '疲惫', icon: '😴' },
					{ value: 'confused', label: '困惑', icon: '😕' },
					{ value: 'grateful', label: '感恩', icon: '🙏' }
				]
			}
		},
		onLoad() {
			this.loadStats()
			this.loadRecords()
		},
		methods: {
			selectMood(moodValue) {
				this.selectedMood = moodValue
			},
			
			async saveMood() {
				if (!this.selectedMood) {
					uni.showToast({
						title: '请选择心情',
						icon: 'none'
					})
					return
				}
				
				uni.showLoading({
					title: '保存中...'
				})
				
				try {
					const moodObj = this.moods.find(m => m.value === this.selectedMood)
					const moodScore = this.getMoodScore(this.selectedMood)
					
					await conversationService.supabaseService.createMoodRecord({
						moodType: this.selectedMood,
						moodScore: moodScore,
						note: this.moodNote.trim() || null
					})
					
					uni.hideLoading()
					uni.showToast({
						title: '记录成功',
						icon: 'success'
					})
					
					// 清空输入
					this.selectedMood = 'neutral'
					this.moodNote = ''
					
					// 刷新数据
					this.loadStats()
					this.loadRecords(true)
				} catch (error) {
					uni.hideLoading()
					console.error('保存心情记录失败:', error)
					uni.showToast({
						title: error.message || '保存失败，请重试',
						icon: 'none'
					})
				}
			},
			
			getMoodScore(moodType) {
				const scoreMap = {
					'happy': 9,
					'grateful': 8,
					'neutral': 5,
					'tired': 4,
					'confused': 4,
					'sad': 3,
					'anxious': 3,
					'angry': 2
				}
				return scoreMap[moodType] || 5
			},
			
			async loadStats() {
				try {
					this.stats = await conversationService.supabaseService.getMoodStats()
				} catch (error) {
					console.error('加载统计失败:', error)
				}
			},
			
			async loadRecords(refresh = false) {
				if (this.isLoading) return
				
				if (refresh) {
					this.currentPage = 1
					this.hasMore = true
					this.records = []
				}
				
				if (!this.hasMore) return
				
				this.isLoading = true
				
				try {
					const newRecords = await conversationService.supabaseService.getUserMoodRecords(
						this.currentPage,
						20
					)
					
					if (refresh) {
						this.records = newRecords
					} else {
						this.records = [...this.records, ...newRecords]
					}
					
					this.hasMore = newRecords.length >= 20
					if (this.hasMore) {
						this.currentPage++
					}
				} catch (error) {
					console.error('加载记录失败:', error)
					if (error.message && error.message.includes('Could not find the table')) {
						uni.showToast({
							title: '请先在数据库中创建心情记录表',
							icon: 'none',
							duration: 3000
						})
					}
				} finally {
					this.isLoading = false
					this.isRefreshing = false
					this.isLoadingMore = false
				}
			},
			
			async onRefresh() {
				this.isRefreshing = true
				await this.loadStats()
				await this.loadRecords(true)
			},
			
			async loadMore() {
				if (this.isLoadingMore || !this.hasMore) return
				this.isLoadingMore = true
				await this.loadRecords()
			},
			
			async deleteRecord(recordId) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条记录吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								await conversationService.supabaseService.deleteMoodRecord(recordId)
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								// 刷新数据
								this.loadStats()
								this.loadRecords(true)
							} catch (error) {
								console.error('删除失败:', error)
								uni.showToast({
									title: error.message || '删除失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			getMoodIcon(moodType) {
				const mood = this.moods.find(m => m.value === moodType)
				return mood ? mood.icon : '😐'
			},
			
			getMoodLabel(moodType) {
				const mood = this.moods.find(m => m.value === moodType)
				return mood ? mood.label : '平静'
			},
			
			getRecentMoodText() {
				if (!this.stats.recentMood) return '暂无'
				return this.getMoodLabel(this.stats.recentMood.mood_type)
			},
			
			formatDate(dateStr) {
				if (!dateStr) return ''
				const date = new Date(dateStr)
				const now = new Date()
				const diff = now - date
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				
				if (days === 0) {
					const hours = Math.floor(diff / (1000 * 60 * 60))
					if (hours === 0) {
						const minutes = Math.floor(diff / (1000 * 60))
						return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
					}
					return `${hours}小时前`
				}
				if (days === 1) return '昨天'
				if (days < 7) return `${days}天前`
				
				const month = date.getMonth() + 1
				const day = date.getDate()
				return `${month}月${day}日`
			}
		}
	}
</script>

<style scoped>
.mood-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F0F8FF 50%, #E6F3FF 100%);
	padding: 20rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.stats-section {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.stat-card {
	flex: 1;
	background: linear-gradient(135deg, #B3D9FF 0%, #E6F3FF 100%);
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	text-align: center;
	box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.15);
}

.stat-number {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #2C5F8D;
	margin-bottom: 10rpx;
}

.stat-label {
	display: block;
	font-size: 24rpx;
	color: #7A9BC4;
}

.quick-record-section {
	background: #fff;
	border-radius: 24rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #2C5F8D;
	margin-bottom: 30rpx;
}

.mood-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.mood-item {
	flex: 1;
	min-width: calc(25% - 15rpx);
	background: #F5F9FF;
	border: 2rpx solid #E6F3FF;
	border-radius: 16rpx;
	padding: 20rpx 10rpx;
	text-align: center;
	transition: all 0.3s;
}

.mood-item.active {
	background: linear-gradient(135deg, #87CEEB 0%, #B0D8FF 100%);
	border-color: #4A90E2;
	transform: scale(1.05);
}

.mood-icon {
	display: block;
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.mood-text {
	display: block;
	font-size: 24rpx;
	color: #5A7FA3;
}

.mood-item.active .mood-text {
	color: #2C5F8D;
	font-weight: bold;
}

.note-input {
	position: relative;
	margin-bottom: 30rpx;
}

.textarea {
	width: 100%;
	min-height: 200rpx;
	background: #F5F9FF;
	border: 2rpx solid #E6F3FF;
	border-radius: 16rpx;
	padding: 20rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
}

.char-count {
	position: absolute;
	right: 20rpx;
	bottom: 20rpx;
	font-size: 22rpx;
	color: #999;
}

.save-btn {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #4A90E2 0%, #87CEEB 100%);
	color: white;
	border-radius: 40rpx;
	font-size: 30rpx;
	border: none;
	box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
}

.history-section {
	background: #fff;
	border-radius: 24rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.1);
	flex: 1;
	display: flex;
	flex-direction: column;
}

.records-list {
	flex: 1;
	height: 600rpx;
}

.empty-state {
	text-align: center;
	padding: 100rpx 0;
}

.empty-icon {
	display: block;
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	display: block;
	font-size: 28rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.empty-desc {
	display: block;
	font-size: 24rpx;
	color: #ccc;
}

.record-item {
	background: #F5F9FF;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border: 2rpx solid #E6F3FF;
	animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.record-mood {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.mood-icon-large {
	font-size: 40rpx;
}

.mood-type {
	font-size: 28rpx;
	font-weight: bold;
	color: #2C5F8D;
}

.delete-btn {
	font-size: 24rpx;
	color: #FF6B9D;
	padding: 8rpx 16rpx;
}

.record-content {
	margin-bottom: 16rpx;
}

.note-text {
	font-size: 26rpx;
	color: #5A7FA3;
	line-height: 1.6;
}

.record-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.record-date {
	font-size: 24rpx;
	color: #999;
}

.record-score {
	font-size: 24rpx;
	color: #7A9BC4;
}

.loading-more {
	text-align: center;
	padding: 30rpx;
	color: #999;
	font-size: 26rpx;
}
</style>

