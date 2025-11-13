"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_supabase = require("../../utils/supabase.js");
const _sfc_main = {
  data() {
    return {
      inputText: "",
      messages: [
        {
          role: "assistant",
          content: "你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？"
        }
      ],
      scrollTop: 0,
      showVirtualHumanModal: false,
      isLoading: false,
      isLogin: false,
      // 登录状态
      // 对话管理相关
      conversations: [],
      currentConversationId: null,
      showHistoryPanel: false,
      showEditTitleModal: false,
      editingConversation: null,
      editingTitle: "",
      conversationStats: {
        total: 0,
        recent: 0
      },
      // Dify API配置
      difyConfig: {
        apiKey: "app-VlvTWUWxlfDZhLgTIVuGj22t",
        apiUrl: "https://dify.aipfuture.com/v1",
        endpoint: "/chat-messages"
      },
      // 角色数据
      roles: [
        { id: "companion", name: "心灵伙伴", icon: "💖", description: "温暖陪伴，情感支持" },
        { id: "advisor", name: "专业顾问", icon: "🎓", description: "专业分析，理性建议" }
      ],
      currentRole: { id: "companion", name: "心灵伙伴", icon: "💖", description: "温暖陪伴，情感支持" }
    };
  },
  mounted() {
    this.checkLoginStatus();
    this.loadUserPreferences();
    if (this.isLogin) {
      this.initConversationSystem();
    }
  },
  // 页面显示时重新加载对话（用户可能在其他页面登录/退出）
  onShow() {
    this.checkLoginStatus();
    if (this.isLogin) {
      this.initConversationSystem();
    } else {
      this.conversations = [];
      this.currentConversationId = null;
      this.messages = [{
        role: "assistant",
        content: "你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？"
      }];
    }
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      try {
        const currentUserStr = common_vendor.index.getStorageSync("current_user");
        const authToken = common_vendor.index.getStorageSync("auth_token");
        if (currentUserStr && authToken) {
          this.isLogin = true;
        } else {
          const isLogin = common_vendor.index.getStorageSync("isLogin");
          this.isLogin = isLogin || false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:243", "检查登录状态失败:", error);
        this.isLogin = false;
      }
    },
    // 检查登录状态并提示
    checkLoginAndPrompt() {
      if (!this.isLogin) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "使用AI伙伴功能需要先登录，是否前往登录？",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateTo({
                url: "/pages/login/login",
                success: () => {
                  common_vendor.index.__f__("log", "at pages/ai/ai.vue:259", "导航成功：跳转到登录页面");
                },
                fail: (err) => {
                  common_vendor.index.__f__("error", "at pages/ai/ai.vue:262", "导航失败:", err);
                  common_vendor.index.showToast({
                    title: "页面跳转失败，请重试",
                    icon: "none"
                  });
                }
              });
            }
          }
        });
        return false;
      }
      return true;
    },
    // 初始化对话系统
    async initConversationSystem() {
      if (!this.isLogin) {
        return;
      }
      try {
        await utils_supabase.conversationService.checkSupabaseConnection();
        await this.loadConversations();
        if (!this.currentConversationId && this.conversations.length === 0) {
          await this.createNewConversation();
        }
        await this.loadConversationStats();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:299", "初始化对话系统失败", error);
        common_vendor.index.showToast({
          title: "对话系统初始化失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 加载对话列表
    async loadConversations() {
      try {
        this.conversations = await utils_supabase.conversationService.getUserConversations();
        this.conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:315", "加载对话列表失败:", error);
      }
    },
    // 加载统计信息
    async loadConversationStats() {
      try {
        this.conversationStats = await utils_supabase.conversationService.getConversationStats();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:324", "加载统计信息失败:", error);
      }
    },
    // 导航到登录页面
    navigateToLogin() {
      common_vendor.index.navigateTo({
        url: "/pages/login/login",
        success: () => {
          common_vendor.index.__f__("log", "at pages/ai/ai.vue:333", "导航成功：跳转到登录页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:336", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 导航到注册页面
    navigateToRegister() {
      common_vendor.index.navigateTo({
        url: "/pages/register/register",
        success: () => {
          common_vendor.index.__f__("log", "at pages/ai/ai.vue:350", "导航成功：跳转到注册页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:353", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 创建新对话
    async createNewConversation() {
      if (!this.checkLoginAndPrompt()) {
        return;
      }
      try {
        const title = `${this.currentRole.name}的对话`;
        const styleId = this.currentRole.style_id || "friendly";
        const conversation = await utils_supabase.conversationService.createConversation(
          title,
          this.currentRole.id,
          styleId
        );
        this.currentConversationId = conversation.id;
        this.messages = [
          {
            role: "assistant",
            content: "你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？"
          }
        ];
        await this.loadConversations();
        await this.loadConversationStats();
        common_vendor.index.showToast({
          title: "新对话已创建",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:397", "创建新对话失�?", error);
        common_vendor.index.showToast({
          title: "创建对话失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 加载对话
    async loadConversation(conversationId) {
      try {
        this.currentConversationId = conversationId;
        const messages = await utils_supabase.conversationService.getConversationMessages(conversationId);
        if (messages && messages.length > 0) {
          this.messages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content
          }));
        } else {
          this.messages = [{
            role: "assistant",
            content: "你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？"
          }];
        }
        const conversationData = this.conversations.find((c) => c.id === conversationId);
        if (conversationData) {
          const role = this.roles.find((r) => r.id === conversationData.role_id);
          if (role)
            this.currentRole = role;
        }
        this.showHistoryPanel = false;
        this.$nextTick(() => {
          this.scrollTop = 99999;
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:444", "加载对话失败:", error);
        common_vendor.index.showToast({
          title: "加载对话失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 删除对话
    async deleteConversation(conversationId) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个对话吗？此操作不可恢复。",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_supabase.conversationService.deleteConversation(conversationId);
              if (this.currentConversationId === conversationId) {
                await this.loadConversations();
                this.currentConversationId = null;
                this.messages = [
                  {
                    role: "assistant",
                    content: "你好！我是你的AI心理伙伴，随时准备倾听你的心声。今天过得怎么样？"
                  }
                ];
              } else {
                await this.loadConversations();
                await this.loadConversationStats();
              }
              common_vendor.index.showToast({
                title: "对话已删除",
                icon: "success",
                duration: 1500
              });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/ai/ai.vue:489", "删除对话失败:", error);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none",
                duration: 2e3
              });
            }
          }
        }
      });
    },
    // 编辑对话标题
    editConversationTitle(conversation) {
      this.editingConversation = conversation;
      this.editingTitle = conversation.title;
      this.showEditTitleModal = true;
    },
    // 确认编辑标题
    async confirmEditTitle() {
      if (!this.editingTitle.trim()) {
        common_vendor.index.showToast({
          title: "标题不能为空",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      try {
        await utils_supabase.conversationService.updateConversationTitle(
          this.editingConversation.id,
          this.editingTitle
        );
        const index = this.conversations.findIndex((c) => c.id === this.editingConversation.id);
        if (index >= 0) {
          this.conversations[index].title = this.editingTitle;
        }
        this.closeEditTitleModal();
        common_vendor.index.showToast({
          title: "标题已更新",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:540", "更新标题失败:", error);
        common_vendor.index.showToast({
          title: "更新失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 关闭编辑标题弹窗
    closeEditTitleModal() {
      this.showEditTitleModal = false;
      this.editingConversation = null;
      this.editingTitle = "";
    },
    // 切换历史面板
    toggleHistoryPanel() {
      if (!this.checkLoginAndPrompt()) {
        return;
      }
      this.showHistoryPanel = !this.showHistoryPanel;
      if (this.showHistoryPanel) {
        this.loadConversations();
        this.loadConversationStats();
      }
    },
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    // 获取角色名称
    getRoleName(roleId) {
      const role = this.roles.find((r) => r.id === roleId);
      return role ? role.name : "未知角色";
    },
    // 加载用户偏好设置
    loadUserPreferences() {
      try {
        const savedRole = common_vendor.index.getStorageSync("ai_role");
        if (savedRole) {
          const role = this.roles.find((r) => r.id === savedRole);
          this.currentRole = role || this.roles[0];
        } else {
          this.currentRole = this.roles[0];
        }
      } catch (e) {
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:602", "加载用户偏好失败", e);
        this.currentRole = this.roles[0];
      }
    },
    // 选择角色
    selectRole(roleId) {
      if (!this.checkLoginAndPrompt()) {
        return;
      }
      const role = this.roles.find((r) => r.id === roleId);
      if (role) {
        this.currentRole = role;
        common_vendor.index.setStorageSync("ai_role", roleId);
        this.addRoleGreeting();
      }
    },
    // 角色切换问候语
    addRoleGreeting() {
      const greetings = {
        companion: "你好！我是你的心灵伙伴，我会用温暖的心倾听你的每一个故事。有什么想和我分享的吗？",
        advisor: "您好！我是您的专业心理顾问，我将用专业的知识为您提供理性的分析和建议。请告诉我您的情况？"
      };
      this.messages.push({
        role: "assistant",
        content: greetings[this.currentRole.id]
      });
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
    },
    // 跳转到虚拟人页面
    showVirtualHumanPreview() {
      if (!this.checkLoginAndPrompt()) {
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/virtual-human/xf-virtual-human",
        success: () => {
          common_vendor.index.__f__("log", "at pages/ai/ai.vue:650", "导航成功：跳转到虚拟人页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:653", "导航失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 关闭虚拟人功能预�?
    closeVirtualHumanModal() {
      this.showVirtualHumanModal = false;
    },
    async sendMessage() {
      if (!this.checkLoginAndPrompt()) {
        return;
      }
      if (!this.inputText.trim())
        return;
      if (!this.currentConversationId) {
        await this.createNewConversation();
      }
      this.messages.push({
        role: "user",
        content: this.inputText
      });
      try {
        await utils_supabase.conversationService.saveMessage(
          this.currentConversationId,
          "user",
          this.inputText
        );
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:692", "保存用户消息失败:", error);
      }
      const userMessage = this.inputText;
      this.inputText = "";
      this.isLoading = true;
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
      try {
        const aiResponse = await this.callDifyAPI(userMessage);
        this.messages.push({
          role: "assistant",
          content: aiResponse
        });
        try {
          await utils_supabase.conversationService.saveMessage(
            this.currentConversationId,
            "assistant",
            aiResponse
          );
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:722", "保存AI消息失败:", error);
        }
        common_vendor.index.showToast({
          title: "AI回复已生成",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:733", "Dify API调用失败:", error);
        let errorTitle = "网络异常";
        if (error.message.includes("超时")) {
          errorTitle = "请求超时";
        } else if (error.message.includes("网络连接异常")) {
          errorTitle = "网络连接异常";
        } else if (error.message.includes("SSL")) {
          errorTitle = "安全连接失败";
        } else if (error.message.includes("API请求格式错误")) {
          errorTitle = "配置错误";
        } else if (error.message.includes("API密钥无效")) {
          errorTitle = "认证失败";
        }
        const fallbackResponse = this.generateAIResponse(userMessage);
        this.messages.push({
          role: "assistant",
          content: fallbackResponse
        });
        try {
          await utils_supabase.conversationService.saveMessage(
            this.currentConversationId,
            "assistant",
            fallbackResponse
          );
        } catch (error2) {
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:772", "保存降级消息失败:", error2);
        }
        common_vendor.index.showToast({
          title: `${errorTitle}�?{errorMessage}`,
          icon: "none",
          duration: 3e3
        });
      } finally {
        this.isLoading = false;
        this.$nextTick(() => {
          this.scrollTop = 99999;
        });
      }
    },
    // 调用Dify API获取AI回复
    callDifyAPI(userMessage) {
      return new Promise((resolve, reject) => {
        const inputs = {
          query: userMessage,
          role: this.currentRole.name,
          role_description: this.currentRole.description,
          system_prompt: `你是一个${this.currentRole.name}。你的角色描述是：${this.currentRole.description}`
        };
        const timeout = setTimeout(() => {
          reject(new Error("请求超时，请检查网络连接"));
        }, 1e4);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:809", "Dify API配置:", this.difyConfig);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:810", "完整URL:", this.difyConfig.apiUrl + this.difyConfig.endpoint);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:811", "结构化输入数据", inputs);
        common_vendor.index.request({
          url: this.difyConfig.apiUrl + this.difyConfig.endpoint,
          method: "POST",
          timeout: 1e4,
          // 10秒超时
          header: {
            // 尝试不同的认证方式
            "Authorization": "Bearer " + this.difyConfig.apiKey,
            // 或者尝试使用API密钥直接作为Bearer token
            // 'Authorization': 'Bearer ' + this.difyConfig.apiKey.replace('app-', ''),
            "Content-Type": "application/json"
          },
          data: {
            // 使用Dify变量系统传递结构化数据
            inputs,
            // 同时提供query字段保持向后兼容
            query: userMessage,
            response_mode: "blocking",
            user: "heart-harbor-user"
          },
          success: (res) => {
            clearTimeout(timeout);
            common_vendor.index.__f__("log", "at pages/ai/ai.vue:834", "Dify API响应:", res);
            if (res.statusCode === 0) {
              reject(new Error("网络连接异常，请检查网络设置"));
              return;
            }
            if (res.statusCode === 200 && res.data) {
              let aiResponse = "我收到了你的消息，正在思考如何回�?..";
              if (res.data.answer) {
                aiResponse = res.data.answer;
              } else if (res.data.message) {
                aiResponse = res.data.message;
              } else if (res.data.data && res.data.data.answer) {
                aiResponse = res.data.data.answer;
              } else if (typeof res.data === "string") {
                aiResponse = res.data;
              }
              if (!aiResponse || aiResponse.trim() === "") {
                aiResponse = "我理解你的感受，但需要更多信息来提供更好的帮助。可以详细说说吗？";
              }
              resolve(aiResponse);
            } else if (res.statusCode === 400) {
              let errorDetail = "API请求格式错误";
              if (res.data && res.data.message) {
                errorDetail += `: ${res.data.message}`;
              }
              reject(new Error(errorDetail));
            } else if (res.statusCode === 401) {
              reject(new Error("API密钥无效，请检查配置"));
            } else if (res.statusCode === 403) {
              reject(new Error("API访问被拒绝，请检查权限"));
            } else if (res.statusCode === 404) {
              reject(new Error("API接口不存在，请检查URL配置"));
            } else if (res.statusCode >= 500) {
              reject(new Error("服务器内部错误，请稍后重试"));
            } else {
              reject(new Error(`API返回异常状态码: ${res.statusCode}`));
            }
          },
          fail: (err) => {
            clearTimeout(timeout);
            common_vendor.index.__f__("error", "at pages/ai/ai.vue:883", "Dify API调用失败:", err);
            let errorMessage = "网络请求失败";
            if (err.errMsg) {
              if (err.errMsg.includes("timeout")) {
                errorMessage = "请求超时，请检查网络连接";
              } else if (err.errMsg.includes("network")) {
                errorMessage = "网络连接异常，请检查网络设置";
              } else if (err.errMsg.includes("abort")) {
                errorMessage = "请求被取消";
              } else if (err.errMsg.includes("SSL")) {
                errorMessage = "SSL证书验证失败，请检查网络环境";
              }
            }
            reject(new Error(errorMessage));
          }
        });
      });
    },
    // 根据角色生成AI回复
    generateAIResponse(userMessage) {
      const roleResponses = {
        companion: {
          pressure: "亲爱的，感受到你有些压力呢～这很正常哦！可以试试深呼吸放松一下，或者和我聊聊具体是什么让你感到压力？😊",
          happy: "真为你感到高兴！保持积极的心态很重要呢～愿意和我分享更多让你开心的事情吗？💖",
          sad: "听到你难过我也感到心疼呢。情绪波动是正常的，重要的是给自己时间和空间去感受和处理这些情绪。抱抱你～",
          default: "谢谢你的分享！我在这里倾听，如果你愿意，可以告诉我更多关于你的感受和想法。"
        },
        advisor: {
          pressure: "您好！从您的描述中我感受到一些压力。作为专业顾问，我建议您可以尝试认知行为疗法中的一些技巧来管理压力。",
          happy: "很高兴听到您的积极体验！积极情绪对心理健康有重要促进作用。",
          sad: "理解您的情绪困扰。从专业角度，建议您关注情绪调节策略的应用。",
          default: "感谢您的信任。作为专业顾问，我将为您提供理性的分析和建议。"
        }
      };
      let responseType = "default";
      if (userMessage.includes("压力") || userMessage.includes("焦虑") || userMessage.includes("紧张")) {
        responseType = "pressure";
      } else if (userMessage.includes("开心") || userMessage.includes("高兴") || userMessage.includes("愉快")) {
        responseType = "happy";
      } else if (userMessage.includes("难过") || userMessage.includes("伤心") || userMessage.includes("沮丧")) {
        responseType = "sad";
      }
      const roleResponse = roleResponses[this.currentRole.id];
      if (roleResponse && roleResponse[responseType]) {
        return roleResponse[responseType];
      }
      return roleResponse.default;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.showVirtualHumanPreview && $options.showVirtualHumanPreview(...args)),
    b: common_vendor.t($data.currentRole.name),
    c: common_vendor.o((...args) => $options.createNewConversation && $options.createNewConversation(...args)),
    d: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args)),
    e: common_vendor.f($data.roles, (role, k0, i0) => {
      return {
        a: common_vendor.t(role.icon),
        b: common_vendor.t(role.name),
        c: common_vendor.t(role.description),
        d: role.id,
        e: $data.currentRole.id === role.id ? 1 : "",
        f: common_vendor.o(($event) => $options.selectRole(role.id), role.id)
      };
    }),
    f: common_vendor.f($data.messages, (msg, index, i0) => {
      return common_vendor.e({
        a: msg.role === "user"
      }, msg.role === "user" ? {} : {
        b: common_vendor.t($data.currentRole.icon)
      }, {
        c: common_vendor.t(msg.content),
        d: index,
        e: msg.role === "user" ? 1 : "",
        f: msg.role === "assistant" ? 1 : ""
      });
    }),
    g: $data.isLoading
  }, $data.isLoading ? {
    h: common_vendor.t($data.currentRole.icon)
  } : {}, {
    i: $data.scrollTop,
    j: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    k: $data.inputText,
    l: common_vendor.o(($event) => $data.inputText = $event.detail.value),
    m: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    n: $data.showVirtualHumanModal
  }, $data.showVirtualHumanModal ? {
    o: common_vendor.o((...args) => $options.closeVirtualHumanModal && $options.closeVirtualHumanModal(...args))
  } : {}, {
    p: common_vendor.t($data.conversationStats.total),
    q: common_vendor.t($data.conversationStats.recent),
    r: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args)),
    s: common_vendor.f($data.conversations, (conversation, k0, i0) => {
      return {
        a: common_vendor.t(conversation.title),
        b: common_vendor.t($options.formatDate(conversation.updated_at)),
        c: common_vendor.t($options.getRoleName(conversation.role_id)),
        d: common_vendor.o(($event) => $options.deleteConversation(conversation.id), conversation.id),
        e: common_vendor.o(($event) => $options.editConversationTitle(conversation), conversation.id),
        f: conversation.id,
        g: $data.currentConversationId === conversation.id ? 1 : "",
        h: common_vendor.o(($event) => $options.loadConversation(conversation.id), conversation.id)
      };
    }),
    t: $data.conversations.length === 0
  }, $data.conversations.length === 0 ? {} : {}, {
    v: $data.showHistoryPanel ? 1 : "",
    w: $data.showHistoryPanel
  }, $data.showHistoryPanel ? {
    x: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args))
  } : {}, {
    y: $data.showEditTitleModal
  }, $data.showEditTitleModal ? {
    z: common_vendor.o((...args) => $options.closeEditTitleModal && $options.closeEditTitleModal(...args)),
    A: $data.editingTitle,
    B: common_vendor.o(($event) => $data.editingTitle = $event.detail.value),
    C: common_vendor.o((...args) => $options.closeEditTitleModal && $options.closeEditTitleModal(...args)),
    D: common_vendor.o((...args) => $options.confirmEditTitle && $options.confirmEditTitle(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fdb58938"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ai/ai.js.map
