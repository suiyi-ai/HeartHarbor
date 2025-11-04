const fs = require('fs')
const chalk = require('chalk')

console.log(chalk.blue('🔍 检查环境配置...'))

// 检查必要的环境变量
const requiredEnvVars = [
  'NODE_ENV',
  'UNI_PLATFORM'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.warn(chalk.yellow(`⚠️ 缺少环境变量: ${missingVars.join(', ')}`))
  console.log(chalk.blue('💡 建议: 创建 .env 文件并设置必要的环境变量'))
} else {
  console.log(chalk.green('✅ 环境变量配置正常'))
}

// 检查配置文件
const configFiles = [
  'package.json',
  'manifest.json',
  'pages.json',
  'project.config.json'
]

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(chalk.green(`✅ ${file} 存在`))
  } else {
    console.error(chalk.red(`❌ ${file} 不存在`))
  }
})

// 检查依赖
console.log(chalk.blue('📦 检查依赖...'))

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requiredDeps = ['vue', '@vue/cli-service']

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(chalk.green(`✅ ${dep}: ${packageJson.dependencies[dep]}`))
  } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(chalk.green(`✅ ${dep}: ${packageJson.devDependencies[dep]}`))
  } else {
    console.error(chalk.red(`❌ ${dep} 未安装`))
  }
})

console.log(chalk.green('🎉 环境检查完成！'))