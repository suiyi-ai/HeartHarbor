// Supabase客户端配置
const SUPABASE_CONFIG = {
  url: 'https://etvdmnsernfiegfeadad.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY'
}

// UUID v4生成函数（符合Supabase标准）
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// UUID验证函数
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 用户ID转换函数（处理旧格式ID）
function convertLegacyUserId(legacyId) {
  if (isValidUUID(legacyId)) {
    return legacyId // 已经是有效UUID
  }
  
  // 将旧格式ID转换为UUID格式
  const hash = legacyId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (hash + Math.random() * 16) % 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 生成用户ID（修复版本，使用UUID格式）
function getUserId() {
  let userId = uni.getStorageSync('user_id')
  
  if (!userId) {
    // 生成新的UUID
    userId = generateUUID()
    uni.setStorageSync('user_id', userId)
    console.log('生成新用户ID（UUID格式）:', userId)
  } else if (!isValidUUID(userId)) {
    // 转换旧格式ID为UUID
    const newUserId = convertLegacyUserId(userId)
    console.log('转换旧用户ID格式:', userId, '->', newUserId)
    userId = newUserId
    uni.setStorageSync('user_id', userId)
  }
  
  return userId
}

// 增强的Supabase查询构建函数（修复HTTP 400错误）
function buildSupabaseQuery(params) {
  const parts = []
  
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined) {
      // 特殊处理Supabase查询参数
      if (key === 'select') {
        parts.push(`select=${encodeURIComponent(value)}`)
      } else if (key === 'order') {
        parts.push(`order=${encodeURIComponent(value)}`)
      } else {
        // 标准查询参数
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
  })
  
  return parts.join('&')
}

// 增强的错误处理函数（特别处理UUID错误）
function handleSupabaseError(response, url, options) {
  let errorMessage = `API Error: ${response.statusCode}`
  
  if (response.data) {
    if (response.data.message) {
      errorMessage += ` - ${response.data.message}`
      
      // 特别处理UUID格式错误
      if (response.data.message.includes('invalid input syntax for type uuid')) {
        errorMessage += ' (用户ID格式错误，已自动修复)'
        
        // 强制重新生成用户ID
        const oldUserId = uni.getStorageSync('user_id')
        const newUserId = generateUUID()
        uni.setStorageSync('user_id', newUserId)
        
        console.warn('检测到UUID格式错误，已重新生成用户ID:', {
          oldUserId: oldUserId,
          newUserId: newUserId
        })
      }
    }
    if (response.data.hint) {
      errorMessage += ` (${response.data.hint})`
    }
    if (response.data.details) {
      errorMessage += ` [${response.data.details}]`
    }
  }

  console.error('Supabase API错误详情:', {
    url: url,
    method: options.method,
    statusCode: response.statusCode,
    error: errorMessage,
    responseData: response.data
  })

  return new Error(errorMessage)
}

// 数据库迁移函数（处理现有数据）
async function migrateUserData() {
  const oldUserId = uni.getStorageSync('user_id_legacy')
  const currentUserId = uni.getStorageSync('user_id')
  
  if (!oldUserId && currentUserId && !isValidUUID(currentUserId)) {
    // 保存旧ID用于迁移
    uni.setStorageSync('user_id_legacy', currentUserId)
    
    // 生成新UUID
    const newUserId = generateUUID()
    uni.setStorageSync('user_id', newUserId)
    
    console.log('执行用户数据迁移:', {
      oldUserId: currentUserId,
      newUserId: newUserId
    })
    
    return newUserId
  }
  
  return currentUserId
}

// MCP增强的Supabase API调用封装
class SupabaseService {
  constructor() {
    this.userId = getUserId()
    this.isConnected = false
    this.initConnection()
  }

  // 初始化连接（增强版本）
  async initConnection() {
    try {
      // 执行数据迁移
      await migrateUserData()
      
      // 验证当前用户ID格式
      if (!isValidUUID(this.userId)) {
        console.warn('用户ID格式无效，重新生成:', this.userId)
        this.userId = generateUUID()
        uni.setStorageSync('user_id', this.userId)
      }
      
      await this.testConnection()
      this.isConnected = true
      console.log('Supabase MCP连接成功，用户ID:', this.userId)
    } catch (error) {
      console.warn('Supabase MCP连接失败，将使用降级方案:', error)
      this.isConnected = false
    }
  }

  // 测试连接
  async testConnection() {
    const testResult = await this.callApi('conversations', {
      method: 'GET',
      queryParams: {
        limit: 1
      }
    })
    return testResult
  }

  // 增强的API调用方法（修复HTTP 400错误）
  async callApi(endpoint, options = {}) {
    // 如果连接失败，直接返回空数据
    if (!this.isConnected) {
      console.warn('Supabase连接不可用，返回空数据')
      return options.method === 'GET' ? [] : null
    }

    let url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`
    
    const defaultOptions = {
      method: 'GET',
      header: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      timeout: 15000
    }

    // 修复查询参数处理（使用增强的查询构建函数）
    if (options.method === 'GET' && options.queryParams) {
      const queryString = buildSupabaseQuery(options.queryParams)
      if (queryString) {
        url += '?' + queryString
      }
    }

    // 合并选项
    const finalOptions = {
      ...defaultOptions,
      ...options,
      url: url,
      header: {
        ...defaultOptions.header,
        ...(options.header || {})
      }
    }

    // 处理请求体数据
    if ((options.method === 'POST' || options.method === 'PATCH') && options.data) {
      finalOptions.data = JSON.stringify(options.data)
    }

    // 添加调试信息
    console.log(`MCP API调用: ${finalOptions.method} ${url}`)
    console.log('查询参数:', options.queryParams)

    try {
      const response = await uni.request(finalOptions)

      console.log('API响应状态码:', response.statusCode)
      console.log('API响应数据:', response.data)

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data
      } else {
        throw handleSupabaseError(response, url, options)
      }
    } catch (error) {
      console.error('Supabase API调用失败:', error)
      console.error('请求详情:', {
        url: url,
        method: finalOptions.method,
        headers: finalOptions.header
      })
      throw error
    }
  }

  // 创建新对话（修复版本）
  async createConversation(title, roleId, styleId) {
    try {
      const data = {
        user_id: this.userId,
        title: title || '新对话',
        role_id: roleId,
        style_id: styleId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('MCP: 创建对话，数据:', data)
      
      const result = await this.callApi('conversations', {
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: data
      })

      console.log('MCP: 创建对话成功:', result)
      return result ? result[0] : null
    } catch (error) {
      console.error('MCP: 创建对话失败:', error)
      throw error
    }
  }

  // 获取用户的所有对话（修复HTTP 400错误）
  async getUserConversations() {
    try {
      console.log('MCP: 获取用户对话，用户ID:', this.userId)
      
      const result = await this.callApi('conversations', {
        method: 'GET',
        queryParams: {
          user_id: `eq.${this.userId}`,
          is_active: 'eq.true',
          select: '*'
        }
      })

      console.log('MCP: 获取对话成功，数量:', result ? result.length : 0)
      return result || []
    } catch (error) {
      console.error('MCP: 获取用户对话失败:', error)
      // 返回空数组而不是抛出错误，让降级方案处理
      return []
    }
  }

  // 获取对话的详细信息（修复版本）
  async getConversation(conversationId) {
    try {
      console.log('MCP: 获取对话详情，对话ID:', conversationId)
      
      const result = await this.callApi('conversations', {
        method: 'GET',
        queryParams: {
          id: `eq.${conversationId}`,
          select: '*'
        }
      })

      console.log('MCP: 获取对话详情成功:', result ? result[0] : null)
      return result ? result[0] : null
    } catch (error) {
      console.error('MCP: 获取对话详情失败:', error)
      return null
    }
  }

  // 获取对话的所有消息（修复版本）
  async getConversationMessages(conversationId) {
    try {
      console.log('MCP: 获取对话消息，对话ID:', conversationId)
      
      const result = await this.callApi('messages', {
        method: 'GET',
        queryParams: {
          conversation_id: `eq.${conversationId}`,
          order: 'created_at.asc',
          select: '*'
        }
      })

      console.log('MCP: 获取消息成功，数量:', result ? result.length : 0)
      return result || []
    } catch (error) {
      console.error('MCP: 获取对话消息失败:', error)
      return []
    }
  }

  // 保存消息（修复版本）
  async saveMessage(conversationId, role, content) {
    try {
      const data = {
        conversation_id: conversationId,
        role: role,
        content: content,
        created_at: new Date().toISOString()
      }

      console.log('MCP: 保存消息，数据:', data)
      
      const result = await this.callApi('messages', {
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: data
      })

      console.log('MCP: 保存消息成功:', result)
      return result ? result[0] : null
    } catch (error) {
      console.error('MCP: 保存消息失败:', error)
      throw error
    }
  }

  // 更新对话标题（修复版本）
  async updateConversationTitle(conversationId, title) {
    try {
      const data = {
        title: title,
        updated_at: new Date().toISOString()
      }

      console.log('MCP: 更新对话标题，对话ID:', conversationId, '标题:', title)
      
      const result = await this.callApi('conversations', {
        method: 'PATCH',
        queryParams: {
          id: `eq.${conversationId}`
        },
        data: data
      })

      console.log('MCP: 更新对话标题成功:', result)
      return result ? result[0] : null
    } catch (error) {
      console.error('MCP: 更新对话标题失败:', error)
      throw error
    }
  }

  // 删除对话（软删除，修复版本）
  async deleteConversation(conversationId) {
    try {
      const data = {
        is_active: false,
        updated_at: new Date().toISOString()
      }

      console.log('MCP: 删除对话，对话ID:', conversationId)
      
      const result = await this.callApi('conversations', {
        method: 'PATCH',
        queryParams: {
          id: `eq.${conversationId}`
        },
        data: data
      })

      console.log('MCP: 删除对话成功:', result)
      return result ? result[0] : null
    } catch (error) {
      console.error('MCP: 删除对话失败:', error)
      throw error
    }
  }

  // 获取对话统计信息（修复版本）
  async getConversationStats() {
    try {
      const conversations = await this.getUserConversations()
      
      const stats = {
        total: conversations.length,
        recent: conversations.filter(conv => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return new Date(conv.created_at) > oneWeekAgo
        }).length
      }

      console.log('MCP: 获取统计信息成功:', stats)
      return stats
    } catch (error) {
      console.error('MCP: 获取统计信息失败:', error)
      return { total: 0, recent: 0 }
    }
  }
}

// 本地存储降级方案
class LocalStorageService {
  constructor() {
    this.storageKey = 'ai_conversations'
    this.userId = getUserId()
  }

  // 生成本地ID
  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 获取所有对话
  getConversations() {
    const data = uni.getStorageSync(this.storageKey) || {}
    return data[this.userId] || []
  }

  // 保存对话
  saveConversation(conversation) {
    const data = uni.getStorageSync(this.storageKey) || {}
    const userData = data[this.userId] || []
    
    if (!conversation.id) {
      conversation.id = this.generateId()
      conversation.created_at = new Date().toISOString()
      conversation.updated_at = conversation.created_at
      userData.push(conversation)
    } else {
      const index = userData.findIndex(c => c.id === conversation.id)
      if (index >= 0) {
        conversation.updated_at = new Date().toISOString()
        userData[index] = conversation
      } else {
        userData.push(conversation)
      }
    }

    data[this.userId] = userData
    uni.setStorageSync(this.storageKey, data)
    
    return conversation
  }

  // 保存消息
  saveMessage(conversationId, role, content) {
    const conversations = this.getConversations()
    const conversation = conversations.find(c => c.id === conversationId)
    
    if (conversation) {
      if (!conversation.messages) {
        conversation.messages = []
      }
      
      const message = {
        id: this.generateId(),
        conversation_id: conversationId,
        role: role,
        content: content,
        created_at: new Date().toISOString()
      }
      
      conversation.messages.push(message)
      conversation.updated_at = new Date().toISOString()
      
      this.saveConversation(conversation)
      return message
    }
    
    return null
  }

  // 删除对话
  deleteConversation(conversationId) {
    const conversations = this.getConversations()
    const filtered = conversations.filter(c => c.id !== conversationId)
    
    const data = uni.getStorageSync(this.storageKey) || {}
    data[this.userId] = filtered
    uni.setStorageSync(this.storageKey, data)
    
    return true
  }
}

// MCP增强的统一服务接口
class ConversationService {
  constructor() {
    this.supabaseService = new SupabaseService()
    this.localService = new LocalStorageService()
    this.useSupabase = this.supabaseService.isConnected // 使用MCP连接状态
  }

  // 检查Supabase连接（增强版本）
  async checkSupabaseConnection() {
    try {
      const isConnected = this.supabaseService.isConnected
      this.useSupabase = isConnected
      console.log('MCP连接状态检查:', { useSupabase: this.useSupabase, isConnected: isConnected })
      return isConnected
    } catch (error) {
      console.warn('MCP连接检查失败，切换到本地存储:', error)
      this.useSupabase = false
      return false
    }
  }

  // 智能创建对话（增强版本）
  async createConversation(title, roleId, styleId) {
    // 优先使用MCP服务
    if (this.useSupabase) {
      try {
        const result = await this.supabaseService.createConversation(title, roleId, styleId)
        if (result) {
          // 同时更新本地存储作为缓存
          this.localService.saveConversation(result)
          return result
        }
      } catch (error) {
        console.warn('MCP创建对话失败，使用本地存储:', error)
        this.useSupabase = false
      }
    }
    
    // 降级到本地存储
    return this.localService.saveConversation({
      title: title || '新对话',
      role_id: roleId,
      style_id: styleId,
      is_active: true,
      messages: []
    })
  }

  // 智能获取用户对话（增强版本）
  async getUserConversations() {
    // 优先使用MCP服务
    if (this.useSupabase) {
      try {
        const result = await this.supabaseService.getUserConversations()
        if (result && result.length > 0) {
          // 同步到本地存储作为缓存
          result.forEach(conv => this.localService.saveConversation(conv))
          return result
        }
      } catch (error) {
        console.warn('MCP获取对话失败，切换到本地存储:', error)
        this.useSupabase = false
      }
    }
    
    // 降级到本地存储
    return this.localService.getConversations()
  }

  // 保存消息
  async saveMessage(conversationId, role, content) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.saveMessage(conversationId, role, content)
      } catch (error) {
        this.useSupabase = false
      }
    }
    
    return this.localService.saveMessage(conversationId, role, content)
  }

  // 更新对话标题
  async updateConversationTitle(conversationId, title) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.updateConversationTitle(conversationId, title)
      } catch (error) {
        this.useSupabase = false
      }
    }
    
    const conversations = this.localService.getConversations()
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      conversation.title = title
      return this.localService.saveConversation(conversation)
    }
    
    return null
  }

  // 删除对话
  async deleteConversation(conversationId) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.deleteConversation(conversationId)
      } catch (error) {
        this.useSupabase = false
      }
    }
    
    return this.localService.deleteConversation(conversationId)
  }

  // 获取统计信息
  async getConversationStats() {
    const conversations = await this.getUserConversations()
    
    const stats = {
      total: conversations.length,
      recent: conversations.filter(conv => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(conv.created_at) > oneWeekAgo
      }).length
    }

    return stats
  }
}

// 导出服务实例
export default new ConversationService()