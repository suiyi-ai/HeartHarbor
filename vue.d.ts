// Vue 全局类型声明文件
// 用于解决 Vue 全局类型文件警告

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

// UniApp 相关类型声明
declare module '@dcloudio/uni-app' {
  // 空声明，避免类型检查错误
}

declare module '@dcloudio/uni-mp-weixin' {
  // 空声明，避免类型检查错误
}