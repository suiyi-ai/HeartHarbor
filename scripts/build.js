const { exec } = require('child_process')
const chalk = require('chalk')

console.log(chalk.blue('🏗️  开始构建 HeartHarborx...'))

// 设置生产环境变量
process.env.NODE_ENV = 'production'
process.env.UNI_PLATFORM = 'mp-weixin'

console.log(chalk.green(`📱 平台: ${process.env.UNI_PLATFORM}`))
console.log(chalk.green(`🔧 环境: ${process.env.NODE_ENV}`))

// 执行构建
const buildProcess = exec('npm run build:mp-weixin', (error, stdout, stderr) => {
  if (error) {
    console.error(chalk.red(`❌ 构建失败: ${error}`))
    process.exit(1)
  }
  
  if (stderr) {
    console.error(chalk.yellow(`⚠️ 警告: ${stderr}`))
  }
  
  console.log(chalk.green(`✅ 构建完成！`))
  console.log(stdout)
  
  // 显示构建结果
  console.log(chalk.blue('📦 构建输出目录: unpackage/dist/dev/mp-weixin'))
  console.log(chalk.blue('🎯 请使用微信开发者工具导入项目'))
})

buildProcess.stdout.on('data', (data) => {
  console.log(data.toString())
})

buildProcess.stderr.on('data', (data) => {
  console.error(chalk.red(data.toString()))
})