"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_supabase = require("../../utils/supabase.js");
const ARTICLE_DETAIL_PAGE = "/pages/library/article-detail";
const _sfc_main = {
  data() {
    return {
      searchText: "",
      activeTab: 0,
      scrollLeft: 0,
      isRefreshing: false,
      isLoading: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 10,
      tabs: [
        { name: "全部", icon: "📚", value: "all" },
        { name: "情绪管理", icon: "😊", value: "情绪管理" },
        { name: "压力应对", icon: "😰", value: "压力应对" },
        { name: "人际关系", icon: "👥", value: "人际关系" },
        { name: "自我成长", icon: "🌱", value: "自我成长" },
        { name: "睡眠健康", icon: "😴", value: "睡眠健康" },
        { name: "焦虑抑郁", icon: "😔", value: "焦虑抑郁" },
        { name: "亲子关系", icon: "👨‍👩‍👧", value: "亲子关系" }
      ],
      articles: []
      // 从数据库加载，不再使用硬编码数据
    };
  },
  computed: {
    // 热门文章（从数据库加载）
    hotArticles() {
      return this.articles.filter((article) => article.isHot).slice(0, 5);
    },
    // 筛选后的文章（现在已经从数据库筛选，这里直接返回）
    filteredArticles() {
      return [...this.articles];
    }
  },
  onLoad() {
    this.loadArticles();
    this.loadFavorites();
  },
  onShow() {
    this.loadFavorites();
    if (this.articles.length === 0) {
      this.loadArticles();
    }
  },
  methods: {
    // 加载文章列表
    async loadArticles(refresh = false) {
      if (this.isLoading)
        return;
      this.isLoading = true;
      try {
        if (refresh) {
          this.currentPage = 1;
          this.hasMore = true;
        }
        const category = this.activeTab === 0 ? null : this.tabs[this.activeTab].value;
        const newArticles = await utils_supabase.conversationService.supabaseService.getArticles({
          page: this.currentPage,
          limit: this.pageSize,
          category,
          search: this.searchText || null,
          orderBy: "created_at",
          order: "desc"
        });
        for (let article of newArticles) {
          try {
            article.isFavorited = await utils_supabase.conversationService.supabaseService.checkUserFavoriteArticle(article.id);
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/library/library.vue:251", "检查收藏状态失败:", error);
            article.isFavorited = false;
          }
          if (article.date) {
            article.date = new Date(article.date).toISOString().split("T")[0];
          }
        }
        if (refresh) {
          this.articles = newArticles;
        } else {
          this.articles = [...this.articles, ...newArticles];
        }
        this.hasMore = newArticles.length >= this.pageSize;
        if (this.hasMore) {
          this.currentPage++;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/library/library.vue:273", "加载文章失败:", error);
        common_vendor.index.showToast({
          title: "加载失败，使用本地数据",
          icon: "none",
          duration: 1500
        });
      } finally {
        this.isLoading = false;
        this.isRefreshing = false;
      }
    },
    // 选择分类
    selectTab(index) {
      this.activeTab = index;
      this.currentPage = 1;
      this.hasMore = true;
      this.loadArticles(true);
      this.$nextTick(() => {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.selectAll(".tab").boundingClientRect((rects) => {
          if (rects[index]) {
            this.scrollLeft = rects[index].left - 40;
          }
        }).exec();
      });
    },
    // 搜索输入
    onSearchInput(e) {
      this.searchText = e.detail.value;
    },
    // 搜索确认
    onSearchConfirm() {
      this.currentPage = 1;
      this.hasMore = true;
      this.loadArticles(true);
    },
    // 清空搜索
    clearSearch() {
      this.searchText = "";
      this.currentPage = 1;
      this.hasMore = true;
      this.loadArticles(true);
    },
    // 下拉刷新
    onRefresh() {
      this.isRefreshing = true;
      this.currentPage = 1;
      this.hasMore = true;
      this.loadArticles(true);
    },
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.isLoading) {
        this.loadArticles(false);
      }
    },
    // 阅读文章
    async readArticle(article) {
      try {
        await utils_supabase.conversationService.supabaseService.saveArticleReadHistory(article.id, 100, 0);
        article.viewCount = (article.viewCount || 0) + 1;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/library/library.vue:350", "保存阅读历史失败:", error);
      }
      const articleDetailUrl = ARTICLE_DETAIL_PAGE + `?id=${article.id}&title=${encodeURIComponent(article.title)}`;
      common_vendor.index.navigateTo({
        url: articleDetailUrl,
        success: () => {
          common_vendor.index.__f__("log", "at pages/library/library.vue:360", "导航成功：跳转到文章详情页");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/library/library.vue:363", "导航失败:", err);
          this.showArticleModal(article);
        }
      });
    },
    // 显示文章弹窗（备用方案）
    showArticleModal(article) {
      common_vendor.index.showModal({
        title: article.title,
        content: article.content.substring(0, 500) + "...",
        showCancel: false,
        confirmText: "知道了",
        success: () => {
        }
      });
    },
    // 切换收藏
    async toggleFavorite(article, index) {
      try {
        const result = await utils_supabase.conversationService.supabaseService.toggleArticleFavorite(article.id);
        article.isFavorited = result.favorited;
        if (result.favorited) {
          article.favoriteCount = (article.favoriteCount || 0) + 1;
        } else {
          article.favoriteCount = Math.max(0, (article.favoriteCount || 0) - 1);
        }
        try {
          let favorites = common_vendor.index.getStorageSync("library_favorites") || [];
          if (result.favorited) {
            if (!favorites.includes(article.id)) {
              favorites.push(article.id);
            }
          } else {
            favorites = favorites.filter((id) => id !== article.id);
          }
          common_vendor.index.setStorageSync("library_favorites", favorites);
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/library/library.vue:409", "更新本地收藏失败:", error);
        }
        common_vendor.index.showToast({
          title: result.favorited ? "已收藏" : "已取消收藏",
          icon: "success",
          duration: 1e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/library/library.vue:418", "切换收藏失败:", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载收藏列表
    async loadFavorites() {
      try {
        for (let article of this.articles) {
          try {
            article.isFavorited = await utils_supabase.conversationService.supabaseService.checkUserFavoriteArticle(article.id);
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/library/library.vue:434", "检查收藏状态失败:", error);
            const favorites = common_vendor.index.getStorageSync("library_favorites") || [];
            article.isFavorited = favorites.includes(article.id);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/library/library.vue:441", "加载收藏失败:", error);
        try {
          const favorites = common_vendor.index.getStorageSync("library_favorites") || [];
          this.articles.forEach((article) => {
            article.isFavorited = favorites.includes(article.id);
          });
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/library/library.vue:449", "加载本地收藏失败:", e);
        }
      }
    },
    // 获取分类图标
    getCategoryIcon(category) {
      const icons = {
        "情绪管理": "😊",
        "压力应对": "😰",
        "人际关系": "👥",
        "自我成长": "🌱",
        "睡眠健康": "😴",
        "焦虑抑郁": "😔",
        "亲子关系": "👨‍👩‍👧"
      };
      return icons[category] || "📚";
    },
    // 获取分类颜色 - 淡蓝色主题
    getCategoryColor(category) {
      const colors = {
        "情绪管理": "#E6F3FF",
        "压力应对": "#E8F4FD",
        "人际关系": "#E6F3FF",
        "自我成长": "#EAF5FF",
        "睡眠健康": "#E6F0FF",
        "焦虑抑郁": "#E8F2FF",
        "亲子关系": "#EAF4FF"
      };
      return colors[category] || "#F5F9FF";
    },
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr)
        return "";
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (days === 0)
        return "今天";
      if (days === 1)
        return "昨天";
      if (days < 7)
        return `${days}天前`;
      if (days < 30)
        return `${Math.floor(days / 7)}周前`;
      if (days < 365)
        return `${Math.floor(days / 30)}个月前`;
      return `${Math.floor(days / 365)}年前`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.searchText = $event.detail.value, (...args) => $options.onSearchInput && $options.onSearchInput(...args)]),
    b: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args)),
    c: $data.searchText,
    d: $data.searchText
  }, $data.searchText ? {
    e: common_vendor.o((...args) => $options.clearSearch && $options.clearSearch(...args))
  } : {}, {
    f: common_vendor.f($data.tabs, (tab, index, i0) => {
      return {
        a: common_vendor.t(tab.icon),
        b: common_vendor.t(tab.name),
        c: index,
        d: common_vendor.n({
          active: $data.activeTab === index
        }),
        e: common_vendor.o(($event) => $options.selectTab(index), index)
      };
    }),
    g: $data.scrollLeft,
    h: $data.activeTab === 0 && !$data.searchText
  }, $data.activeTab === 0 && !$data.searchText ? {
    i: common_vendor.f($options.hotArticles, (article, index, i0) => {
      return common_vendor.e({
        a: index === 0
      }, index === 0 ? {} : {}, {
        b: common_vendor.t(article.title),
        c: common_vendor.t(article.category),
        d: article.id,
        e: common_vendor.o(($event) => $options.readArticle(article), article.id)
      });
    })
  } : {}, {
    j: !$data.isLoading && $options.filteredArticles.length === 0
  }, !$data.isLoading && $options.filteredArticles.length === 0 ? {} : {}, {
    k: common_vendor.f($options.filteredArticles, (article, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(article.title),
        b: article.isHot
      }, article.isHot ? {} : {}, {
        c: article.isNew
      }, article.isNew ? {} : {}, {
        d: common_vendor.t($options.getCategoryIcon(article.category)),
        e: common_vendor.t(article.category),
        f: $options.getCategoryColor(article.category),
        g: common_vendor.t(article.summary),
        h: common_vendor.t(article.readTime),
        i: common_vendor.t(article.viewCount || 0),
        j: common_vendor.t($options.formatDate(article.date)),
        k: common_vendor.t(article.isFavorited ? "❤️" : "🤍"),
        l: article.isFavorited ? 1 : "",
        m: common_vendor.o(($event) => $options.toggleFavorite(article, index), article.id || index),
        n: article.id || index,
        o: index * 0.05 + "s",
        p: common_vendor.o(($event) => $options.readArticle(article), article.id || index)
      });
    }),
    l: $data.hasMore && !$data.isLoading && $options.filteredArticles.length > 0
  }, $data.hasMore && !$data.isLoading && $options.filteredArticles.length > 0 ? {} : {}, {
    m: $data.isLoading && $options.filteredArticles.length > 0
  }, $data.isLoading && $options.filteredArticles.length > 0 ? {} : {}, {
    n: !$data.hasMore && $options.filteredArticles.length > 0
  }, !$data.hasMore && $options.filteredArticles.length > 0 ? {} : {}, {
    o: $data.isRefreshing,
    p: common_vendor.o((...args) => $options.onRefresh && $options.onRefresh(...args)),
    q: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b5c5788b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/library/library.js.map
