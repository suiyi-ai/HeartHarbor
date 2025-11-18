/**
 * 页面路径常量
 * 用于统一管理页面路径，避免路径错误和依赖分析问题
 */

// 页面路径常量
export const PAGE_PATHS = {
	// Tab 页面
	INDEX: '/pages/index/index',
	HOLE: '/pages/hole/hole',
	AI: '/pages/ai/ai',
	LIBRARY: '/pages/library/library',
	MINE: '/pages/mine/mine',
	
	// 普通页面
	LOGIN: '/pages/login/login',
	REGISTER: '/pages/register/register',
	VIRTUAL_HUMAN: '/pages/virtual-human/xf-virtual-human',
	ARTICLE_DETAIL: '/pages/library/article-detail'
}

// 页面路径映射（用于导航）
export const PAGE_MAP = {
	index: PAGE_PATHS.INDEX,
	hole: PAGE_PATHS.HOLE,
	ai: PAGE_PATHS.AI,
	library: PAGE_PATHS.LIBRARY,
	mine: PAGE_PATHS.MINE,
	login: PAGE_PATHS.LOGIN,
	register: PAGE_PATHS.REGISTER,
	virtualHuman: PAGE_PATHS.VIRTUAL_HUMAN,
	articleDetail: PAGE_PATHS.ARTICLE_DETAIL
}

export default {
	PAGE_PATHS,
	PAGE_MAP
}

