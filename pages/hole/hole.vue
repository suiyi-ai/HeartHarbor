<template>
	<view class="hole-page">
		<!-- 头部 -->
		<view class="header">
			<view class="header-content">
				<text class="title">🌳 树洞</text>
				<text class="subtitle">在这里倾诉你的心声，释放内心的压力</text>
			</view>
		</view>
		
		<!-- 帖子列表 -->
		<scroll-view 
			class="posts-container" 
			scroll-y="true" 
			:refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="loadMore"
			:lower-threshold="100"
			:scroll-top="scrollTop"
		>
			<view class="posts">
				<!-- 空状态 -->
				<view class="empty-state" v-if="!isLoading && posts.length === 0">
					<view class="empty-icon-wrapper">
						<text class="empty-icon">🌙</text>
					</view>
					<text class="empty-text">树洞里还没有内容</text>
					<text class="empty-desc">成为第一个分享心事的人吧~</text>
					<button class="empty-action-btn" @click="scrollToTop">
						开始分享
					</button>
				</view>
				
				<!-- 帖子项 -->
				<view 
					class="post-item" 
					v-for="(post, index) in posts" 
					:key="post.id || index"
					:style="{animationDelay: (index * 0.05) + 's'}"
				>
					<view class="post-header">
						<view class="post-author">
							<view class="author-avatar">
								<text class="avatar-icon">🌙</text>
							</view>
							<view class="author-info">
								<text class="author-name">{{post.is_anonymous ? '匿名用户' : '用户'}}</text>
								<text class="post-time-header">{{formatTime(post.created_at || post.time)}}</text>
							</view>
						</view>
						<view class="post-header-right">
							<view class="post-emotion" v-if="post.emotion">
								<text class="emotion-badge">{{getEmotionLabel(post.emotion)}}</text>
							</view>
							<view 
								class="delete-btn" 
								v-if="isMyPost(post)"
								@click.stop="deletePost(post, index)"
							>
								<text class="delete-icon">🗑️</text>
							</view>
						</view>
					</view>
					
					<view class="post-content">{{post.content}}</view>
					
					<view class="post-footer">
						<view class="post-actions">
							<view 
								class="action-item like-action" 
								:class="{liked: post.isLiked, animating: post.isLiking}"
								@click="toggleLike(post, index)"
							>
								<text class="action-icon">❤️</text>
								<text class="action-count">{{post.like_count || 0}}</text>
							</view>
							<view 
								class="action-item comment-action"
								:class="{active: post.showComments}"
								@click="showComments(post, index)"
							>
								<text class="action-icon">💬</text>
								<text class="action-count">{{post.comment_count || 0}}</text>
							</view>
						</view>
					</view>
					
					<!-- 评论区域 - 默认展开，突出显示 -->
					<view class="comments-section" :class="{expanded: post.showComments}">
						<view class="comments-header" @click="showComments(post, index)">
							<text class="comments-title">💬 评论 ({{post.comment_count || 0}})</text>
							<text class="comments-toggle">{{post.showComments ? '收起' : '展开'}}</text>
						</view>
						
						<!-- 评论列表 - 更突出 -->
						<view class="comments-list" v-if="post.showComments">
							<view 
								class="comment-item" 
								v-for="(comment, cIndex) in post.comments" 
								:key="cIndex"
							>
								<view class="comment-avatar">
									<text class="comment-avatar-icon">💭</text>
								</view>
								<view class="comment-body">
									<view class="comment-header">
										<text class="comment-author">{{comment.is_anonymous ? '匿名用户' : '用户'}}</text>
										<text class="comment-time">{{formatTime(comment.created_at)}}</text>
									</view>
									<text class="comment-content">{{comment.content}}</text>
								</view>
							</view>
							
							<view class="no-comments" v-if="!post.comments || post.comments.length === 0">
								<text class="no-comments-text">还没有评论，快来第一个回应吧~</text>
							</view>
						</view>
						
						<!-- 添加评论 - 更紧凑 -->
						<view class="comment-input-area" v-if="post.showComments">
							<input 
								class="comment-input" 
								v-model="post.commentText" 
								placeholder="写下你的回应..."
								@confirm="submitComment(post, index)"
								maxlength="200"
							/>
							<button 
								class="comment-submit-btn" 
								@click="submitComment(post, index)"
								:disabled="!post.commentText || post.commentText.trim() === ''"
							>
								发送
							</button>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMore && !isLoading && posts.length > 0">
					<view class="load-more-content">
						<text class="load-more-icon">⬇️</text>
						<text class="load-more-text">上拉加载更多</text>
					</view>
				</view>
				
				<!-- 加载中 -->
				<view class="loading" v-if="isLoading && posts.length > 0">
					<view class="loading-spinner">
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
						<text class="spinner-dot">.</text>
					</view>
					<text class="loading-text">加载中...</text>
				</view>
				
				<!-- 没有更多 -->
				<view class="no-more" v-if="!hasMore && posts.length > 0">
					<view class="no-more-line"></view>
					<text class="no-more-text">没有更多了</text>
					<view class="no-more-line"></view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 回到顶部按钮 -->
		<view 
			class="back-to-top" 
			v-if="showBackToTop"
			@click="scrollToTop"
		>
			<text class="back-to-top-icon">↑</text>
		</view>
		
		<!-- 固定底部的发布区域 -->
		<view class="fixed-publish-section" :class="{collapsed: !showPublishSection, expanded: showPublishSection}">
			<view class="publish-header" @click="togglePublishSection">
				<text class="publish-title">📝 分享你的心情</text>
				<text class="publish-toggle">{{showPublishSection ? '收起 ▲' : '展开 ▼'}}</text>
			</view>
			
			<view class="publish-content" v-if="showPublishSection">
				<view class="input-area">
					<textarea 
						class="textarea" 
						placeholder="写下你的心事，分享你的感受..." 
						v-model="content"
						maxlength="500"
						:disabled="isSubmitting"
						@focus="onTextareaFocus"
						@blur="onTextareaBlur"
					></textarea>
					<view class="input-footer">
						<text class="word-count" :class="{warning: content.length > 450}">
							{{content.length}}/500
						</text>
					</view>
				</view>
				
				<!-- 情绪标签选择 -->
				<view class="emotion-section">
					<text class="emotion-label">选择你的情绪</text>
					<scroll-view class="emotion-tags" scroll-x="true" show-scrollbar="false">
						<view 
							class="emotion-tag" 
							v-for="(emotion, index) in emotions" 
							:key="index"
							:class="{active: selectedEmotion === emotion.value}"
							@click="selectEmotion(emotion.value)"
						>
							<text class="emotion-icon">{{emotion.icon}}</text>
							<text class="emotion-text">{{emotion.label}}</text>
						</view>
					</scroll-view>
				</view>
				
				<view class="actions">
					<button 
						class="btn btn-secondary" 
						@click="clearContent"
						:disabled="isSubmitting || !content.trim()"
					>
						清空
					</button>
					<button 
						class="btn btn-primary" 
						@click="submitContent"
						:disabled="isSubmitting || !content.trim()"
						:loading="isSubmitting"
					>
						{{isSubmitting ? '发布中...' : '匿名发布'}}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import conversationService from '@/utils/supabase.js'
	
	export default {
		data() {
			return {
				content: '',
				selectedEmotion: 'neutral',
				isSubmitting: false,
				isLoading: false,
				isRefreshing: false,
				hasMore: true,
				currentPage: 1,
				pageSize: 20,
				posts: [],
				scrollTop: 0,
				showBackToTop: false,
				textareaFocused: false,
				showPublishSection: false, // 默认折叠发布区域，固定在底部
				
				// 情绪标签
				emotions: [
					{ value: 'happy', label: '开心', icon: '😊', color: '#FFD700' },
					{ value: 'sad', label: '难过', icon: '😢', color: '#87CEEB' },
					{ value: 'anxious', label: '焦虑', icon: '😰', color: '#FF6B6B' },
					{ value: 'angry', label: '愤怒', icon: '😠', color: '#FF4757' },
					{ value: 'neutral', label: '平静', icon: '😐', color: '#95A5A6' },
					{ value: 'tired', label: '疲惫', icon: '😴', color: '#A8E6CF' },
					{ value: 'confused', label: '困惑', icon: '😕', color: '#FFA07A' },
					{ value: 'grateful', label: '感恩', icon: '🙏', color: '#FFD93D' }
				]
			}
		},
		
		onLoad() {
			this.loadPosts()
		},
		
		onShow() {
			// 页面显示时刷新帖子列表
			if (this.posts.length > 0) {
				this.onRefresh()
			}
		},
		
		methods: {
			// 文本域聚焦
			onTextareaFocus() {
				this.textareaFocused = true
			},
			
			// 文本域失焦
			onTextareaBlur() {
				this.textareaFocused = false
			},
			
			// 选择情绪
			selectEmotion(emotion) {
				this.selectedEmotion = emotion
			},
			
			// 获取情绪标签
			getEmotionLabel(emotion) {
				const emotionObj = this.emotions.find(e => e.value === emotion)
				return emotionObj ? `${emotionObj.icon} ${emotionObj.label}` : emotion
			},
			
			// 清空内容
			clearContent() {
				uni.showModal({
					title: '确认清空',
					content: '确定要清空输入的内容吗？',
					success: (res) => {
						if (res.confirm) {
							this.content = ''
							this.selectedEmotion = 'neutral'
						}
					}
				})
			},
			
			// 提交内容
			async submitContent() {
				if (!this.content.trim()) {
					uni.showToast({
						title: '请输入内容',
						icon: 'none'
					})
					return
				}
				
				this.isSubmitting = true
				
				try {
					// 尝试保存到数据库
					let post = null
					try {
						post = await conversationService.supabaseService.createTreeholePost(
							this.content,
							this.selectedEmotion,
							true
						)
					} catch (error) {
						console.log('保存到数据库失败，使用本地存储:', error)
					}
					
					// 如果数据库保存失败，使用本地存储
					if (!post) {
						const now = new Date()
						const currentUserId = conversationService.supabaseService.getUserId()
						post = {
							id: 'local_' + Date.now(),
							user_id: currentUserId,
							content: this.content,
							emotion: this.selectedEmotion,
							is_anonymous: true,
							like_count: 0,
							comment_count: 0,
							isLiked: false,
							comments: [],
							showComments: false,
							commentText: '',
							created_at: now.toISOString(),
							time: this.formatTime(now.toISOString())
						}
						
						// 保存到本地存储
						const localPosts = uni.getStorageSync('treehole_posts') || []
						localPosts.unshift(post)
						uni.setStorageSync('treehole_posts', localPosts.slice(0, 100))
					}
					
					// 添加到列表
					this.posts.unshift({
						...post,
						isLiked: false,
						comments: [],
						showComments: false,
						commentText: '',
						time: post.time || this.formatTime(post.created_at)
					})
					
					// 清空输入（直接清空，不显示确认弹窗）
					this.content = ''
					this.selectedEmotion = 'neutral'
					
					// 滚动到顶部
					this.scrollToTop()
					
					uni.showToast({
						title: '发布成功',
						icon: 'success',
						duration: 2000
					})
				} catch (error) {
					console.error('发布失败:', error)
					uni.showToast({
						title: '发布失败，请重试',
						icon: 'none'
					})
				} finally {
					this.isSubmitting = false
				}
			},
			
			// 加载帖子列表
			async loadPosts(refresh = false) {
				if (this.isLoading) return
				
				this.isLoading = true
				
				if (refresh) {
					this.currentPage = 1
					this.hasMore = true
				}
				
				try {
					// 尝试从数据库加载
					let newPosts = []
					try {
						newPosts = await conversationService.supabaseService.getTreeholePosts(
							this.currentPage,
							this.pageSize
						)
						
						// 检查用户点赞状态，默认展开评论
						for (let post of newPosts) {
							try {
								post.isLiked = await conversationService.supabaseService.checkUserLikedPost(post.id)
							} catch (error) {
								post.isLiked = false
							}
							// 如果有评论，默认展开并加载评论
							if (post.comment_count > 0) {
								post.showComments = true
								// 自动加载评论
								try {
									post.comments = await conversationService.supabaseService.getTreeholeComments(post.id)
									if (post.comments && post.comments.length > 0) {
										post.comments = post.comments.map(comment => ({
											...comment,
											time: this.formatTime(comment.created_at)
										}))
									}
								} catch (error) {
									console.error('加载评论失败:', error)
									post.comments = []
								}
							} else {
								post.comments = []
								post.showComments = false
							}
							post.commentText = ''
							post.time = this.formatTime(post.created_at)
						}
					} catch (error) {
						console.log('从数据库加载失败，使用本地存储:', error)
						// 从本地存储加载
						const localPosts = uni.getStorageSync('treehole_posts') || []
						newPosts = localPosts.slice(
							(this.currentPage - 1) * this.pageSize,
							this.currentPage * this.pageSize
						).map(post => {
							// 如果有评论，默认展开
							const hasComments = post.comment_count > 0 || (post.comments && post.comments.length > 0)
							return {
								...post,
								isLiked: false,
								comments: post.comments || [],
								showComments: hasComments, // 有评论时默认展开
								commentText: '',
								time: post.time || this.formatTime(post.created_at)
							}
						})
					}
					
					if (refresh) {
						this.posts = newPosts
					} else {
						this.posts = [...this.posts, ...newPosts]
					}
					
					// 检查是否还有更多
					this.hasMore = newPosts.length >= this.pageSize
					if (this.hasMore) {
						this.currentPage++
					}
				} catch (error) {
					console.error('加载帖子失败:', error)
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					})
				} finally {
					this.isLoading = false
					this.isRefreshing = false
				}
			},
			
			// 下拉刷新
			onRefresh() {
				this.isRefreshing = true
				this.loadPosts(true)
			},
			
			// 加载更多
			loadMore() {
				if (this.hasMore && !this.isLoading) {
					this.loadPosts(false)
				}
			},
			
			// 切换点赞
			async toggleLike(post, index) {
				// 添加动画效果
				post.isLiking = true
				
				if (!post.id || post.id.startsWith('local_')) {
					// 本地帖子，直接更新
					post.isLiked = !post.isLiked
					post.like_count = (post.like_count || 0) + (post.isLiked ? 1 : -1)
					post.like_count = Math.max(0, post.like_count)
					
					// 更新本地存储
					const localPosts = uni.getStorageSync('treehole_posts') || []
					const localIndex = localPosts.findIndex(p => p.id === post.id)
					if (localIndex !== -1) {
						localPosts[localIndex] = { ...post }
						uni.setStorageSync('treehole_posts', localPosts)
					}
					
					setTimeout(() => {
						post.isLiking = false
					}, 300)
					return
				}
				
				try {
					const result = await conversationService.supabaseService.likeTreeholePost(post.id)
					post.isLiked = result.liked
					// 更新点赞数
					if (result.liked) {
						post.like_count = (post.like_count || 0) + 1
					} else {
						post.like_count = Math.max(0, (post.like_count || 0) - 1)
					}
				} catch (error) {
					console.error('点赞失败:', error)
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				} finally {
					setTimeout(() => {
						post.isLiking = false
					}, 300)
				}
			},
			
			// 显示评论 - 默认展开，自动加载
			async showComments(post, index) {
				// 切换展开/收起状态
				post.showComments = !post.showComments
				
				// 如果展开且评论未加载，自动加载评论
				if (post.showComments && (!post.comments || post.comments.length === 0)) {
					// 加载评论
					try {
						if (post.id && !post.id.startsWith('local_')) {
							post.comments = await conversationService.supabaseService.getTreeholeComments(post.id)
							// 格式化时间
							if (post.comments && post.comments.length > 0) {
								post.comments = post.comments.map(comment => ({
									...comment,
									time: this.formatTime(comment.created_at)
								}))
							}
						} else {
							// 从本地存储加载评论
							const localPosts = uni.getStorageSync('treehole_posts') || []
							const localPost = localPosts.find(p => p.id === post.id)
							if (localPost) {
								post.comments = localPost.comments || []
							}
						}
					} catch (error) {
						console.error('加载评论失败:', error)
						post.comments = []
					}
				}
			},
			
			// 切换发布区域显示
			togglePublishSection() {
				this.showPublishSection = !this.showPublishSection
			},
			
			// 提交评论
			async submitComment(post, index) {
				if (!post.commentText || !post.commentText.trim()) {
					return
				}
				
				const commentContent = post.commentText.trim()
				post.commentText = ''
				
				try {
					let comment = null
					if (post.id && !post.id.startsWith('local_')) {
						// 保存到数据库
						comment = await conversationService.supabaseService.addTreeholeComment(
							post.id,
							commentContent,
							true
						)
						post.comment_count = (post.comment_count || 0) + 1
					} else {
						// 本地存储
						comment = {
							id: 'comment_' + Date.now(),
							content: commentContent,
							is_anonymous: true,
							created_at: new Date().toISOString()
						}
						
						if (!post.comments) {
							post.comments = []
						}
						post.comments.push(comment)
						post.comment_count = (post.comment_count || 0) + 1
						
						// 更新本地存储
						const localPosts = uni.getStorageSync('treehole_posts') || []
						const localIndex = localPosts.findIndex(p => p.id === post.id)
						if (localIndex !== -1) {
							localPosts[localIndex] = { ...post }
							uni.setStorageSync('treehole_posts', localPosts)
						}
					}
					
					if (comment) {
						if (!post.comments) {
							post.comments = []
						}
						post.comments.push({
							...comment,
							time: this.formatTime(comment.created_at)
						})
					}
					
					uni.showToast({
						title: '评论成功',
						icon: 'success'
					})
				} catch (error) {
					console.error('评论失败:', error)
					uni.showToast({
						title: '评论失败，请重试',
						icon: 'none'
					})
				}
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return ''
				
				const now = new Date()
				const time = new Date(timeStr)
				const diff = now - time
				
				// 小于1分钟
				if (diff < 60 * 1000) {
					return '刚刚'
				}
				
				// 小于1小时
				if (diff < 60 * 60 * 1000) {
					return Math.floor(diff / (60 * 1000)) + '分钟前'
				}
				
				// 小于1天
				if (diff < 24 * 60 * 60 * 1000) {
					return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
				}
				
				// 小于7天
				if (diff < 7 * 24 * 60 * 60 * 1000) {
					return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
				}
				
				// 显示具体日期
				const year = time.getFullYear()
				const month = String(time.getMonth() + 1).padStart(2, '0')
				const day = String(time.getDate()).padStart(2, '0')
				const hour = String(time.getHours()).padStart(2, '0')
				const minute = String(time.getMinutes()).padStart(2, '0')
				
				if (year === now.getFullYear()) {
					return `${month}-${day} ${hour}:${minute}`
				} else {
					return `${year}-${month}-${day} ${hour}:${minute}`
				}
			},
			
			// 滚动到顶部
			scrollToTop() {
				this.scrollTop = 0
				this.$nextTick(() => {
					this.scrollTop = Math.random()
				})
			},
			
			// 判断是否是当前用户的帖子
			isMyPost(post) {
				const currentUserId = conversationService.supabaseService.getUserId()
				return post.user_id === currentUserId
			},
			
			// 删除帖子
			async deletePost(post, index) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条心事吗？删除后将无法恢复。',
					confirmText: '删除',
					cancelText: '取消',
					confirmColor: '#FF4757',
					success: async (res) => {
						if (res.confirm) {
							try {
								if (post.id && !post.id.startsWith('local_')) {
									// 从数据库删除
									await conversationService.supabaseService.deleteTreeholePost(post.id)
								} else {
									// 从本地存储删除
									let localPosts = uni.getStorageSync('treehole_posts') || []
									localPosts = localPosts.filter(p => p.id !== post.id)
									uni.setStorageSync('treehole_posts', localPosts)
								}
								
								// 从当前列表中移除
								this.posts.splice(index, 1)
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							} catch (error) {
								console.error('删除帖子失败:', error)
								uni.showToast({
									title: '删除失败，请重试',
									icon: 'none'
								})
							}
						}
					}
				})
			}
		},
		
		onPageScroll(e) {
			// 显示/隐藏回到顶部按钮
			this.showBackToTop = e.scrollTop > 500
		}
	}
</script>

<style scoped>
.hole-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F0F8FF 50%, #E6F3FF 100%);
	padding: 0;
	display: flex;
	flex-direction: column;
	position: relative;
}

/* 头部样式优化 - 淡蓝色主题 */
.header {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 50%, #B0D8FF 100%);
	padding: 40rpx 30rpx 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.4);
	position: sticky;
	top: 0;
	z-index: 100;
}

.header-content {
	text-align: center;
}

.title {
	display: block;
	font-size: 52rpx;
	font-weight: bold;
	color: #fff;
	margin-bottom: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.subtitle {
	display: block;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

/* 固定底部发布区域 - 淡蓝色主题 */
.fixed-publish-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	border-top: 2rpx solid #E6F3FF;
	box-shadow: 0 -4rpx 20rpx rgba(176, 216, 255, 0.2);
	z-index: 999;
	transition: all 0.3s ease;
	/* 安全区域适配 */
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.fixed-publish-section.collapsed {
	max-height: 100rpx;
	overflow: hidden;
}

.fixed-publish-section.expanded {
	max-height: 80vh;
}

.publish-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	cursor: pointer;
	background: linear-gradient(135deg, #F8FBFF 0%, #E6F3FF 100%);
	border-bottom: 2rpx solid #E6F3FF;
	transition: all 0.3s;
	flex-shrink: 0;
}

.publish-header:active {
	background: linear-gradient(135deg, #E6F3FF 0%, #D0E8FF 100%);
}

.publish-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #4A90E2;
}

.publish-toggle {
	font-size: 24rpx;
	color: #87CEEB;
	font-weight: 500;
	transition: transform 0.3s;
}

.publish-content {
	padding: 20rpx;
	overflow-y: auto;
	animation: slideUp 0.3s ease-out;
	max-height: calc(80vh - 100rpx);
	flex: 1;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.input-area {
	margin-bottom: 25rpx;
}

.textarea {
	width: 100%;
	min-height: 220rpx;
	background: #F5F9FF;
	border: 2rpx solid #E6F3FF;
	border-radius: 16rpx;
	padding: 24rpx;
	font-size: 28rpx;
	box-sizing: border-box;
	line-height: 1.8;
	transition: all 0.3s;
}

.textarea:focus {
	border-color: #B0D8FF;
	background: #fff;
	box-shadow: 0 0 0 6rpx rgba(176, 216, 255, 0.2);
}

.input-footer {
	display: flex;
	justify-content: flex-end;
	margin-top: 12rpx;
}

.word-count {
	font-size: 24rpx;
	color: #999;
	transition: color 0.3s;
}

.word-count.warning {
	color: #FF6B6B;
	font-weight: bold;
}

/* 情绪标签区域优化 */
.emotion-section {
	margin-bottom: 25rpx;
}

.emotion-label {
	display: block;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 15rpx;
}

.emotion-tags {
	white-space: nowrap;
	display: flex;
	gap: 12rpx;
}

.emotion-tag {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 12rpx 18rpx;
	background: #F5F9FF;
	border: 2rpx solid #E6F3FF;
	border-radius: 24rpx;
	font-size: 24rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	flex-shrink: 0;
	position: relative;
	overflow: hidden;
}

.emotion-tag::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
	transition: left 0.5s;
}

.emotion-tag:active::before {
	left: 100%;
}

.emotion-tag.active {
	background: linear-gradient(135deg, #E6F3FF 0%, #B0D8FF 100%);
	border-color: #87CEEB;
	transform: scale(1.05);
	box-shadow: 0 4rpx 12rpx rgba(176, 216, 255, 0.4);
}

.emotion-icon {
	font-size: 28rpx;
	transition: transform 0.3s;
}

.emotion-tag.active .emotion-icon {
	transform: scale(1.2);
}

.emotion-text {
	color: #666;
	font-weight: 500;
	transition: color 0.3s;
}

.emotion-tag.active .emotion-text {
	color: #4A90E2;
	font-weight: bold;
}

/* 按钮优化 - 淡蓝色主题 */
.actions {
	display: flex;
	gap: 20rpx;
}

.btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	transition: all 0.3s;
	position: relative;
	overflow: hidden;
}

.btn::after {
	border: none;
}

.btn-primary {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	color: #fff;
	box-shadow: 0 6rpx 20rpx rgba(176, 216, 255, 0.4);
}

.btn-primary:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 12rpx rgba(176, 216, 255, 0.5);
}

.btn-primary:disabled {
	background: #ccc;
	opacity: 0.6;
	box-shadow: none;
}

.btn-secondary {
	background: #F5F9FF;
	color: #4A90E2;
	border: 2rpx solid #E6F3FF;
}

.btn-secondary:active {
	background: #E6F3FF;
	transform: scale(0.98);
	border-color: #B0D8FF;
}

.btn-secondary:disabled {
	opacity: 0.5;
	background: #F5F5F5;
	color: #999;
}

/* 帖子列表容器 */
.posts-container {
	flex: 1;
	height: 0;
	padding: 0 20rpx 120rpx; /* 底部留出空间给固定发布区域 */
}

.posts {
	padding-bottom: 20rpx;
}

/* 空状态优化 - 淡蓝色主题 */
.empty-state {
	text-align: center;
	padding: 120rpx 40rpx;
	background: #fff;
	border-radius: 24rpx;
	margin: 20rpx 0;
	box-shadow: 0 4rpx 20rpx rgba(176, 216, 255, 0.2);
	border: 2rpx solid rgba(176, 216, 255, 0.3);
}

.empty-icon-wrapper {
	margin-bottom: 30rpx;
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-20rpx);
	}
}

.empty-icon {
	display: block;
	font-size: 120rpx;
	margin: 0 auto;
}

.empty-text {
	display: block;
	font-size: 34rpx;
	color: #333;
	margin-bottom: 12rpx;
	font-weight: 600;
}

.empty-desc {
	display: block;
	font-size: 26rpx;
	color: #999;
	margin-bottom: 40rpx;
	line-height: 1.6;
}

.empty-action-btn {
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	color: white;
	border-radius: 44rpx;
	padding: 20rpx 60rpx;
	font-size: 28rpx;
	border: none;
	box-shadow: 0 6rpx 20rpx rgba(176, 216, 255, 0.4);
}

/* 帖子项优化 - 淡蓝色主题 */
.post-item {
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 6rpx 25rpx rgba(176, 216, 255, 0.2);
	border: 2rpx solid rgba(176, 216, 255, 0.3);
	animation: slideInUp 0.5s ease-out both;
	transition: all 0.3s;
}

.post-item:active {
	transform: scale(0.99);
}

@keyframes slideInUp {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.post-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.post-header-right {
	display: flex;
	align-items: center;
	gap: 15rpx;
}

.post-author {
	display: flex;
	align-items: center;
	gap: 15rpx;
	flex: 1;
}

.author-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #E6F3FF 0%, #B0D8FF 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 8rpx rgba(176, 216, 255, 0.3);
}

.avatar-icon {
	font-size: 36rpx;
}

.author-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.author-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.post-time-header {
	font-size: 22rpx;
	color: #999;
}

.post-emotion {
	margin-left: 0;
}

/* 删除按钮 */
.delete-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 107, 107, 0.1);
	transition: all 0.3s;
}

.delete-btn:active {
	transform: scale(0.9);
	background: rgba(255, 107, 107, 0.2);
}

.delete-icon {
	font-size: 28rpx;
}

.emotion-badge {
	font-size: 22rpx;
	color: #4A90E2;
	background: linear-gradient(135deg, #E6F3FF 0%, #B0D8FF 100%);
	padding: 6rpx 14rpx;
	border-radius: 16rpx;
	font-weight: 500;
	white-space: nowrap;
}

.post-content {
	font-size: 30rpx;
	color: #333;
	line-height: 1.9;
	margin-bottom: 24rpx;
	word-wrap: break-word;
	word-break: break-all;
	white-space: pre-wrap;
}

.post-footer {
	padding-top: 20rpx;
	border-top: 2rpx solid #F0F0F0;
}

.post-actions {
	display: flex;
	gap: 40rpx;
	justify-content: flex-end;
}

.action-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 26rpx;
	color: #666;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	transition: all 0.3s;
	position: relative;
}

.action-item:active {
	background: #F8F9FA;
	transform: scale(0.95);
}

.action-item.liked {
	color: #FF6B6B;
}

.action-item.liked .action-icon {
	filter: grayscale(0);
	animation: heartBeat 0.5s ease;
}

.action-item:not(.liked) .action-icon {
	filter: grayscale(100%);
	opacity: 0.7;
}

.action-item.comment-action.active {
	color: #4A90E2;
	background: #E6F3FF;
}

@keyframes heartBeat {
	0%, 100% {
		transform: scale(1);
	}
	25% {
		transform: scale(1.3);
	}
	50% {
		transform: scale(1.1);
	}
	75% {
		transform: scale(1.2);
	}
}

.action-icon {
	font-size: 32rpx;
	transition: transform 0.3s;
}

.action-item:active .action-icon {
	transform: scale(1.2);
}

.action-count {
	font-size: 24rpx;
	font-weight: 500;
	min-width: 30rpx;
	text-align: center;
}

/* 评论区域优化 - 更突出，以评论为主 */
.comments-section {
	margin-top: 28rpx;
	padding-top: 28rpx;
	border-top: 3rpx solid #E6F3FF;
	background: #F8FBFF;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-left: -32rpx;
	margin-right: -32rpx;
	margin-bottom: -32rpx;
	animation: slideDown 0.3s ease-out;
}

.comments-section.expanded {
	background: #F8FBFF;
}

@keyframes slideDown {
	from {
		opacity: 0;
		max-height: 0;
		transform: translateY(-10rpx);
	}
	to {
		opacity: 1;
		max-height: 2000rpx;
		transform: translateY(0);
	}
}

.comments-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 16rpx;
	border-bottom: 2rpx solid #E6F3FF;
	cursor: pointer;
}

.comments-title {
	font-size: 30rpx;
	color: #4A90E2;
	font-weight: 700;
}

.comments-toggle {
	font-size: 24rpx;
	color: #87CEEB;
	font-weight: 500;
}

.comments-list {
	margin-bottom: 24rpx;
	max-height: 800rpx;
	overflow-y: auto;
}

.comment-item {
	display: flex;
	gap: 16rpx;
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 2rpx 8rpx rgba(176, 216, 255, 0.15);
	animation: fadeIn 0.3s ease-out;
	transition: all 0.3s;
}

.comment-item:active {
	transform: scale(0.98);
	box-shadow: 0 1rpx 4rpx rgba(176, 216, 255, 0.2);
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-10rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.comment-avatar {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #E6F3FF 0%, #B0D8FF 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.comment-avatar-icon {
	font-size: 32rpx;
}

.comment-body {
	flex: 1;
	min-width: 0;
}

.comment-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.comment-author {
	font-size: 26rpx;
	color: #4A90E2;
	font-weight: 600;
}

.comment-time {
	font-size: 22rpx;
	color: #999;
}

.comment-content {
	font-size: 28rpx;
	color: #333;
	line-height: 1.8;
	word-wrap: break-word;
	white-space: pre-wrap;
}

.no-comments {
	text-align: center;
	padding: 40rpx 20rpx;
}

.no-comments-text {
	font-size: 24rpx;
	color: #999;
}

.comment-input-area {
	display: flex;
	gap: 12rpx;
	align-items: center;
	background: #fff;
	border: 2rpx solid #E6F3FF;
	border-radius: 32rpx;
	padding: 8rpx 8rpx 8rpx 20rpx;
	transition: all 0.3s;
}

.comment-input-area:focus-within {
	border-color: #B0D8FF;
	box-shadow: 0 0 0 4rpx rgba(176, 216, 255, 0.15);
}

.comment-input {
	flex: 1;
	height: 64rpx;
	background: transparent;
	border: none;
	font-size: 26rpx;
	color: #333;
}

.comment-input::placeholder {
	color: #999;
}

.comment-submit-btn {
	height: 64rpx;
	padding: 0 32rpx;
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	color: white;
	border-radius: 32rpx;
	font-size: 26rpx;
	font-weight: 600;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(176, 216, 255, 0.4);
	transition: all 0.3s;
}

.comment-submit-btn:active {
	transform: scale(0.95);
	box-shadow: 0 2rpx 8rpx rgba(176, 216, 255, 0.5);
}

.comment-submit-btn:disabled {
	background: #ccc;
	opacity: 0.6;
	box-shadow: none;
}

/* 加载状态优化 */
.load-more {
	text-align: center;
	padding: 40rpx 20rpx;
}

.load-more-content {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
}

.load-more-icon {
	font-size: 24rpx;
	animation: bounce 1s infinite;
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10rpx);
	}
}

.load-more-text {
	font-size: 26rpx;
	color: #999;
}

.loading {
	text-align: center;
	padding: 40rpx 20rpx;
}

.loading-spinner {
	display: flex;
	justify-content: center;
	gap: 8rpx;
	margin-bottom: 15rpx;
}

.spinner-dot {
	font-size: 40rpx;
	color: #87CEEB;
	animation: dotPulse 1.4s infinite ease-in-out both;
}

.spinner-dot:nth-child(1) {
	animation-delay: -0.32s;
}

.spinner-dot:nth-child(2) {
	animation-delay: -0.16s;
}

@keyframes dotPulse {
	0%, 80%, 100% {
		transform: scale(0.6);
		opacity: 0.5;
	}
	40% {
		transform: scale(1.2);
		opacity: 1;
	}
}

.loading-text {
	display: block;
	font-size: 26rpx;
	color: #999;
}

.no-more {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	padding: 40rpx 20rpx;
}

.no-more-line {
	flex: 1;
	height: 2rpx;
	background: linear-gradient(90deg, transparent, #E0E0E0, transparent);
}

.no-more-text {
	font-size: 24rpx;
	color: #999;
	white-space: nowrap;
}

/* 回到顶部按钮 - 淡蓝色主题 */
.back-to-top {
	position: fixed;
	right: 30rpx;
	bottom: 120rpx;
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #B0D8FF 0%, #87CEEB 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(176, 216, 255, 0.5);
	z-index: 999;
	animation: fadeInUp 0.3s ease-out;
	transition: all 0.3s;
}

.back-to-top:active {
	transform: scale(0.9);
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

.back-to-top-icon {
	font-size: 36rpx;
	color: white;
	font-weight: bold;
}

/* 响应式优化 */
@media (max-width: 750rpx) {
	.publish-section {
		margin: 15rpx;
		padding: 25rpx;
	}
	
	.post-item {
		padding: 28rpx;
		margin-bottom: 20rpx;
	}
	
	.emotion-tags {
		gap: 10rpx;
	}
	
	.emotion-tag {
		padding: 10rpx 16rpx;
		font-size: 22rpx;
	}
}
</style>
