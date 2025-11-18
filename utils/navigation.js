/**
 * 导航工具函数
 * 用于统一处理页面导航，防止超时和错误
 */

// 导航状态管理
let isNavigating = false

/**
 * 安全导航到页面（navigateTo）
 * @param {String} url - 页面路径
 * @param {Object} options - 导航选项
 */
export function safeNavigateTo(url, options = {}) {
	// 如果正在导航，忽略本次调用
	if (isNavigating) {
		console.warn('导航正在进行中，忽略本次调用:', url)
		return Promise.reject(new Error('导航正在进行中'))
	}
	
	isNavigating = true
	
	return new Promise((resolve, reject) => {
		uni.navigateTo({
			url: url,
			success: (res) => {
				console.log('导航成功:', url)
				setTimeout(() => {
					isNavigating = false
				}, 300)
				resolve(res)
			},
			fail: (err) => {
				console.error('导航失败:', url, err)
				isNavigating = false
				
				// 如果是超时错误，尝试使用 reLaunch
				if (err.errMsg && err.errMsg.includes('timeout')) {
					console.warn('导航超时，尝试使用 reLaunch:', url)
					uni.reLaunch({
						url: url,
						success: (res) => {
							console.log('reLaunch 成功:', url)
							resolve(res)
						},
						fail: (reLaunchErr) => {
							console.error('reLaunch 也失败:', url, reLaunchErr)
							uni.showToast({
								title: '页面跳转失败，请重试',
								icon: 'none',
								duration: 2000
							})
							reject(reLaunchErr)
						}
					})
				} else {
					uni.showToast({
						title: '页面跳转失败，请重试',
						icon: 'none',
						duration: 2000
					})
					reject(err)
				}
			},
			...options
		})
	})
}

/**
 * 安全切换到 Tab 页面（switchTab）
 * @param {String} url - 页面路径
 * @param {Object} options - 导航选项
 */
export function safeSwitchTab(url, options = {}) {
	// 如果正在导航，忽略本次调用
	if (isNavigating) {
		console.warn('导航正在进行中，忽略本次调用:', url)
		return Promise.reject(new Error('导航正在进行中'))
	}
	
	isNavigating = true
	
	return new Promise((resolve, reject) => {
		uni.switchTab({
			url: url,
			success: (res) => {
				console.log('切换 Tab 成功:', url)
				setTimeout(() => {
					isNavigating = false
				}, 300)
				resolve(res)
			},
			fail: (err) => {
				console.error('切换 Tab 失败:', url, err)
				isNavigating = false
				
				// 如果是超时错误，尝试使用 reLaunch
				if (err.errMsg && err.errMsg.includes('timeout')) {
					console.warn('切换 Tab 超时，尝试使用 reLaunch:', url)
					uni.reLaunch({
						url: url,
						success: (res) => {
							console.log('reLaunch 成功:', url)
							resolve(res)
						},
						fail: (reLaunchErr) => {
							console.error('reLaunch 也失败:', url, reLaunchErr)
							uni.showToast({
								title: '页面跳转失败，请重试',
								icon: 'none',
								duration: 2000
							})
							reject(reLaunchErr)
						}
					})
				} else {
					uni.showToast({
						title: '页面跳转失败，请重试',
						icon: 'none',
						duration: 2000
					})
					reject(err)
				}
			},
			...options
		})
	})
}

/**
 * 延迟导航（在指定时间后导航）
 * @param {String} url - 页面路径
 * @param {Number} delay - 延迟时间（毫秒）
 * @param {String} type - 导航类型 ('navigateTo' | 'switchTab' | 'reLaunch')
 */
export function delayedNavigate(url, delay = 1000, type = 'switchTab') {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (type === 'switchTab') {
				safeSwitchTab(url).then(resolve).catch(reject)
			} else if (type === 'navigateTo') {
				safeNavigateTo(url).then(resolve).catch(reject)
			} else if (type === 'reLaunch') {
				uni.reLaunch({
					url: url,
					success: resolve,
					fail: reject
				})
			}
		}, delay)
	})
}

/**
 * 重置导航状态（用于紧急情况）
 */
export function resetNavigationState() {
	isNavigating = false
	console.log('导航状态已重置')
}

export default {
	safeNavigateTo,
	safeSwitchTab,
	delayedNavigate,
	resetNavigationState
}

