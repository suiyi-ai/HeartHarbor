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
      // 风格数据
      styles: [
        { id: "friendly", name: "亲切友好", icon: "😊" },
        { id: "professional", name: "专业严谨", icon: "📊" },
        { id: "encouraging", name: "鼓励支持", icon: "🌟" },
        { id: "casual", name: "轻松随意", icon: "😄" }
      ],
      currentRole: { id: "companion", name: "心灵伙伴", icon: "💖", description: "温暖陪伴，情感支持" },
      currentStyle: { id: "friendly", name: "亲切友好", icon: "😊" }
    };
  },
  mounted() {
    this.loadUserPreferences();
    this.initConversationSystem();
  },
  methods: {
    // 初始化对话系统
    async initConversationSystem() {
      try {
        await utils_supabase.conversationService.checkSupabaseConnection();
        await this.loadConversations();
        if (!this.currentConversationId && this.conversations.length === 0) {
          await this.createNewConversation();
        }
        await this.loadConversationStats();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:245", "初始化对话系统失败", error);
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
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:261", "加载对话列表失败:", error);
      }
    },
    // 加载统计信息
    async loadConversationStats() {
      try {
        this.conversationStats = await utils_supabase.conversationService.getConversationStats();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:270", "加载统计信息失败:", error);
      }
    },
    // 创建新对话
    async createNewConversation() {
      try {
        const title = `${this.currentRole.name}的对话`;
        const conversation = await utils_supabase.conversationService.createConversation(
          title,
          this.currentRole.id,
          this.currentStyle.id
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
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:303", "创建新对话失�?", error);
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
        this.messages = messages;
        const conversationData = this.conversations.find((c) => c.id === conversationId);
        if (conversationData) {
          const role = this.roles.find((r) => r.id === conversationData.role_id);
          const style = this.styles.find((s) => s.id === conversationData.style_id);
          if (role)
            this.currentRole = role;
          if (style)
            this.currentStyle = style;
        }
        this.showHistoryPanel = false;
        this.$nextTick(() => {
          this.scrollTop = 99999;
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:340", "加载对话失败:", error);
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
              common_vendor.index.__f__("error", "at pages/ai/ai.vue:385", "删除对话失败:", error);
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
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:436", "更新标题失败:", error);
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
    // 获取风格名称
    getStyleName(styleId) {
      const style = this.styles.find((s) => s.id === styleId);
      return style ? style.name : "未知风格";
    },
    // 加载用户偏好设置
    loadUserPreferences() {
      try {
        const savedRole = common_vendor.index.getStorageSync("ai_role");
        const savedStyle = common_vendor.index.getStorageSync("ai_style");
        if (savedRole) {
          const role = this.roles.find((r) => r.id === savedRole);
          this.currentRole = role || this.roles[0];
        } else {
          this.currentRole = this.roles[0];
        }
        if (savedStyle) {
          const style = this.styles.find((s) => s.id === savedStyle);
          this.currentStyle = style || this.styles[0];
        } else {
          this.currentStyle = this.styles[0];
        }
      } catch (e) {
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:508", "加载用户偏好失败", e);
        this.currentRole = this.roles[0];
        this.currentStyle = this.styles[0];
      }
    },
    // 选择角色
    selectRole(roleId) {
      const role = this.roles.find((r) => r.id === roleId);
      if (role) {
        this.currentRole = role;
        common_vendor.index.setStorageSync("ai_role", roleId);
        this.addRoleGreeting();
      }
    },
    // 选择风格
    selectStyle(styleId) {
      const style = this.styles.find((s) => s.id === styleId);
      if (style) {
        this.currentStyle = style;
        common_vendor.index.setStorageSync("ai_style", styleId);
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
    // 显示虚拟人功能预�?
    showVirtualHumanPreview() {
      this.showVirtualHumanModal = true;
    },
    // 关闭虚拟人功能预�?
    closeVirtualHumanModal() {
      this.showVirtualHumanModal = false;
    },
    async sendMessage() {
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
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:585", "保存用户消息失败:", error);
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
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:615", "保存AI消息失败:", error);
        }
        common_vendor.index.showToast({
          title: "AI回复已生成",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/ai/ai.vue:626", "Dify API调用失败:", error);
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
          common_vendor.index.__f__("error", "at pages/ai/ai.vue:665", "保存降级消息失败:", error2);
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
          style: this.currentStyle.name,
          system_prompt: `你是一个${this.currentRole.name}，请以${this.currentStyle.name}的风格回复用户。你的角色描述是：${this.currentRole.description}`
        };
        const timeout = setTimeout(() => {
          reject(new Error("请求超时，请检查网络连接"));
        }, 1e4);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:703", "Dify API配置:", this.difyConfig);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:704", "完整URL:", this.difyConfig.apiUrl + this.difyConfig.endpoint);
        common_vendor.index.__f__("log", "at pages/ai/ai.vue:705", "结构化输入数据", inputs);
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
            common_vendor.index.__f__("log", "at pages/ai/ai.vue:728", "Dify API响应:", res);
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
            common_vendor.index.__f__("error", "at pages/ai/ai.vue:777", "Dify API调用失败:", err);
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
    // 根据角色和风格生成AI回复
    generateAIResponse(userMessage) {
      const baseResponses = {
        companion: {
          friendly: {
            pressure: "亲爱的，感受到你有些压力呢～这很正常哦！可以试试深呼吸放松一下，或者和我聊聊具体是什么让你感到压力？😊",
            happy: "真为你感到高兴！保持积极的心态很重要呢～愿意和我分享更多让你开心的事情吗？💖",
            sad: "听到你难过我也感到心疼呢。情绪波动是正常的，重要的是给自己时间和空间去感受和处理这些情绪。抱抱你～"
          },
          professional: {
            pressure: "我注意到您提到了一些压力感受。压力是常见的心理反应，建议您可以尝试一些放松技巧，比如深呼吸或渐进式肌肉放松。",
            happy: "为您感到高兴。积极情绪对心理健康有重要影响，建议继续保持这种积极状态。",
            sad: "理解您的情绪感受。情绪波动是正常的心理现象，建议给自己适当的情绪调节空间。"
          },
          encouraging: {
            pressure: "感受到你的压力，但请相信你有能力应对！每一次挑战都是成长的机会，加油！🌟",
            happy: "真棒！继续保持这种积极的状态，你的快乐也会感染身边的人～",
            sad: "难过的时候请记得，你并不孤单。每一次情绪波动都是自我了解的机会，相信你会变得更强大～"
          },
          casual: {
            pressure: "哈哈，压力山大啊？放松点，生活就是这样，有起有落～聊聊看具体啥情况？😄",
            happy: "哇，听起来不错嘛！开心的事情要多多分享，让快乐加倍！",
            sad: "哎，有时候确实会有点down呢。不过没关系，说出来就好多了，我在这儿听着呢～"
          }
        },
        advisor: {
          friendly: {
            pressure: "您好！从您的描述中我感受到一些压力。作为专业顾问，我建议您可以尝试认知行为疗法中的一些技巧来管理压力。",
            happy: "很高兴听到您的积极体验！积极情绪对心理健康有重要促进作用。",
            sad: "理解您的情绪困扰。从专业角度，建议您关注情绪调节策略的应用。"
          },
          professional: {
            pressure: "根据您的描述，建议采用压力管理三步骤：识别压力源、评估压力水平、实施应对策略。",
            happy: "积极情绪体验对心理健康具有正向影响，建议继续保持并记录积极事件。",
            sad: "情绪困扰需要系统评估，建议采用情绪日记进行追踪记录。"
          },
          encouraging: {
            pressure: "您展现出了很好的自我觉察能力！压力管理是一个学习过程，相信您能逐步掌握有效策略。",
            happy: "您的积极体验展示了良好的心理适应能力，这是心理健康的重要标志。",
            sad: "面对情绪困扰需要勇气，您已经迈出了重要一步。持续关注情绪健康会有积极回报。"
          },
          casual: {
            pressure: "压力这事儿，说大不大说小不小～关键是找到适合自己的调节方式，咱们一起分析分析？",
            happy: "不错嘛！积极情绪就像心理维生素，多多益善～",
            sad: "情绪有起伏很正常，重要的是学会和它们和平相处。有啥具体想聊的？"
          }
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
      const roleResponses = baseResponses[this.currentRole.id];
      const styleResponses = roleResponses[this.currentStyle.id];
      if (styleResponses && styleResponses[responseType]) {
        return styleResponses[responseType];
      }
      const defaultResponses = {
        companion: {
          friendly: "谢谢你的分享！我在这里倾听，如果你愿意，可以告诉我更多关于你的感受和想法。",
          professional: "感谢您的分享。我将基于专业角度为您提供分析建议。",
          encouraging: "感谢分享！每一次交流都是成长的机会，继续加油！🌟",
          casual: "哈哈，聊得不错嘛！还有什么想说的尽管来～😄"
        },
        advisor: {
          friendly: "感谢您的信任。作为专业顾问，我将为您提供理性的分析和建议。",
          professional: "收到您的信息。建议进一步详细描述具体情况以便精准分析。",
          encouraging: "感谢分享！专业咨询需要详细沟通，相信我们能找到有效解决方案。",
          casual: "好的，信息收到。咱们继续深入聊聊具体情况？"
        }
      };
      return defaultResponses[this.currentRole.id][this.currentStyle.id];
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.showVirtualHumanPreview && $options.showVirtualHumanPreview(...args)),
    b: common_vendor.t($data.currentRole.name),
    c: common_vendor.t($data.currentStyle.name),
    d: common_vendor.o((...args) => $options.createNewConversation && $options.createNewConversation(...args)),
    e: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args)),
    f: common_vendor.f($data.roles, (role, k0, i0) => {
      return {
        a: common_vendor.t(role.icon),
        b: common_vendor.t(role.name),
        c: common_vendor.t(role.description),
        d: role.id,
        e: $data.currentRole.id === role.id ? 1 : "",
        f: common_vendor.o(($event) => $options.selectRole(role.id), role.id)
      };
    }),
    g: common_vendor.f($data.styles, (style, k0, i0) => {
      return {
        a: common_vendor.t(style.icon),
        b: common_vendor.t(style.name),
        c: style.id,
        d: $data.currentStyle.id === style.id ? 1 : "",
        e: common_vendor.o(($event) => $options.selectStyle(style.id), style.id)
      };
    }),
    h: common_vendor.f($data.messages, (msg, index, i0) => {
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
    i: $data.isLoading
  }, $data.isLoading ? {
    j: common_vendor.t($data.currentRole.icon)
  } : {}, {
    k: $data.scrollTop,
    l: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    m: $data.inputText,
    n: common_vendor.o(($event) => $data.inputText = $event.detail.value),
    o: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    p: $data.showVirtualHumanModal
  }, $data.showVirtualHumanModal ? {
    q: common_vendor.o((...args) => $options.closeVirtualHumanModal && $options.closeVirtualHumanModal(...args))
  } : {}, {
    r: common_vendor.t($data.conversationStats.total),
    s: common_vendor.t($data.conversationStats.recent),
    t: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args)),
    v: common_vendor.f($data.conversations, (conversation, k0, i0) => {
      return {
        a: common_vendor.t(conversation.title),
        b: common_vendor.t($options.formatDate(conversation.updated_at)),
        c: common_vendor.t($options.getRoleName(conversation.role_id)),
        d: common_vendor.t($options.getStyleName(conversation.style_id)),
        e: common_vendor.o(($event) => $options.deleteConversation(conversation.id), conversation.id),
        f: common_vendor.o(($event) => $options.editConversationTitle(conversation), conversation.id),
        g: conversation.id,
        h: $data.currentConversationId === conversation.id ? 1 : "",
        i: common_vendor.o(($event) => $options.loadConversation(conversation.id), conversation.id)
      };
    }),
    w: $data.conversations.length === 0
  }, $data.conversations.length === 0 ? {} : {}, {
    x: $data.showHistoryPanel ? 1 : "",
    y: $data.showHistoryPanel
  }, $data.showHistoryPanel ? {
    z: common_vendor.o((...args) => $options.toggleHistoryPanel && $options.toggleHistoryPanel(...args))
  } : {}, {
    A: $data.showEditTitleModal
  }, $data.showEditTitleModal ? {
    B: common_vendor.o((...args) => $options.closeEditTitleModal && $options.closeEditTitleModal(...args)),
    C: $data.editingTitle,
    D: common_vendor.o(($event) => $data.editingTitle = $event.detail.value),
    E: common_vendor.o((...args) => $options.closeEditTitleModal && $options.closeEditTitleModal(...args)),
    F: common_vendor.o((...args) => $options.confirmEditTitle && $options.confirmEditTitle(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fdb58938"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ai/ai.js.map
