const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

console.log(chalk.blue('🧹 清理构建文件...'))

const cleanPaths = [
  'unpackage/dist',
  'unpackage/build',
  'node_modules/.cache'
]

function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true })
      console.log(chalk.green(`✅ 已清理: ${dirPath}`))
    } catch (error) {
      console.error(chalk.red(`❌ 清理失败 ${dirPath}: ${error.message}`))
    }
  } else {
    console.log(chalk.yellow(`⚠️ 目录不存在: ${dirPath}`))
  }
}

cleanPaths.forEach(cleanPath => {
  const fullPath = path.resolve(__dirname, '..', cleanPath)
  cleanDirectory(fullPath)
})

console.log(chalk.green('🎉 清理完成！'))