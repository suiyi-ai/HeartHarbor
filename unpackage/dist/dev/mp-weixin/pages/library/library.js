"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      searchText: "",
      activeTab: 0,
      tabs: ["全部", "情绪管理", "压力应对", "人际关系", "自我成长", "睡眠健康"],
      articles: [
        {
          title: "如何有效管理焦虑情绪",
          category: "情绪管理",
          summary: "焦虑是常见的情绪反应，学习识别焦虑信号并采取有效措施可以帮助你更好地管理情绪...",
          readTime: 5,
          content: "焦虑管理详细内容..."
        },
        {
          title: "工作压力大的应对策略",
          category: "压力应对",
          summary: "现代职场压力普遍存在，掌握科学的压力管理方法对保持心理健康至关重要...",
          readTime: 8,
          content: "压力应对详细内容..."
        },
        {
          title: "改善人际关系的5个技巧",
          category: "人际关系",
          summary: "良好的人际关系是心理健康的重要保障，学习有效的沟通技巧可以改善人际关系...",
          readTime: 6,
          content: "人际关系详细内容..."
        },
        {
          title: "提升自我认知的方法",
          category: "自我成长",
          summary: "自我认知是个人成长的基础，通过反思和觉察可以更好地了解自己...",
          readTime: 7,
          content: "自我成长详细内容..."
        },
        {
          title: "改善睡眠质量的实用建议",
          category: "睡眠健康",
          summary: "良好的睡眠对心理健康至关重要，掌握科学的睡眠习惯可以显著改善睡眠质量...",
          readTime: 4,
          content: "睡眠健康详细内容..."
        }
      ]
    };
  },
  computed: {
    filteredArticles() {
      let filtered = this.articles;
      if (this.activeTab > 0) {
        const category = this.tabs[this.activeTab];
        filtered = filtered.filter((article) => article.category === category);
      }
      if (this.searchText) {
        const keyword = this.searchText.toLowerCase();
        filtered = filtered.filter(
          (article) => article.title.toLowerCase().includes(keyword) || article.summary.toLowerCase().includes(keyword)
        );
      }
      return filtered;
    }
  },
  methods: {
    readArticle(article) {
      common_vendor.index.showModal({
        title: article.title,
        content: article.content,
        showCancel: false,
        confirmText: "知道了"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.searchText,
    b: common_vendor.o(($event) => $data.searchText = $event.detail.value),
    c: common_vendor.f($data.tabs, (tab, index, i0) => {
      return {
        a: common_vendor.t(tab),
        b: index,
        c: common_vendor.n({
          active: $data.activeTab === index
        }),
        d: common_vendor.o(($event) => $data.activeTab = index, index)
      };
    }),
    d: common_vendor.f($options.filteredArticles, (article, index, i0) => {
      return {
        a: common_vendor.t(article.title),
        b: common_vendor.t(article.category),
        c: common_vendor.t(article.summary),
        d: common_vendor.t(article.readTime),
        e: common_vendor.o(($event) => $options.readArticle(article), index),
        f: index
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b5c5788b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/library/library.js.map
