const fs = require('fs')

console.log('🔍 检查 HeartHarborx 项目配置...')

// 检查必要的配置文件
const configFiles = [
  'package.json',
  'manifest.json',
  'pages.json',
  'project.config.json',
  'utils/supabase.js'
]

let allFilesExist = true

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 存在`)
  } else {
    console.error(`❌ ${file} 不存在`)
    allFilesExist = false
  }
})

// 检查 package.json
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  console.log('📦 项目信息:')
  console.log(`   名称: ${packageJson.name}`)
  console.log(`   版本: ${packageJson.version}`)
  console.log(`   描述: ${packageJson.description}`)
}

// 检查环境变量
console.log('🌍 环境变量:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV || '未设置'}`)
console.log(`   UNI_PLATFORM: ${process.env.UNI_PLATFORM || '未设置'}`)

if (allFilesExist) {
  console.log('🎉 项目配置检查完成！所有必要文件都存在。')
  console.log('💡 建议运行命令:')
  console.log('   npm install - 安装依赖')
  console.log('   npm run dev - 启动开发服务器')
  console.log('   npm run build - 构建生产版本')
} else {
  console.log('⚠️ 项目配置存在问题，请检查缺失的文件。')
}