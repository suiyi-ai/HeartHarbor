<script>
	// 显式引用所有页面，确保代码依赖分析能够识别
	// 这样可以避免"过滤无依赖文件"功能导致的页面无法引用问题
	import '@/utils/pages.js'
	
	export default {
		onLaunch: function() {
			console.log('App Launch')
			
			// 全局错误处理：捕获并忽略微信小程序框架的 WebSocket 关闭代码错误
			// 这些错误通常来自框架内部，我们无法直接控制
			if (typeof uni !== 'undefined') {
				// 捕获未处理的错误
				uni.onError && uni.onError((error) => {
					// 忽略微信小程序框架的 WebSocket 关闭代码错误（1006）
					if (error) {
						const errorMsg = error.errMsg || error.message || String(error)
						if ((errorMsg.includes('closeSocket:fail') || 
							 errorMsg.includes('close') || 
							 errorMsg.includes('WebSocket')) &&
							errorMsg.includes('1006') &&
							(errorMsg.includes('is neither') || 
							 errorMsg.includes('must be either') ||
							 errorMsg.includes('The code must be'))) {
							console.warn('⚠️ 检测到微信小程序框架的 WebSocket 关闭代码错误（已完全忽略）:', errorMsg)
							// 完全忽略，不传播，不记录为错误
							return
						}
					}
					// 其他错误正常处理
					console.error('App Error:', error)
				})
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		onError: function(error) {
			// 全局错误处理
			// 忽略微信小程序框架的 WebSocket 关闭代码错误（1006）
			// 这些错误通常来自框架内部，当连接失败时框架可能自动尝试关闭连接
			if (error) {
				const errorMsg = error.errMsg || error.message || String(error)
				// 检查是否是 WebSocket 关闭代码错误（多种匹配方式）
				if ((errorMsg.includes('closeSocket:fail') || 
					 errorMsg.includes('close') || 
					 errorMsg.includes('WebSocket')) &&
					errorMsg.includes('1006') &&
					(errorMsg.includes('is neither') || 
					 errorMsg.includes('must be either') ||
					 errorMsg.includes('The code must be'))) {
					console.warn('⚠️ 检测到微信小程序框架的 WebSocket 关闭代码错误（已完全忽略）:', errorMsg)
					// 完全忽略这个错误，不传播，不记录为错误
					return false
				}
			}
			// 其他错误正常处理
			console.error('App onError:', error)
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
