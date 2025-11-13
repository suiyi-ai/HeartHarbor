"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_auth = require("../../utils/auth.js");
const utils_supabase = require("../../utils/supabase.js");
const _sfc_main = {
  data() {
    return {
      isLogin: false,
      userInfo: {},
      stats: {
        treeholeCount: 0,
        favoriteCount: 0,
        readHistoryCount: 0,
        conversationCount: 0,
        moodRecordCount: 0
      },
      isLoadingStats: false
    };
  },
  onLoad() {
    this.checkLoginStatus();
  },
  onShow() {
    this.checkLoginStatus();
    if (this.isLogin) {
      this.loadUserStats();
    }
  },
  methods: {
    checkLoginStatus() {
      try {
        const currentUserStr = common_vendor.index.getStorageSync("current_user");
        const authToken = common_vendor.index.getStorageSync("auth_token");
        if (currentUserStr && authToken) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            this.isLogin = true;
            this.userInfo = {
              name: currentUser.username || currentUser.nickname || "心屿用户",
              email: currentUser.email || "",
              avatar: currentUser.avatar_url || "",
              bio: currentUser.bio || "",
              avatarText: this.getAvatarText(currentUser.username || currentUser.nickname || "心屿用户")
            };
            return;
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/mine/mine.vue:161", "解析用户信息失败:", e);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/mine/mine.vue:165", "检查登录状态失败:", error);
      }
      this.isLogin = common_vendor.index.getStorageSync("isLogin") || false;
      const oldUserInfo = common_vendor.index.getStorageSync("userInfo") || {};
      this.userInfo = {
        name: oldUserInfo.name || "心屿用户",
        email: oldUserInfo.email || "",
        avatar: oldUserInfo.avatar || "",
        bio: oldUserInfo.bio || "",
        avatarText: this.getAvatarText(oldUserInfo.name || "心屿用户")
      };
    },
    // 获取头像文字（取用户名首字符）
    getAvatarText(name) {
      if (!name)
        return "👤";
      if (/[\u4e00-\u9fa5]/.test(name)) {
        return name.charAt(0);
      }
      return name.charAt(0).toUpperCase();
    },
    // 加载用户统计数据
    async loadUserStats() {
      if (this.isLoadingStats)
        return;
      this.isLoadingStats = true;
      try {
        const stats = await utils_supabase.conversationService.supabaseService.getUserStats();
        this.stats = stats;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/mine/mine.vue:200", "加载统计数据失败:", error);
        this.stats = {
          treeholeCount: 0,
          favoriteCount: 0,
          readHistoryCount: 0,
          conversationCount: 0,
          moodRecordCount: 0
        };
      } finally {
        this.isLoadingStats = false;
      }
    },
    // 编辑资料
    editProfile() {
      common_vendor.index.showToast({
        title: "编辑资料功能开发中",
        icon: "none"
      });
    },
    // 跳转到我的对话
    navigateToMyConversations() {
      common_vendor.index.switchTab({
        url: "/pages/ai/ai",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:227", "导航成功：跳转到AI对话页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:230", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 跳转到我的树洞
    navigateToMyTreehole() {
      common_vendor.index.switchTab({
        url: "/pages/hole/hole",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:244", "导航成功：跳转到树洞页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:247", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 跳转到阅读历史
    navigateToReadHistory() {
      common_vendor.index.showToast({
        title: "阅读历史功能开发中",
        icon: "none"
      });
    },
    // 跳转到心情记录
    navigateToMoodRecords() {
      if (!this.isLogin) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.__f__("log", "at pages/mine/mine.vue:274", "点击心情记录，准备跳转到 /pages/mood/mood");
      common_vendor.index.navigateTo({
        url: "/pages/mood/mood",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:278", "✅ 导航成功：跳转到心情记录页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:281", "❌ navigateTo 失败:", err);
          common_vendor.index.reLaunch({
            url: "/pages/mood/mood",
            success: () => {
              common_vendor.index.__f__("log", "at pages/mine/mine.vue:286", "✅ 使用 reLaunch 导航成功");
            },
            fail: (err2) => {
              common_vendor.index.__f__("error", "at pages/mine/mine.vue:289", "❌ reLaunch 也失败:", err2);
              common_vendor.index.showToast({
                title: "页面跳转失败：" + (err2.errMsg || "未知错误"),
                icon: "none",
                duration: 3e3
              });
            }
          });
        }
      });
    },
    // 跳转到收藏内容
    navigateToFavoritesPage() {
      if (!this.isLogin) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.__f__("log", "at pages/mine/mine.vue:311", "点击我的收藏，准备跳转到 /pages/favorites/favorites");
      common_vendor.index.navigateTo({
        url: "/pages/favorites/favorites",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:315", "✅ 导航成功：跳转到收藏页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:318", "❌ navigateTo 失败:", err);
          common_vendor.index.reLaunch({
            url: "/pages/favorites/favorites",
            success: () => {
              common_vendor.index.__f__("log", "at pages/mine/mine.vue:323", "✅ 使用 reLaunch 导航成功");
            },
            fail: (err2) => {
              common_vendor.index.__f__("error", "at pages/mine/mine.vue:326", "❌ reLaunch 也失败:", err2);
              common_vendor.index.showToast({
                title: "页面跳转失败：" + (err2.errMsg || "未知错误"),
                icon: "none",
                duration: 3e3
              });
            }
          });
        }
      });
    },
    navigateTo(page) {
      if (!this.isLogin) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      switch (page) {
        case "settings":
          common_vendor.index.showToast({
            title: "设置功能开发中",
            icon: "none"
          });
          break;
        case "records":
          this.navigateToMoodRecords();
          break;
        case "favorites":
          this.navigateToFavoritesPage();
          break;
        case "feedback":
          common_vendor.index.showModal({
            title: "意见反馈",
            editable: true,
            placeholderText: "请输入您的意见或建议...",
            success: (res) => {
              if (res.confirm && res.content) {
                common_vendor.index.showToast({
                  title: "感谢您的反馈",
                  icon: "success"
                });
              }
            }
          });
          break;
        case "about":
          common_vendor.index.showModal({
            title: "关于心屿",
            content: "心屿是一个专注于心理健康的微信小程序，旨在为用户提供温暖的心理支持和专业的心理知识。\n\n版本：1.0.0\n\n我们致力于帮助用户：\n• 管理情绪和压力\n• 学习心理健康知识\n• 获得情感支持和陪伴\n• 记录成长历程",
            showCancel: false,
            confirmText: "知道了"
          });
          break;
      }
    },
    navigateToLogin() {
      common_vendor.index.navigateTo({
        url: "/pages/login/login",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:390", "导航成功：跳转到登录页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:393", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    navigateToRegister() {
      common_vendor.index.navigateTo({
        url: "/pages/register/register",
        success: () => {
          common_vendor.index.__f__("log", "at pages/mine/mine.vue:406", "导航成功：跳转到注册页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/mine/mine.vue:409", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    logout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            try {
              utils_auth.authService.logout();
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/mine/mine.vue:428", "退出登录失败:", error);
            }
            common_vendor.index.removeStorageSync("isLogin");
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.removeStorageSync("current_user");
            common_vendor.index.removeStorageSync("auth_token");
            this.isLogin = false;
            this.userInfo = {};
            common_vendor.index.showToast({
              title: "退出成功",
              icon: "success"
            });
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/index/index",
                success: () => {
                  common_vendor.index.__f__("log", "at pages/mine/mine.vue:450", "导航成功：跳转到首页");
                },
                fail: (err) => {
                  common_vendor.index.__f__("error", "at pages/mine/mine.vue:453", "导航失败:", err);
                  common_vendor.index.reLaunch({
                    url: "/pages/index/index"
                  });
                }
              });
            }, 1200);
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.isLogin
  }, $data.isLogin ? common_vendor.e({
    b: $data.userInfo.avatar
  }, $data.userInfo.avatar ? {
    c: $data.userInfo.avatar
  } : {
    d: common_vendor.t($data.userInfo.avatarText || "👤")
  }, {
    e: common_vendor.t($data.userInfo.name || "心屿用户"),
    f: common_vendor.t($data.userInfo.bio || "专注于心理健康成长"),
    g: $data.userInfo.email
  }, $data.userInfo.email ? {
    h: common_vendor.t($data.userInfo.email)
  } : {}, {
    i: common_vendor.o((...args) => $options.editProfile && $options.editProfile(...args)),
    j: common_vendor.t($data.stats.treeholeCount || 0),
    k: common_vendor.o((...args) => $options.navigateToMyTreehole && $options.navigateToMyTreehole(...args)),
    l: common_vendor.t($data.stats.favoriteCount || 0),
    m: common_vendor.o((...args) => $options.navigateToFavoritesPage && $options.navigateToFavoritesPage(...args)),
    n: common_vendor.t($data.stats.moodRecordCount || 0),
    o: common_vendor.o((...args) => $options.navigateToMoodRecords && $options.navigateToMoodRecords(...args)),
    p: common_vendor.t($data.stats.conversationCount || 0),
    q: common_vendor.o((...args) => $options.navigateToMyConversations && $options.navigateToMyConversations(...args))
  }) : {
    r: common_vendor.o((...args) => $options.navigateToLogin && $options.navigateToLogin(...args)),
    s: common_vendor.o((...args) => $options.navigateToRegister && $options.navigateToRegister(...args))
  }, {
    t: $data.isLogin
  }, $data.isLogin ? common_vendor.e({
    v: $data.stats.conversationCount > 0
  }, $data.stats.conversationCount > 0 ? {
    w: common_vendor.t($data.stats.conversationCount)
  } : {}, {
    x: common_vendor.o((...args) => $options.navigateToMyConversations && $options.navigateToMyConversations(...args)),
    y: $data.stats.treeholeCount > 0
  }, $data.stats.treeholeCount > 0 ? {
    z: common_vendor.t($data.stats.treeholeCount)
  } : {}, {
    A: common_vendor.o((...args) => $options.navigateToMyTreehole && $options.navigateToMyTreehole(...args)),
    B: $data.stats.favoriteCount > 0
  }, $data.stats.favoriteCount > 0 ? {
    C: common_vendor.t($data.stats.favoriteCount)
  } : {}, {
    D: common_vendor.o((...args) => $options.navigateToFavoritesPage && $options.navigateToFavoritesPage(...args)),
    E: $data.stats.moodRecordCount > 0
  }, $data.stats.moodRecordCount > 0 ? {
    F: common_vendor.t($data.stats.moodRecordCount)
  } : {}, {
    G: common_vendor.o((...args) => $options.navigateToMoodRecords && $options.navigateToMoodRecords(...args)),
    H: $data.stats.readHistoryCount > 0
  }, $data.stats.readHistoryCount > 0 ? {
    I: common_vendor.t($data.stats.readHistoryCount)
  } : {}, {
    J: common_vendor.o((...args) => $options.navigateToReadHistory && $options.navigateToReadHistory(...args)),
    K: common_vendor.o(($event) => $options.navigateTo("settings")),
    L: common_vendor.o(($event) => $options.navigateTo("feedback")),
    M: common_vendor.o(($event) => $options.navigateTo("about"))
  }) : {}, {
    N: $data.isLogin
  }, $data.isLogin ? {
    O: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7c2ebfa5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/mine.js.map
