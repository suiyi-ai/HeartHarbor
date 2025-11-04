// Supabase配置修复测试脚本
const SUPABASE_CONFIG = {
  url: "https://etvdmnsernfiegfeadad.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY"
};

// 测试Supabase连接
async function testSupabaseConnection() {
  console.log('🧪 开始测试Supabase连接...');
  
  try {
    // 测试REST API连接
    const url = `${SUPABASE_CONFIG.url}/rest/v1/conversations?limit=1`;
    const options = {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('📡 发送测试请求到:', url);
    
    const response = await fetch(url, options);
    console.log('✅ 连接测试响应状态码:', response.status);
    
    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      console.log('🎉 Supabase连接测试成功!');
      console.log('📊 响应数据:', data);
      return true;
    } else {
      console.error('❌ Supabase连接测试失败，状态码:', response.status);
      console.error('错误详情:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('💥 Supabase连接测试异常:', error.message);
    return false;
  }
}

// 验证配置信息
function validateConfig() {
  console.log('🔍 验证Supabase配置...');
  
  const configErrors = [];
  
  if (!SUPABASE_CONFIG.url) {
    configErrors.push('❌ Supabase URL未配置');
  } else if (!SUPABASE_CONFIG.url.startsWith('https://')) {
    configErrors.push('❌ Supabase URL格式错误，必须使用HTTPS');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    configErrors.push('❌ Supabase匿名密钥未配置');
  } else if (!SUPABASE_CONFIG.anonKey.startsWith('eyJ')) {
    configErrors.push('❌ Supabase匿名密钥格式可能错误');
  }
  
  if (configErrors.length === 0) {
    console.log('✅ Supabase配置验证通过');
    console.log('📋 配置详情:');
    console.log('   URL:', SUPABASE_CONFIG.url);
    console.log('   密钥:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
    return true;
  } else {
    console.error('❌ Supabase配置验证失败:');
    configErrors.forEach(error => console.error('   ', error));
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始Supabase配置修复验证测试\n');
  
  // 验证配置
  const configValid = validateConfig();
  if (!configValid) {
    console.log('\n💡 修复建议:');
    console.log('1. 检查.env文件中的Supabase配置');
    console.log('2. 确认Supabase项目是否已创建并激活');
    console.log('3. 验证API密钥是否正确');
    return;
  }
  
  console.log('\n---');
  
  // 测试连接
  const connectionTest = await testSupabaseConnection();
  
  console.log('\n---');
  console.log('📋 测试结果汇总:');
  console.log('✅ 配置验证:', configValid ? '通过' : '失败');
  console.log('✅ 连接测试:', connectionTest ? '通过' : '失败');
  
  if (configValid && connectionTest) {
    console.log('\n🎉 所有测试通过！Supabase配置修复成功！');
    console.log('💡 下一步建议:');
    console.log('1. 在小程序开发工具中重新编译项目');
    console.log('2. 检查小程序网络请求权限配置');
    console.log('3. 验证小程序中的Supabase功能');
  } else {
    console.log('\n❌ 部分测试失败，需要进一步排查问题');
    console.log('💡 排查建议:');
    console.log('1. 检查网络连接和防火墙设置');
    console.log('2. 确认Supabase项目域名已添加到小程序白名单');
    console.log('3. 检查小程序request域名配置');
  }
}

// 执行测试
runTests().catch(console.error);