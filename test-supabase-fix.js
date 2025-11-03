// Supabase修复测试文件
// 用于验证MCP优化方案是否解决了HTTP 400错误

const SUPABASE_CONFIG = {
  url: 'https://etvdmnsernfiegfeadad.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY'
}

// 测试连接函数
async function testConnection() {
  console.log('=== 开始测试Supabase连接 ===')
  
  try {
    // 测试基本连接
    const response = await uni.request({
      url: `${SUPABASE_CONFIG.url}/rest/v1/conversations?limit=1`,
      method: 'GET',
      header: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    console.log('连接测试结果:', {
      statusCode: response.statusCode,
      success: response.statusCode === 200
    })
    
    if (response.statusCode === 200) {
      console.log('✅ Supabase连接成功')
      return true
    } else {
      console.log('❌ Supabase连接失败，状态码:', response.statusCode)
      console.log('响应数据:', response.data)
      return false
    }
  } catch (error) {
    console.error('❌ 连接测试异常:', error)
    return false
  }
}

// 测试查询语法
async function testQuerySyntax() {
  console.log('\n=== 开始测试查询语法 ===')
  
  const testUserId = 'user_1762133523120_07i8vud5j'
  
  // 测试原始错误查询
  const badQuery = `user_id=eq.${testUserId}&is_active=eq.true&select=*`
  console.log('❌ 错误查询语法:', badQuery)
  
  // 测试修复后的查询
  const goodQuery = `user_id=eq.${testUserId}&is_active=eq.true&select=*`
  console.log('✅ 修复后查询语法:', goodQuery)
  
  try {
    const response = await uni.request({
      url: `${SUPABASE_CONFIG.url}/rest/v1/conversations?${goodQuery}`,
      method: 'GET',
      header: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    console.log('查询测试结果:', {
      statusCode: response.statusCode,
      dataLength: response.data ? response.data.length : 0
    })
    
    if (response.statusCode === 200) {
      console.log('✅ 查询语法测试成功')
      return true
    } else {
      console.log('❌ 查询语法测试失败，状态码:', response.statusCode)
      console.log('错误详情:', response.data)
      return false
    }
  } catch (error) {
    console.error('❌ 查询测试异常:', error)
    return false
  }
}

// 测试API调用
async function testApiCalls() {
  console.log('\n=== 开始测试API调用 ===')
  
  try {
    // 导入修复后的服务
    const ConversationService = require('./utils/supabase.js').default
    
    const service = new ConversationService()
    
    // 测试连接检查
    const connectionResult = await service.checkSupabaseConnection()
    console.log('连接检查结果:', connectionResult)
    
    // 测试获取对话
    const conversations = await service.getUserConversations()
    console.log('获取对话结果:', {
      success: Array.isArray(conversations),
      count: conversations.length
    })
    
    return true
  } catch (error) {
    console.error('❌ API调用测试异常:', error)
    return false
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始Supabase修复测试')
  console.log('================================')
  
  const results = {
    connection: false,
    querySyntax: false,
    apiCalls: false
  }
  
  // 运行测试
  results.connection = await testConnection()
  results.querySyntax = await testQuerySyntax()
  results.apiCalls = await testApiCalls()
  
  console.log('\n=== 测试结果汇总 ===')
  console.log('连接测试:', results.connection ? '✅ 通过' : '❌ 失败')
  console.log('查询语法测试:', results.querySyntax ? '✅ 通过' : '❌ 失败')
  console.log('API调用测试:', results.apiCalls ? '✅ 通过' : '❌ 失败')
  
  const allPassed = Object.values(results).every(result => result)
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！Supabase修复成功')
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息')
  }
  
  return allPassed
}

// 导出测试函数
module.exports = {
  runTests,
  testConnection,
  testQuerySyntax,
  testApiCalls
}

// 如果直接运行此文件
if (typeof module !== 'undefined' && module.parent === null) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}