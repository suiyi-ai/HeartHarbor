"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      selectedMood: -1,
      moodNote: "",
      moods: [
        { emoji: "😊", text: "开心" },
        { emoji: "😐", text: "平静" },
        { emoji: "😔", text: "难过" },
        { emoji: "😰", text: "焦虑" },
        { emoji: "😴", text: "疲惫" }
      ]
    };
  },
  methods: {
    selectMood(index) {
      this.selectedMood = index;
    },
    saveMood() {
      if (this.selectedMood === -1) {
        common_vendor.index.showToast({
          title: "请选择心情",
          icon: "none"
        });
        return;
      }
      const mood = this.moods[this.selectedMood];
      common_vendor.index.showToast({
        title: `心情记录成功：${mood.text}`,
        icon: "success"
      });
      this.selectedMood = -1;
      this.moodNote = "";
    },
    navigateTo(page) {
      switch (page) {
        case "hole":
          common_vendor.index.switchTab({
            url: "/pages/hole/hole",
            success: () => {
              common_vendor.index.__f__("log", "at pages/index/index.vue:141", "导航成功：跳转到树洞页面");
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/index/index.vue:144", "导航失败:", err);
              common_vendor.index.showToast({
                title: "页面跳转失败，请重试",
                icon: "none"
              });
            }
          });
          break;
        case "ai":
          common_vendor.index.switchTab({
            url: "/pages/ai/ai",
            success: () => {
              common_vendor.index.__f__("log", "at pages/index/index.vue:156", "导航成功：跳转到AI伙伴页面");
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/index/index.vue:159", "导航失败:", err);
              common_vendor.index.showToast({
                title: "页面跳转失败，请重试",
                icon: "none"
              });
            }
          });
          break;
        case "test":
          common_vendor.index.showToast({
            title: "心理测试功能开发中",
            icon: "none"
          });
          break;
        case "music":
          common_vendor.index.showToast({
            title: "放松音乐功能开发中",
            icon: "none"
          });
          break;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.moods, (mood, index, i0) => {
      return {
        a: common_vendor.t(mood.emoji),
        b: common_vendor.t(mood.text),
        c: index,
        d: common_vendor.n({
          active: $data.selectedMood === index
        }),
        e: common_vendor.o(($event) => $options.selectMood(index), index)
      };
    }),
    b: $data.moodNote,
    c: common_vendor.o(($event) => $data.moodNote = $event.detail.value),
    d: common_vendor.o((...args) => $options.saveMood && $options.saveMood(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
