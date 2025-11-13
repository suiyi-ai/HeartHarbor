"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/hole/hole.js";
  "./pages/ai/ai.js";
  "./pages/library/library.js";
  "./pages/library/article-detail.js";
  "./pages/mine/mine.js";
  "./pages/login/login.js";
  "./pages/register/register.js";
  "./pages/mood/mood.js";
  "./pages/favorites/favorites.js";
  "./pages/virtual-human/xf-virtual-human.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:8", "App Launch");
    if (typeof common_vendor.index !== "undefined") {
      common_vendor.index.onError && common_vendor.index.onError((error) => {
        if (error) {
          const errorMsg = error.errMsg || error.message || String(error);
          if ((errorMsg.includes("closeSocket:fail") || errorMsg.includes("close") || errorMsg.includes("WebSocket")) && errorMsg.includes("1006") && (errorMsg.includes("is neither") || errorMsg.includes("must be either") || errorMsg.includes("The code must be"))) {
            common_vendor.index.__f__("warn", "at App.vue:25", "⚠️ 检测到微信小程序框架的 WebSocket 关闭代码错误（已完全忽略）:", errorMsg);
            return;
          }
        }
        common_vendor.index.__f__("error", "at App.vue:31", "App Error:", error);
      });
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:36", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:39", "App Hide");
  },
  onError: function(error) {
    if (error) {
      const errorMsg = error.errMsg || error.message || String(error);
      if ((errorMsg.includes("closeSocket:fail") || errorMsg.includes("close") || errorMsg.includes("WebSocket")) && errorMsg.includes("1006") && (errorMsg.includes("is neither") || errorMsg.includes("must be either") || errorMsg.includes("The code must be"))) {
        common_vendor.index.__f__("warn", "at App.vue:55", "⚠️ 检测到微信小程序框架的 WebSocket 关闭代码错误（已完全忽略）:", errorMsg);
        return false;
      }
    }
    common_vendor.index.__f__("error", "at App.vue:61", "App onError:", error);
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
