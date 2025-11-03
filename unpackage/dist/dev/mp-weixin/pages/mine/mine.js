"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  methods: {
    navigateTo(page) {
      switch (page) {
        case "settings":
          common_vendor.index.showToast({
            title: "设置功能开发中",
            icon: "none"
          });
          break;
        case "records":
          common_vendor.index.showToast({
            title: "心情记录功能开发中",
            icon: "none"
          });
          break;
        case "favorites":
          common_vendor.index.showToast({
            title: "收藏功能开发中",
            icon: "none"
          });
          break;
        case "feedback":
          common_vendor.index.showToast({
            title: "意见反馈功能开发中",
            icon: "none"
          });
          break;
        case "about":
          common_vendor.index.showModal({
            title: "关于心屿",
            content: "心屿是一个专注于心理健康的微信小程序，旨在为用户提供温暖的心理支持和专业的心理知识。",
            showCancel: false,
            confirmText: "知道了"
          });
          break;
      }
    },
    logout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "退出成功",
              icon: "success"
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => $options.navigateTo("settings")),
    b: common_vendor.o(($event) => $options.navigateTo("records")),
    c: common_vendor.o(($event) => $options.navigateTo("favorites")),
    d: common_vendor.o(($event) => $options.navigateTo("feedback")),
    e: common_vendor.o(($event) => $options.navigateTo("about")),
    f: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7c2ebfa5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/mine.js.map
