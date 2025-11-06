"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false
      // 默认未登录状态
    };
  },
  onLoad() {
    const loginStatus = common_vendor.index.getStorageSync("isLoggedIn");
    if (loginStatus) {
      this.isLoggedIn = true;
    }
  },
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
    navigateToLogin() {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    },
    navigateToRegister() {
      common_vendor.index.navigateTo({
        url: "/pages/register/register"
      });
    },
    // 登录成功的回调方法
    handleLoginSuccess() {
      this.isLoggedIn = true;
      common_vendor.index.setStorageSync("isLoggedIn", true);
      common_vendor.index.showToast({
        title: "登录成功",
        icon: "success"
      });
    },
    // 登录成功的回调方法
    handleLoginSuccess() {
      this.isLoggedIn = true;
      common_vendor.index.setStorageSync("isLoggedIn", true);
      common_vendor.index.showToast({
        title: "登录成功",
        icon: "success"
      });
    },
    logout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            this.isLoggedIn = false;
            common_vendor.index.removeStorageSync("isLoggedIn");
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
  return common_vendor.e({
    a: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    b: common_vendor.o((...args) => $options.navigateToLogin && $options.navigateToLogin(...args)),
    c: common_vendor.o((...args) => $options.navigateToRegister && $options.navigateToRegister(...args))
  } : {
    d: common_vendor.o(($event) => $options.navigateTo("settings")),
    e: common_vendor.o(($event) => $options.navigateTo("records")),
    f: common_vendor.o(($event) => $options.navigateTo("favorites")),
    g: common_vendor.o(($event) => $options.navigateTo("feedback")),
    h: common_vendor.o(($event) => $options.navigateTo("about")),
    i: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7c2ebfa5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/mine.js.map
