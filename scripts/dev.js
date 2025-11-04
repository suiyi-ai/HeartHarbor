const { exec } = require('child_process')
const chalk = require('chalk')

console.log(chalk.blue('🚀 启动 HeartHarborx 开发环境...'))

// 检查环境变量
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

if (!process.env.UNI_PLATFORM) {
  process.env.UNI_PLATFORM = 'mp-weixin'
}

console.log(chalk.green(`📱 平台: ${process.env.UNI_PLATFORM}`))
console.log(chalk.green(`🔧 环境: ${process.env.NODE_ENV}`))

// 启动开发服务器
const devProcess = exec('npm run dev:mp-weixin', (error, stdout, stderr) => {
  if (error) {
    console.error(chalk.red(`❌ 启动失败: ${error}`))
    return
  }
  
  if (stderr) {
    console.error(chalk.yellow(`⚠️ 警告: ${stderr}`))
  }
  
  console.log(chalk.green(`✅ 开发服务器已启动`))
  console.log(stdout)
})

devProcess.stdout.on('data', (data) => {
  console.log(data.toString())
})

devProcess.stderr.on('data', (data) => {
  console.error(chalk.red(data.toString()))
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 正在关闭开发服务器...'))
  devProcess.kill('SIGINT')
  process.exit(0)
})