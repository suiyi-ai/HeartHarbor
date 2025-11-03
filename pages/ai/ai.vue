<template>
	<view class="ai-page">
		<!-- 顶部功能区 -->
		<view class="top-bar">
			<view class="virtual-human-btn" @click="showVirtualHumanPreview">
				<text class="virtual-icon">🎭</text>
				<text class="virtual-text">虚拟人</text>
			</view>
			<view class="current-settings">
				<text class="settings-text">当前：{{currentRole.name}} · {{currentStyle.name}}</text>
			</view>
			<view class="conversation-actions">
				<view class="new-conversation-btn" @click="createNewConversation">
					<text class="action-icon">➕</text>
					<text class="action-text">新对话</text>
				</view>
				<view class="history-btn" @click="toggleHistoryPanel">
					<text class="action-icon">📚</text>
					<text class="action-text">历史记录</text>
				</view>
			</view>
		</view>
		
		<!-- 角色选择区 -->
		<view class="role-section">
			<text class="section-title">选择AI角色</text>
			<scroll-view class="role-list" scroll-x="true" show-scrollbar="false" enable-flex>
				<view class="role-item" v-for="role in roles" :key="role.id"
					:class="{active: currentRole.id === role.id}"
					@click="selectRole(role.id)">
					<text class="role-icon">{{role.icon}}</text>
					<text class="role-name">{{role.name}}</text>
					<text class="role-desc">{{role.description}}</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 风格设置区 -->
		<view class="style-section">
			<text class="section-title">回复风格</text>
			<view class="style-tags">
				<view class="style-tag" v-for="style in styles" :key="style.id"
					:class="{active: currentStyle.id === style.id}"
					@click="selectStyle(style.id)">
					<text class="style-icon">{{style.icon}}</text>
					<text class="style-name">{{style.name}}</text>
				</view>
			</view>
		</view>
		
		<!-- 聊天主界面 -->
		<view class="chat-container">
			<scroll-view class="message-list" scroll-y="true" :scroll-top="scrollTop" enable-flex>
				<view class="message-item" v-for="(msg, index) in messages" :key="index" 
					:class="{'user-message': msg.role === 'user', 'ai-message': msg.role === 'assistant'}">
					<view class="avatar">
						<text v-if="msg.role === 'user'">👤</text>
						<text v-else>{{currentRole.icon}}</text>
					</view>
					<view class="content">
						<text>{{msg.content}}</text>
					</view>
				</view>
				
				<!-- 加载状态 -->
				<view class="message-item ai-message" v-if="isLoading">
					<view class="avatar">
						<text>{{currentRole.icon}}</text>
					</view>
					<view class="content">
						<view class="loading-dots">
							<text class="dot">.</text>
							<text class="dot">.</text>
							<text class="dot">.</text>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<view class="input-area">
				<input class="input" v-model="inputText" placeholder="和AI伙伴聊聊..." @confirm="sendMessage" />
				<button class="send-btn" @click="sendMessage">发送</button>
			</view>
		</view>
		
		<!-- 虚拟人功能预览弹窗 -->
		<view class="modal" v-if="showVirtualHumanModal">
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">虚拟人功能</text>
					<text class="modal-close" @click="closeVirtualHumanModal">×</text>
				</view>
				<view class="modal-body">
					<text class="modal-text">虚拟人功能正在开发中，即将推出！</text>
					<text class="modal-text">未来您将可以与虚拟形象进行更生动的对话交流。</text>
					<view class="feature-preview">
						<text class="feature-item">🎯 个性化虚拟形象</text>
						<text class="feature-item">💬 表情丰富的对话</text>
						<text class="feature-item">🎨 自定义外观</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 历史记录面板 -->
		<view class="history-panel" :class="{active: showHistoryPanel}">
			<view class="history-header">
				<text class="history-title">对话历史</text>
				<view class="history-stats">
					<text class="stat-item">总计: {{conversationStats.total}}</text>
					<text class="stat-item">最近: {{conversationStats.recent}}</text>
				</view>
				<text class="history-close" @click="toggleHistoryPanel">×</text>
			</view>
			<scroll-view class="history-list" scroll-y="true">
				<view class="history-item" 
					v-for="conversation in conversations" 
					:key="conversation.id"
					:class="{active: currentConversationId === conversation.id}"
					@click="loadConversation(conversation.id)">
					<view class="conversation-info">
						<text class="conversation-title">{{conversation.title}}</text>
						<text class="conversation-meta">
							{{formatDate(conversation.updated_at)}} · 
							{{getRoleName(conversation.role_id)}} · 
							{{getStyleName(conversation.style_id)}}
						</text>
					</view>
					<view class="conversation-actions">
						<text class="action-btn delete-btn" @click.stop="deleteConversation(conversation.id)">🗑️</text>
						<text class="action-btn edit-btn" @click.stop="editConversationTitle(conversation)">✏️</text>
					</view>
				</view>
				<view class="empty-state" v-if="conversations.length === 0">
					<text class="empty-icon">📝</text>
					<text class="empty-text">还没有对话记录</text>
					<text class="empty-hint">开始新的对话吧！</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 遮罩层 -->
		<view class="overlay" v-if="showHistoryPanel" @click="toggleHistoryPanel"></view>
		
		<!-- 编辑标题弹窗 -->
		<view class="modal" v-if="showEditTitleModal">
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">编辑对话标题</text>
					<text class="modal-close" @click="closeEditTitleModal">×</text>
				</view>
				<view class="modal-body">
					<input class="title-input" v-model="editingTitle" placeholder="请输入对话标题" />
					<view class="modal-actions">
						<button class="btn-cancel" @click="closeEditTitleModal">取消</button>
						<button class="btn-confirm" @click="confirmEditTitle">确定</button>
					</view>
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
				inputText: '',
				messages: [
					{
						role: 'assistant',
						content: '你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？'
					}
				],
				scrollTop: 0,
				showVirtualHumanModal: false,
				isLoading: false,
				
				// 对话管理相关
				conversations: [],
				currentConversationId: null,
				showHistoryPanel: false,
				showEditTitleModal: false,
				editingConversation: null,
				editingTitle: '',
				conversationStats: {
					total: 0,
					recent: 0
				},
				
				// Dify API配置
				difyConfig: {
					apiKey: 'app-VlvTWUWxlfDZhLgTIVuGj22t',
					apiUrl: 'https://dify.aipfuture.com/v1',
					endpoint: '/chat-messages'
				},
				
				// 角色数据
				roles: [
					{ id: 'companion', name: '心灵伙伴', icon: '💖', description: '温暖陪伴，情感支持' },
					{ id: 'advisor', name: '专业顾问', icon: '🎓', description: '专业分析，理性建议' }
				],
				
				// 风格数据
				styles: [
					{ id: 'friendly', name: '亲切友好', icon: '😊' },
					{ id: 'professional', name: '专业严谨', icon: '📊' },
					{ id: 'encouraging', name: '鼓励支持', icon: '🌟' },
					{ id: 'casual', name: '轻松随意', icon: '😄' }
				],
				
				currentRole: { id: 'companion', name: '心灵伙伴', icon: '💖', description: '温暖陪伴，情感支持' },
				currentStyle: { id: 'friendly', name: '亲切友好', icon: '😊' }
			}
		},
		
		mounted() {
			// 从本地存储加载用户偏好设置
			this.loadUserPreferences()
			// 初始化对话系统
			this.initConversationSystem()
		},
		
		methods: {
			// 初始化对话系统
			async initConversationSystem() {
				try {
					// 检查Supabase连接
					await conversationService.checkSupabaseConnection()
					
					// 加载对话列表
					await this.loadConversations()
					
					// 如果没有当前对话，创建新对话
					if (!this.currentConversationId && this.conversations.length === 0) {
						await this.createNewConversation()
					}
					
					// 加载统计信息
					await this.loadConversationStats()
					
				} catch (error) {
					console.error('初始化对话系统失败:', error)
					uni.showToast({
						title: '对话系统初始化失败',
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			// 加载对话列表
			async loadConversations() {
				try {
					this.conversations = await conversationService.getUserConversations()
					// 按更新时间倒序排列
					this.conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
				} catch (error) {
					console.error('加载对话列表失败:', error)
				}
			},
			
			// 加载统计信息
			async loadConversationStats() {
				try {
					this.conversationStats = await conversationService.getConversationStats()
				} catch (error) {
					console.error('加载统计信息失败:', error)
				}
			},
			
			// 创建新对话
			async createNewConversation() {
				try {
					const title = `与${this.currentRole.name}的对话`
					const conversation = await conversationService.createConversation(
						title,
						this.currentRole.id,
						this.currentStyle.id
					)
					
					this.currentConversationId = conversation.id
					this.messages = [
						{
							role: 'assistant',
							content: '你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？'
						}
					]
					
					// 重新加载对话列表
					await this.loadConversations()
					await this.loadConversationStats()
					
					uni.showToast({
						title: '新对话已创建',
						icon: 'success',
						duration: 1500
					})
					
				} catch (error) {
					console.error('创建新对话失败:', error)
					uni.showToast({
						title: '创建对话失败',
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			// 加载对话
			async loadConversation(conversationId) {
				try {
					this.currentConversationId = conversationId
					
					// 获取对话消息
					const conversation = this.conversations.find(c => c.id === conversationId)
					if (conversation && conversation.messages) {
						this.messages = conversation.messages
					} else {
						// 从数据库加载消息
						const messages = await conversationService.getConversationMessages(conversationId)
						this.messages = messages
					}
					
					// 更新当前角色和风格
					const conversationData = this.conversations.find(c => c.id === conversationId)
					if (conversationData) {
						const role = this.roles.find(r => r.id === conversationData.role_id)
						const style = this.styles.find(s => s.id === conversationData.style_id)
						
						if (role) this.currentRole = role
						if (style) this.currentStyle = style
					}
					
					// 关闭历史面板
					this.showHistoryPanel = false
					
					// 滚动到底部
					this.$nextTick(() => {
						this.scrollTop = 99999
					})
					
				} catch (error) {
					console.error('加载对话失败:', error)
					uni.showToast({
						title: '加载对话失败',
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			// 删除对话
			async deleteConversation(conversationId) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个对话吗？此操作不可恢复。',
					success: async (res) => {
						if (res.confirm) {
							try {
								await conversationService.deleteConversation(conversationId)
								
								// 如果删除的是当前对话，创建新对话
								if (this.currentConversationId === conversationId) {
									await this.createNewConversation()
								}
								
								// 重新加载对话列表
								await this.loadConversations()
								await this.loadConversationStats()
								
								uni.showToast({
									title: '对话已删除',
									icon: 'success',
									duration: 1500
								})
								
							} catch (error) {
								console.error('删除对话失败:', error)
								uni.showToast({
									title: '删除失败',
									icon: 'none',
									duration: 2000
								})
							}
						}
					}
				})
			},
			
			// 编辑对话标题
			editConversationTitle(conversation) {
				this.editingConversation = conversation
				this.editingTitle = conversation.title
				this.showEditTitleModal = true
			},
			
			// 确认编辑标题
			async confirmEditTitle() {
				if (!this.editingTitle.trim()) {
					uni.showToast({
						title: '标题不能为空',
						icon: 'none',
						duration: 2000
					})
					return
				}
				
				try {
					await conversationService.updateConversationTitle(
						this.editingConversation.id,
						this.editingTitle
					)
					
					// 更新本地数据
					const index = this.conversations.findIndex(c => c.id === this.editingConversation.id)
					if (index >= 0) {
						this.conversations[index].title = this.editingTitle
					}
					
					this.closeEditTitleModal()
					
					uni.showToast({
						title: '标题已更新',
						icon: 'success',
						duration: 1500
					})
					
				} catch (error) {
					console.error('更新标题失败:', error)
					uni.showToast({
						title: '更新失败',
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			// 关闭编辑标题弹窗
			closeEditTitleModal() {
				this.showEditTitleModal = false
				this.editingConversation = null
				this.editingTitle = ''
			},
			
			// 切换历史面板
			toggleHistoryPanel() {
				this.showHistoryPanel = !this.showHistoryPanel
				if (this.showHistoryPanel) {
					this.loadConversations()
					this.loadConversationStats()
				}
			},
			
			// 格式化日期
			formatDate(dateString) {
				const date = new Date(dateString)
				const now = new Date()
				const diff = now - date
				
				if (diff < 24 * 60 * 60 * 1000) {
					// 今天
					return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
				} else if (diff < 7 * 24 * 60 * 60 * 1000) {
					// 一周内
					const days = Math.floor(diff / (24 * 60 * 60 * 1000))
					return `${days}天前`
				} else {
					// 更早
					return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
				}
			},
			
			// 获取角色名称
			getRoleName(roleId) {
				const role = this.roles.find(r => r.id === roleId)
				return role ? role.name : '未知角色'
			},
			
			// 获取风格名称
			getStyleName(styleId) {
				const style = this.styles.find(s => s.id === styleId)
				return style ? style.name : '未知风格'
			},
			
			// 加载用户偏好设置
			loadUserPreferences() {
				try {
					const savedRole = uni.getStorageSync('ai_role')
					const savedStyle = uni.getStorageSync('ai_style')
					
					// 确保currentRole始终有值
					if (savedRole) {
						const role = this.roles.find(r => r.id === savedRole)
						this.currentRole = role || this.roles[0] // 如果找不到，使用默认角色
					} else {
						this.currentRole = this.roles[0] // 使用默认角色
					}
					
					// 确保currentStyle始终有值
					if (savedStyle) {
						const style = this.styles.find(s => s.id === savedStyle)
						this.currentStyle = style || this.styles[0] // 如果找不到，使用默认风格
					} else {
						this.currentStyle = this.styles[0] // 使用默认风格
					}
				} catch (e) {
					console.log('加载用户偏好失败', e)
					// 设置默认值
					this.currentRole = this.roles[0]
					this.currentStyle = this.styles[0]
				}
			},
			
			// 选择角色
			selectRole(roleId) {
				const role = this.roles.find(r => r.id === roleId)
				if (role) {
					this.currentRole = role
					uni.setStorageSync('ai_role', roleId)
					
					// 角色切换后的问候语
					this.addRoleGreeting()
				}
			},
			
			// 选择风格
			selectStyle(styleId) {
				const style = this.styles.find(s => s.id === styleId)
				if (style) {
					this.currentStyle = style
					uni.setStorageSync('ai_style', styleId)
				}
			},
			
			// 角色切换问候语
			addRoleGreeting() {
				const greetings = {
					companion: '你好！我是你的心灵伙伴，我会用温暖的心倾听你的每一个故事。有什么想和我分享的吗？',
					advisor: '您好！我是您的专业心理顾问，我将用专业的知识为您提供理性的分析和建议。请告诉我您的情况。'
				}
				
				this.messages.push({
					role: 'assistant',
					content: greetings[this.currentRole.id]
				})
				
				this.$nextTick(() => {
					this.scrollTop = 99999
				})
			},
			
			// 显示虚拟人功能预览
			showVirtualHumanPreview() {
				this.showVirtualHumanModal = true
			},
			
			// 关闭虚拟人功能预览
			closeVirtualHumanModal() {
				this.showVirtualHumanModal = false
			},
			
			async sendMessage() {
				if (!this.inputText.trim()) return
				
				// 如果没有当前对话，先创建
				if (!this.currentConversationId) {
					await this.createNewConversation()
				}
				
				// 添加用户消息
				this.messages.push({
					role: 'user',
					content: this.inputText
				})
				
				// 保存用户消息到数据库
				try {
					await conversationService.saveMessage(
						this.currentConversationId,
						'user',
						this.inputText
					)
				} catch (error) {
					console.error('保存用户消息失败:', error)
				}
				
				const userMessage = this.inputText
				this.inputText = ''
				this.isLoading = true
				
				// 滚动到最新消息
				this.$nextTick(() => {
					this.scrollTop = 99999
				})
				
				try {
					// 优先尝试调用Dify API获取真实AI回复
					const aiResponse = await this.callDifyAPI(userMessage)
					
					// 添加AI回复到消息列表
					this.messages.push({
						role: 'assistant',
						content: aiResponse
					})
					
					// 保存AI回复到数据库
					try {
						await conversationService.saveMessage(
							this.currentConversationId,
							'assistant',
							aiResponse
						)
					} catch (error) {
						console.error('保存AI消息失败:', error)
					}
					
					// 显示成功提示
					uni.showToast({
						title: 'AI回复已生成',
						icon: 'success',
						duration: 1500
					})
					
				} catch (error) {
					console.error('Dify API调用失败:', error)
					
					// 根据错误类型显示不同的提示信息
					let errorTitle = '网络异常'
					let errorMessage = '使用本地回复'
					
					if (error.message.includes('超时')) {
						errorTitle = '请求超时'
						errorMessage = '网络连接较慢，请稍后重试'
					} else if (error.message.includes('网络连接异常')) {
						errorTitle = '网络连接异常'
						errorMessage = '请检查网络设置后重试'
					} else if (error.message.includes('SSL')) {
						errorTitle = '安全连接失败'
						errorMessage = '请检查网络环境或切换网络'
					} else if (error.message.includes('API请求格式错误')) {
						errorTitle = '配置错误'
						errorMessage = '请检查API配置参数'
					} else if (error.message.includes('API密钥无效')) {
						errorTitle = '认证失败'
						errorMessage = '请检查API密钥配置'
					}
					
					// API调用失败时，使用模拟回复作为降级方案
					const fallbackResponse = this.generateAIResponse(userMessage)
					
					this.messages.push({
						role: 'assistant',
						content: fallbackResponse
					})
					
					// 保存降级回复到数据库
					try {
						await conversationService.saveMessage(
							this.currentConversationId,
							'assistant',
							fallbackResponse
						)
					} catch (error) {
						console.error('保存降级消息失败:', error)
					}
					
					// 显示详细的错误提示
					uni.showToast({
						title: `${errorTitle}，${errorMessage}`,
						icon: 'none',
						duration: 3000
					})
				} finally {
					// 无论成功失败，都隐藏加载状态
					this.isLoading = false
					
					// 滚动到最新消息
					this.$nextTick(() => {
						this.scrollTop = 99999
					})
				}
			},
			
			// 调用Dify API获取AI回复
			callDifyAPI(userMessage) {
				return new Promise((resolve, reject) => {
					// 构建结构化输入数据，使用Dify变量系统传递角色信息
					const inputs = {
						query: userMessage,
						role: this.currentRole.name,
						role_description: this.currentRole.description,
						style: this.currentStyle.name,
						system_prompt: `你是一个${this.currentRole.name}，请以${this.currentStyle.name}的风格回复用户。你的角色描述是：${this.currentRole.description}`
					}
					
					// 添加超时机制
					const timeout = setTimeout(() => {
						reject(new Error('请求超时，请检查网络连接'))
					}, 10000) // 10秒超时
					
					// 调试信息
					console.log('Dify API配置:', this.difyConfig)
					console.log('完整URL:', this.difyConfig.apiUrl + this.difyConfig.endpoint)
					console.log('结构化输入数据:', inputs)
					
					uni.request({
						url: this.difyConfig.apiUrl + this.difyConfig.endpoint,
						method: 'POST',
						timeout: 10000, // 10秒超时
						header: {
							// 尝试不同的认证方式
							'Authorization': 'Bearer ' + this.difyConfig.apiKey,
							// 或者尝试使用API密钥直接作为Bearer token
							// 'Authorization': 'Bearer ' + this.difyConfig.apiKey.replace('app-', ''),
							'Content-Type': 'application/json'
						},
						data: {
							// 使用Dify变量系统传递结构化数据
							inputs: inputs,
							// 同时提供query字段保持向后兼容
							query: userMessage,
							response_mode: 'blocking',
							user: 'heart-harbor-user'
						},
						success: (res) => {
							clearTimeout(timeout)
							console.log('Dify API响应:', res)
							
							// 网络连接检查
							if (res.statusCode === 0) {
								reject(new Error('网络连接异常，请检查网络设置'))
								return
							}
							
							if (res.statusCode === 200 && res.data) {
								// 提取AI回复内容，适配不同的响应格式
								let aiResponse = '我收到了你的消息，正在思考如何回复...'
								
								if (res.data.answer) {
									aiResponse = res.data.answer
								} else if (res.data.message) {
									aiResponse = res.data.message
								} else if (res.data.data && res.data.data.answer) {
									aiResponse = res.data.data.answer
								} else if (typeof res.data === 'string') {
									aiResponse = res.data
								}
								
								// 确保回复内容不为空
								if (!aiResponse || aiResponse.trim() === '') {
									aiResponse = '我理解你的感受，但需要更多信息来提供更好的帮助。可以详细说说吗？'
								}
								
								resolve(aiResponse)
							} else if (res.statusCode === 400) {
								// 更详细的400错误处理
								let errorDetail = 'API请求格式错误'
								if (res.data && res.data.message) {
									errorDetail += `: ${res.data.message}`
								}
								reject(new Error(errorDetail))
							} else if (res.statusCode === 401) {
								reject(new Error('API密钥无效，请检查配置'))
							} else if (res.statusCode === 403) {
								reject(new Error('API访问被拒绝，请检查权限'))
							} else if (res.statusCode === 404) {
								reject(new Error('API接口不存在，请检查URL配置'))
							} else if (res.statusCode >= 500) {
								reject(new Error('服务器内部错误，请稍后重试'))
							} else {
								reject(new Error(`API返回异常状态码: ${res.statusCode}`))
							}
						},
						fail: (err) => {
							clearTimeout(timeout)
							console.error('Dify API调用失败:', err)
							
							// 更详细的错误分类
							let errorMessage = '网络请求失败'
							
							if (err.errMsg) {
								if (err.errMsg.includes('timeout')) {
									errorMessage = '请求超时，请检查网络连接'
								} else if (err.errMsg.includes('network')) {
									errorMessage = '网络连接异常，请检查网络设置'
								} else if (err.errMsg.includes('abort')) {
									errorMessage = '请求被取消'
								} else if (err.errMsg.includes('SSL')) {
									errorMessage = 'SSL证书验证失败，请检查网络环境'
								}
							}
							
							reject(new Error(errorMessage))
						}
					})
				})
			},
			
			// 根据角色和风格生成AI回复
			generateAIResponse(userMessage) {
				// 基础回复模板
				const baseResponses = {
					companion: {
						friendly: {
							pressure: '亲爱的，感受到你有些压力呢～这很正常哦！可以试试深呼吸放松一下，或者和我聊聊具体是什么让你感到压力？😊',
							happy: '真为你感到高兴！保持积极的心态很重要呢～愿意和我分享更多让你开心的事情吗？💖',
							sad: '听到你难过我也感到心疼呢。情绪波动是正常的，重要的是给自己时间和空间去感受和处理这些情绪。抱抱你～'
						},
						professional: {
							pressure: '我注意到您提到了一些压力感受。压力是常见的心理反应，建议您可以尝试一些放松技巧，比如深呼吸或渐进式肌肉放松。',
							happy: '为您感到高兴。积极情绪对心理健康有重要影响，建议继续保持这种积极状态。',
							sad: '理解您的情绪感受。情绪波动是正常的心理现象，建议给自己适当的情绪调节空间。'
						},
						encouraging: {
							pressure: '感受到你的压力，但请相信你有能力应对！每一次挑战都是成长的机会，加油！🌟',
							happy: '真棒！继续保持这种积极的状态，你的快乐也会感染身边的人！',
							sad: '难过的时候请记得，你并不孤单。每一次情绪波动都是自我了解的机会，相信你会变得更强大！'
						},
						casual: {
							pressure: '哈哈，压力山大啊？放松点，生活就是这样，有起有落～聊聊看具体啥情况？😄',
							happy: '哇，听起来不错嘛！开心的事情要多多分享，让快乐加倍！',
							sad: '哎，有时候确实会有点down呢。不过没关系，说出来就好多了，我在这儿听着呢～'
						}
					},
					advisor: {
						friendly: {
							pressure: '您好！从您的描述中我感受到一些压力。作为专业顾问，我建议您可以尝试认知行为疗法中的一些技巧来管理压力。',
							happy: '很高兴听到您的积极体验！积极情绪对心理健康有重要促进作用。',
							sad: '理解您的情绪困扰。从专业角度，建议您关注情绪调节策略的应用。'
						},
						professional: {
							pressure: '根据您的描述，建议采用压力管理三步骤：识别压力源、评估压力水平、实施应对策略。',
							happy: '积极情绪体验对心理健康具有正向影响，建议继续保持并记录积极事件。',
							sad: '情绪困扰需要系统评估，建议采用情绪日记进行追踪记录。'
						},
						encouraging: {
							pressure: '您展现出了很好的自我觉察能力！压力管理是一个学习过程，相信您能逐步掌握有效策略。',
							happy: '您的积极体验展示了良好的心理适应能力，这是心理健康的重要标志。',
							sad: '面对情绪困扰需要勇气，您已经迈出了重要一步。持续关注情绪健康会有积极回报。'
						},
						casual: {
							pressure: '压力这事儿，说大不大说小不小～关键是找到适合自己的调节方式，咱们一起分析分析？',
							happy: '不错嘛！积极情绪就像心理维生素，多多益善～',
							sad: '情绪有起伏很正常，重要的是学会和它们和平相处。有啥具体想聊的？'
						}
					}
				}
				
				// 根据关键词匹配回复类型
				let responseType = 'default'
				if (userMessage.includes('压力') || userMessage.includes('焦虑') || userMessage.includes('紧张')) {
					responseType = 'pressure'
				} else if (userMessage.includes('开心') || userMessage.includes('高兴') || userMessage.includes('愉快')) {
					responseType = 'happy'
				} else if (userMessage.includes('难过') || userMessage.includes('伤心') || userMessage.includes('沮丧')) {
					responseType = 'sad'
				}
				
				// 获取对应的回复
				const roleResponses = baseResponses[this.currentRole.id]
				const styleResponses = roleResponses[this.currentStyle.id]
				
				if (styleResponses && styleResponses[responseType]) {
					return styleResponses[responseType]
				}
				
				// 默认回复
				const defaultResponses = {
					companion: {
						friendly: '谢谢你的分享！我在这里倾听，如果你愿意，可以告诉我更多关于你的感受和想法。😊',
						professional: '感谢您的分享。我将基于专业角度为您提供分析建议。',
						encouraging: '感谢分享！每一次交流都是成长的机会，继续加油！🌟',
						casual: '哈哈，聊得不错嘛！还有什么想说的尽管来～😄'
					},
					advisor: {
						friendly: '感谢您的信任。作为专业顾问，我将为您提供理性的分析和建议。',
						professional: '收到您的信息。建议进一步详细描述具体情况以便精准分析。',
						encouraging: '感谢分享！专业咨询需要详细沟通，相信我们能找到有效解决方案。',
						casual: '好的，信息收到。咱们继续深入聊聊具体情况？'
					}
				}
				
				return defaultResponses[this.currentRole.id][this.currentStyle.id]
			}
		}
	}
</script>

<style scoped>
.ai-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
	padding: 20rpx;
}

/* 顶部功能区样式 - 优化后 */
.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 30rpx;
	padding: 25rpx 0;
	gap: 20rpx;
}

/* 虚拟人按钮 - 优化后 */
.virtual-human-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 18rpx 30rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 25rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.15);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-height: 80rpx;
	justify-content: center;
}

.virtual-human-btn:active {
	background: #E6F3FF;
	transform: scale(0.95);
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.2);
}

.virtual-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.virtual-text {
	font-size: 26rpx;
	color: #1890FF;
	font-weight: 600;
}

/* 当前设置显示 - 优化后 */
.current-settings {
	background: rgba(255, 255, 255, 0.95);
	padding: 18rpx 30rpx;
	border-radius: 25rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.15);
	min-height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	margin: 0 20rpx;
}

.settings-text {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
	text-align: center;
}

/* 对话操作按钮组 - 优化后 */
.conversation-actions {
	display: flex;
	gap: 15rpx;
	align-items: center;
}

.new-conversation-btn, .history-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 18rpx 25rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	border: 2rpx solid #E6F3FF;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-height: 80rpx;
	justify-content: center;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.15);
}

.new-conversation-btn:active, .history-btn:active {
	background: #E6F3FF;
	transform: scale(0.95);
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.2);
}

.action-icon {
	font-size: 36rpx;
	margin-bottom: 8rpx;
}

.action-text {
	font-size: 24rpx;
	color: #1890FF;
	font-weight: 600;
}

.virtual-human-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 15rpx 25rpx;
	background: rgba(255, 255, 255, 0.8);
	border-radius: 20rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 4rpx 15rpx rgba(24, 144, 255, 0.1);
}

.virtual-icon {
	font-size: 36rpx;
	margin-bottom: 5rpx;
}

.virtual-text {
	font-size: 24rpx;
	color: #1890FF;
	font-weight: bold;
}

.coming-soon {
	font-size: 20rpx;
	color: #999;
	margin-top: 5rpx;
}

.current-settings {
	background: rgba(255, 255, 255, 0.9);
	padding: 15rpx 25rpx;
	border-radius: 20rpx;
	border: 2rpx solid #E6F3FF;
}

.settings-text {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
}

.conversation-actions {
	display: flex;
	gap: 15rpx;
}

.new-conversation-btn, .history-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 15rpx 20rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 15rpx;
	border: 2rpx solid #E6F3FF;
	transition: all 0.3s ease;
}

.new-conversation-btn:active, .history-btn:active {
	background: #E6F3FF;
	transform: scale(0.95);
}

.action-icon {
	font-size: 32rpx;
	margin-bottom: 5rpx;
}

.action-text {
	font-size: 22rpx;
	color: #1890FF;
	font-weight: 500;
}

/* 功能区标题 - 优化后 */
.section-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #1890FF;
	margin-bottom: 25rpx;
	text-align: center;
	position: relative;
}

.section-title::after {
	content: '';
	display: block;
	width: 60rpx;
	height: 4rpx;
	background: linear-gradient(90deg, #1890FF, #40A9FF);
	border-radius: 2rpx;
	margin: 10rpx auto 0;
}

/* 角色选择区样式 - 优化后 */
.role-section {
	margin-bottom: 35rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 25rpx;
	padding: 30rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 8rpx 30rpx rgba(24, 144, 255, 0.1);
	display: flex;
	flex-direction: column;
	align-items: center; /* 确保内容居中 */
}

.role-list {
	display: flex;
	white-space: nowrap;
	gap: 20rpx;
	padding: 10rpx 0;
	align-items: center;
	justify-content: center; /* 改为居中显示 */
	width: 100%; /* 确保宽度100% */
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.role-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 30rpx 40rpx;
	background: #F8F9FA;
	border-radius: 25rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 200rpx; /* 确保最小宽度 */
	max-width: 250rpx; /* 限制最大宽度 */
	cursor: pointer;
	position: relative;
	overflow: hidden;
	text-align: center;
	flex-shrink: 0; /* 防止按钮被压缩 */
}

/* 添加滚动条样式 */
.role-list::-webkit-scrollbar {
	height: 6rpx;
}

.role-list::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 3rpx;
}

.role-list::-webkit-scrollbar-thumb {
	background: #1890FF;
	border-radius: 3rpx;
}

.role-list::-webkit-scrollbar-thumb:hover {
	background: #40A9FF;
}

.role-item::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4rpx;
	background: linear-gradient(90deg, #1890FF, #40A9FF);
	transform: scaleX(0);
	transition: transform 0.3s ease;
}

.role-item.active {
	background: linear-gradient(135deg, #E6F3FF 0%, #D6EBFF 100%);
	border-color: #1890FF;
	transform: translateY(-8rpx);
	box-shadow: 0 12rpx 35rpx rgba(24, 144, 255, 0.25);
}

.role-item.active::before {
	transform: scaleX(1);
}

.role-item:active {
	transform: scale(0.98);
}

.role-icon {
	font-size: 56rpx;
	margin-bottom: 20rpx;
	transition: transform 0.3s ease;
}

.role-item.active .role-icon {
	transform: scale(1.1);
}

.role-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #333;
	margin-bottom: 12rpx;
}

.role-desc {
	font-size: 24rpx;
	color: #666;
	text-align: center;
	line-height: 1.4;
}

/* 风格设置区样式 - 优化后 */
.style-section {
	margin-bottom: 35rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 25rpx;
	padding: 30rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 8rpx 30rpx rgba(24, 144, 255, 0.1);
}

.style-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	justify-content: center;
}

.style-tag {
	display: flex;
	align-items: center;
	padding: 25rpx 30rpx;
	background: #F8F9FA;
	border-radius: 20rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 180rpx;
	justify-content: center;
	cursor: pointer;
	position: relative;
	overflow: hidden;
}

.style-tag::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3rpx;
	background: linear-gradient(90deg, #1890FF, #40A9FF);
	transform: scaleX(0);
	transition: transform 0.3s ease;
}

.style-tag.active {
	background: linear-gradient(135deg, #E6F3FF 0%, #D6EBFF 100%);
	border-color: #1890FF;
	transform: translateY(-5rpx);
	box-shadow: 0 10rpx 30rpx rgba(24, 144, 255, 0.2);
}

.style-tag.active::before {
	transform: scaleX(1);
}

.style-tag:active {
	transform: scale(0.98);
}

.style-icon {
	font-size: 36rpx;
	margin-right: 15rpx;
	transition: transform 0.3s ease;
}

.style-tag.active .style-icon {
	transform: scale(1.1);
}

.style-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

/* 聊天容器样式 - 优化后 */
.chat-container {
	background: #fff;
	border-radius: 25rpx;
	padding: 35rpx;
	height: calc(100vh - 650rpx);
	display: flex;
	flex-direction: column;
	box-shadow: 0 8rpx 35rpx rgba(24, 144, 255, 0.15);
	border: 2rpx solid #E6F3FF;
}

.message-list {
	flex: 1;
	margin-bottom: 35rpx;
	padding: 10rpx 0;
}

.message-item {
	display: flex;
	margin-bottom: 35rpx;
	align-items: flex-start;
	animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes messageSlideIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.user-message {
	flex-direction: row-reverse;
}

.ai-message {
	flex-direction: row;
}

.avatar {
	width: 90rpx;
	height: 90rpx;
	border-radius: 50%;
	background: #E6F3FF;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	margin: 0 25rpx;
	box-shadow: 0 4rpx 15rpx rgba(24, 144, 255, 0.2);
	transition: transform 0.3s ease;
}

.message-item:hover .avatar {
	transform: scale(1.05);
}

.content {
	max-width: 75%;
	background: #F8F9FA;
	border-radius: 25rpx;
	padding: 25rpx;
	font-size: 30rpx;
	line-height: 1.6;
	position: relative;
	box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
}

.content::before {
	content: '';
	position: absolute;
	top: 20rpx;
	width: 0;
	height: 0;
	border: 10rpx solid transparent;
}

.ai-message .content::before {
	left: -20rpx;
	border-right-color: #F8F9FA;
}

.user-message .content::before {
	right: -20rpx;
	border-left-color: #1890FF;
}

.user-message .content {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.25);
}

/* 输入区域样式 - 优化后 */
.input-area {
	display: flex;
	gap: 25rpx;
	align-items: center;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 30rpx;
	padding: 20rpx 25rpx;
	border: 2rpx solid #E6F3FF;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.1);
}

.input {
	flex: 1;
	height: 90rpx;
	background: #F8F9FA;
	border: 2rpx solid #E6F3FF;
	border-radius: 45rpx;
	padding: 0 35rpx;
	font-size: 30rpx;
	transition: all 0.3s ease;
}

.input:focus {
	border-color: #1890FF;
	box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
}

.send-btn {
	width: 140rpx;
	height: 90rpx;
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	border-radius: 45rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.3);
}

.send-btn:active {
	transform: scale(0.95);
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.4);
}

/* 模态框样式 - 优化后 */
.modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalFadeIn {
	from {
		opacity: 0;
		backdrop-filter: blur(0px);
	}
	to {
		opacity: 1;
		backdrop-filter: blur(10px);
	}
}

.modal-content {
	background: white;
	border-radius: 35rpx;
	padding: 45rpx;
	margin: 40rpx;
	max-width: 650rpx;
	box-shadow: 0 15rpx 60rpx rgba(0, 0, 0, 0.4);
	animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2rpx solid #E6F3FF;
}

@keyframes modalSlideIn {
	from {
		transform: scale(0.8) translateY(50rpx);
		opacity: 0;
	}
	to {
		transform: scale(1) translateY(0);
		opacity: 1;
	}
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 35rpx;
	padding-bottom: 25rpx;
	border-bottom: 2rpx solid #F0F0F0;
}

.modal-title {
	font-size: 38rpx;
	font-weight: 700;
	color: #1890FF;
}

.modal-close {
	font-size: 42rpx;
	color: #999;
	padding: 15rpx;
	border-radius: 50%;
	transition: all 0.3s ease;
	background: #F8F9FA;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-close:active {
	background: #E6F3FF;
	transform: scale(0.9);
}

.modal-body {
	text-align: center;
}

.modal-text {
	display: block;
	font-size: 30rpx;
	color: #666;
	margin-bottom: 25rpx;
	line-height: 1.6;
}

.feature-preview {
	margin-top: 35rpx;
	padding: 30rpx;
	background: #F8F9FA;
	border-radius: 20rpx;
	border: 2rpx solid #E6F3FF;
}

.feature-item {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 18rpx;
	text-align: left;
	padding-left: 25rpx;
	position: relative;
}

.feature-item::before {
	content: '✓';
	position: absolute;
	left: 0;
	color: #1890FF;
	font-weight: bold;
}

.feature-item:last-child {
	margin-bottom: 0;
}

/* 历史记录面板样式 - 优化后 */
.history-panel {
	position: fixed;
	top: 0;
	right: -450rpx;
	width: 450rpx;
	height: 100vh;
	background: white;
	box-shadow: -8rpx 0 35rpx rgba(0, 0, 0, 0.15);
	transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 1000;
	display: flex;
	flex-direction: column;
}

.history-panel.active {
	right: 0;
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 35rpx 30rpx;
	border-bottom: 2rpx solid #F0F0F0;
	background: linear-gradient(135deg, #E6F3FF 0%, #F5F9FF 100%);
}

.history-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1890FF;
}

.history-stats {
	display: flex;
	gap: 20rpx;
}

.stat-item {
	font-size: 24rpx;
	color: #666;
	background: rgba(255, 255, 255, 0.8);
	padding: 8rpx 15rpx;
	border-radius: 10rpx;
}

.history-close {
	font-size: 38rpx;
	color: #999;
	padding: 15rpx;
	border-radius: 50%;
	transition: all 0.3s ease;
	background: rgba(255, 255, 255, 0.8);
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.history-close:active {
	background: #E6F3FF;
	transform: scale(0.9);
}

.history-list {
	flex: 1;
	height: calc(100vh - 140rpx);
	padding: 25rpx;
	overflow-y: auto;
}

.history-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	margin-bottom: 20rpx;
	background: #F8F9FA;
	border-radius: 20rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2rpx solid transparent;
	cursor: pointer;
	position: relative;
	overflow: hidden;
}

.history-item::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 6rpx;
	background: linear-gradient(180deg, #1890FF, #40A9FF);
	transform: scaleY(0);
	transition: transform 0.3s ease;
}

.history-item.active {
	background: linear-gradient(135deg, #E6F3FF 0%, #D6EBFF 100%);
	border-color: #1890FF;
	transform: translateX(-10rpx);
	box-shadow: 0 10rpx 30rpx rgba(24, 144, 255, 0.2);
}

.history-item.active::before {
	transform: scaleY(1);
}

.history-item:active {
	transform: scale(0.98);
}

.conversation-info {
	flex: 1;
	margin-right: 20rpx;
}

.conversation-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #333;
	margin-bottom: 12rpx;
	line-height: 1.3;
}

.conversation-meta {
	display: block;
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
}

.conversation-actions {
	display: flex;
	gap: 15rpx;
}

.action-btn {
	font-size: 26rpx;
	padding: 12rpx;
	border-radius: 10rpx;
	transition: all 0.3s ease;
	background: rgba(255, 255, 255, 0.8);
}

.action-btn:active {
	background: rgba(0, 0, 0, 0.1);
	transform: scale(0.9);
}

.delete-btn {
	color: #FF4D4F;
}

.edit-btn {
	color: #1890FF;
}

.empty-state {
	text-align: center;
	padding: 80rpx 30rpx;
}

.empty-icon {
	display: block;
	font-size: 90rpx;
	margin-bottom: 25rpx;
	opacity: 0.6;
}

.empty-text {
	display: block;
	font-size: 30rpx;
	color: #666;
	margin-bottom: 15rpx;
	font-weight: 600;
}

.empty-hint {
	display: block;
	font-size: 26rpx;
	color: #999;
}

/* 遮罩层样式 - 优化后 */
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 999;
	animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 编辑标题弹窗样式 - 优化后 */
.title-input {
	width: 100%;
	height: 90rpx;
	background: #F8F9FA;
	border: 2rpx solid #E6F3FF;
	border-radius: 20rpx;
	padding: 0 30rpx;
	font-size: 30rpx;
	margin-bottom: 35rpx;
	transition: all 0.3s ease;
}

.title-input:focus {
	border-color: #1890FF;
	box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
}

.modal-actions {
	display: flex;
	gap: 25rpx;
	justify-content: center;
}

.btn-cancel, .btn-confirm {
	padding: 25rpx 45rpx;
	border-radius: 20rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 120rpx;
}

.btn-cancel {
	background: #F8F9FA;
	color: #666;
	box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.btn-cancel:active {
	background: #E6F3FF;
	transform: scale(0.95);
}

.btn-confirm {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
	color: white;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.3);
}

.btn-confirm:active {
	transform: scale(0.95);
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.4);
}

/* 加载动画样式 - 优化后 */
.loading-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10rpx;
	padding: 20rpx;
}

.dot {
	font-size: 45rpx;
	color: #1890FF;
	animation: dot-bounce 1.4s infinite ease-in-out both;
	filter: drop-shadow(0 2rpx 4rpx rgba(24, 144, 255, 0.3));
}

.dot:nth-child(1) {
	animation-delay: -0.32s;
}

.dot:nth-child(2) {
	animation-delay: -0.16s;
}

@keyframes dot-bounce {
	0%, 80%, 100% {
		transform: scale(0.5);
		opacity: 0.5;
	}
	40% {
		transform: scale(1.2);
		opacity: 1;
	}
}

/* 响应式调整 - 优化后 */
@media (max-width: 750rpx) {
	.ai-page {
		padding: 15rpx;
	}
	
	.top-bar {
		flex-direction: column;
		gap: 25rpx;
		padding: 20rpx 0;
	}
	
	.virtual-human-btn, .current-settings, .new-conversation-btn, .history-btn {
		min-height: 70rpx;
		padding: 15rpx 25rpx;
	}
	
	.current-settings {
		margin: 0;
		order: 1;
		width: 100%;
	}
	
	.conversation-actions {
		justify-content: space-between;
		width: 100%;
		order: 2;
	}
	
	.role-section, .style-section {
		padding: 25rpx;
		margin-bottom: 25rpx;
	}
	
	/* 小屏幕角色选择优化 */
	.role-list {
		gap: 15rpx; /* 小屏幕减小间距 */
		justify-content: flex-start; /* 小屏幕左对齐，便于滚动 */
	}
	
	.role-item {
		min-width: 180rpx; /* 小屏幕适当减小宽度 */
		max-width: 220rpx;
		padding: 25rpx 30rpx;
	}
	
	.style-tag {
		min-width: 150rpx;
		padding: 20rpx 25rpx;
	}
	
	.chat-container {
		padding: 25rpx;
		height: calc(100vh - 550rpx);
	}
	
	.avatar {
		width: 75rpx;
		height: 75rpx;
		font-size: 35rpx;
		margin: 0 15rpx;
	}
	
	.content {
		max-width: 80%;
		padding: 20rpx;
		font-size: 28rpx;
	}
	
	.input-area {
		padding: 15rpx 20rpx;
	}
	
	.input {
		height: 80rpx;
		font-size: 28rpx;
		padding: 0 25rpx;
	}
	
	.send-btn {
		width: 120rpx;
		height: 80rpx;
		font-size: 28rpx;
	}
	
	.history-panel {
		width: 85%;
		right: -85%;
	}
	
	.modal-content {
		margin: 30rpx;
		padding: 35rpx;
	}
	
	.feature-item {
		font-size: 26rpx;
	}
}
</style>