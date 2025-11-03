"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      content: "",
      posts: [
        {
          content: "今天工作压力好大，感觉有点喘不过气来...",
          time: "2024-11-01 14:30"
        },
        {
          content: "和家人吵架了，心情很糟糕，不知道该怎么办",
          time: "2024-11-01 10:15"
        }
      ]
    };
  },
  methods: {
    submitContent() {
      if (!this.content.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      const now = /* @__PURE__ */ new Date();
      const timeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
      this.posts.unshift({
        content: this.content,
        time: timeStr
      });
      this.content = "";
      common_vendor.index.showToast({
        title: "发布成功",
        icon: "success"
      });
    },
    clearContent() {
      this.content = "";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.content,
    b: common_vendor.o(($event) => $data.content = $event.detail.value),
    c: common_vendor.t($data.content.length),
    d: common_vendor.o((...args) => $options.submitContent && $options.submitContent(...args)),
    e: common_vendor.o((...args) => $options.clearContent && $options.clearContent(...args)),
    f: common_vendor.f($data.posts, (post, index, i0) => {
      return {
        a: common_vendor.t(post.content),
        b: common_vendor.t(post.time),
        c: index
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cb95333c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hole/hole.js.map
