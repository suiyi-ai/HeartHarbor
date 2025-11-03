// 测试Supabase连接和功能
const SUPABASE_CONFIG = {
  url: 'https://etvdmnsernfiegfeadad.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY'
}

// 测试Supabase连接
async function testSupabaseConnection() {
  console.log('正在测试Supabase连接...')
  
  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/conversations?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase连接成功！')
      const data = await response.json()
      console.log('当前对话数量:', data.length)
      return true
    } else {
      console.log('❌ Supabase连接失败:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Supabase连接异常:', error.message)
    return false
  }
}

// 测试创建对话
async function testCreateConversation() {
  console.log('\n正在测试创建对话...')
  
  // 生成有效的UUID格式的用户ID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  const testData = {
    user_id: generateUUID(),
    title: '测试对话',
    role_id: 'companion',
    style_id: 'friendly',
    is_active: true
  }
  
  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/conversations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 对话创建成功！ID:', data[0].id)
      return data[0].id
    } else {
      const errorText = await response.text()
      console.log('❌ 对话创建失败:', response.status, response.statusText)
      console.log('错误详情:', errorText)
      return null
    }
  } catch (error) {
    console.log('❌ 对话创建异常:', error.message)
    return null
  }
}

// 运行测试
async function runTests() {
  console.log('=== Supabase功能测试 ===')
  
  // 测试连接
  const connectionOk = await testSupabaseConnection()
  
  if (connectionOk) {
    // 测试创建对话
    const conversationId = await testCreateConversation()
    
    if (conversationId) {
      console.log('\n✅ 所有测试通过！新对话和历史记录功能已准备就绪。')
    }
  }
  
  console.log('\n=== 测试完成 ===')
}

// 如果直接在Node.js环境中运行
if (typeof window === 'undefined') {
  runTests()
}

// 导出测试函数供其他模块使用
module.exports = {
  testSupabaseConnection,
  testCreateConversation,
  runTests
}