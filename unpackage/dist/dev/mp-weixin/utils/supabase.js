"use strict";
const common_vendor = require("../common/vendor.js");
const SUPABASE_CONFIG = {
  url: "https://etvdmnsernfiegfeadad.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY"
};
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
function convertLegacyUserId(legacyId) {
  if (isValidUUID(legacyId)) {
    return legacyId;
  }
  const hash = legacyId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = (hash + Math.random() * 16) % 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function getUserId() {
  let userId = common_vendor.index.getStorageSync("user_id");
  if (!userId) {
    userId = generateUUID();
    common_vendor.index.setStorageSync("user_id", userId);
    common_vendor.index.__f__("log", "at utils/supabase.js:49", "生成新用户ID（UUID格式）:", userId);
  } else if (!isValidUUID(userId)) {
    const newUserId = convertLegacyUserId(userId);
    common_vendor.index.__f__("log", "at utils/supabase.js:53", "转换旧用户ID格式:", userId, "->", newUserId);
    userId = newUserId;
    common_vendor.index.setStorageSync("user_id", userId);
  }
  return userId;
}
function buildSupabaseQuery(params) {
  const parts = [];
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== null && value !== void 0) {
      if (key === "select") {
        parts.push(`select=${encodeURIComponent(value)}`);
      } else if (key === "order") {
        parts.push(`order=${encodeURIComponent(value)}`);
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  });
  return parts.join("&");
}
function handleSupabaseError(response, url, options) {
  let errorMessage = `API Error: ${response.statusCode}`;
  if (response.data) {
    if (response.data.message) {
      errorMessage += ` - ${response.data.message}`;
      if (response.data.message.includes("invalid input syntax for type uuid")) {
        errorMessage += " (用户ID格式错误，已自动修复)";
        const oldUserId = common_vendor.index.getStorageSync("user_id");
        const newUserId = generateUUID();
        common_vendor.index.setStorageSync("user_id", newUserId);
        common_vendor.index.__f__("warn", "at utils/supabase.js:100", "检测到UUID格式错误，已重新生成用户ID:", {
          oldUserId,
          newUserId
        });
      }
    }
    if (response.data.hint) {
      errorMessage += ` (${response.data.hint})`;
    }
    if (response.data.details) {
      errorMessage += ` [${response.data.details}]`;
    }
  }
  common_vendor.index.__f__("error", "at utils/supabase.js:114", "Supabase API错误详情:", {
    url,
    method: options.method,
    statusCode: response.statusCode,
    error: errorMessage,
    responseData: response.data
  });
  return new Error(errorMessage);
}
async function migrateUserData() {
  const oldUserId = common_vendor.index.getStorageSync("user_id_legacy");
  const currentUserId = common_vendor.index.getStorageSync("user_id");
  if (!oldUserId && currentUserId && !isValidUUID(currentUserId)) {
    common_vendor.index.setStorageSync("user_id_legacy", currentUserId);
    const newUserId = generateUUID();
    common_vendor.index.setStorageSync("user_id", newUserId);
    common_vendor.index.__f__("log", "at utils/supabase.js:138", "执行用户数据迁移:", {
      oldUserId: currentUserId,
      newUserId
    });
    return newUserId;
  }
  return currentUserId;
}
class SupabaseService {
  constructor() {
    this.userId = getUserId();
    this.isConnected = false;
    this.initConnection();
  }
  // 初始化连接（增强版本）
  async initConnection() {
    try {
      await migrateUserData();
      if (!isValidUUID(this.userId)) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:165", "用户ID格式无效，重新生成:", this.userId);
        this.userId = generateUUID();
        common_vendor.index.setStorageSync("user_id", this.userId);
      }
      await this.testConnection();
      this.isConnected = true;
      common_vendor.index.__f__("log", "at utils/supabase.js:172", "Supabase MCP连接成功，用户ID:", this.userId);
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:174", "Supabase MCP连接失败，将使用降级方案:", error);
      this.isConnected = false;
    }
  }
  // 测试连接
  async testConnection() {
    const testResult = await this.callApi("conversations", {
      method: "GET",
      queryParams: {
        limit: 1
      }
    });
    return testResult;
  }
  // 增强的API调用方法（修复HTTP 400错误）
  async callApi(endpoint, options = {}) {
    if (!this.isConnected) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:194", "Supabase连接不可用，返回空数据");
      return options.method === "GET" ? [] : null;
    }
    let url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
    const defaultOptions = {
      method: "GET",
      header: {
        "apikey": SUPABASE_CONFIG.anonKey,
        "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      timeout: 15e3
    };
    if (options.method === "GET" && options.queryParams) {
      const queryString = buildSupabaseQuery(options.queryParams);
      if (queryString) {
        url += "?" + queryString;
      }
    }
    const finalOptions = {
      ...defaultOptions,
      ...options,
      url,
      header: {
        ...defaultOptions.header,
        ...options.header || {}
      }
    };
    if ((options.method === "POST" || options.method === "PATCH") && options.data) {
      finalOptions.data = JSON.stringify(options.data);
    }
    common_vendor.index.__f__("log", "at utils/supabase.js:236", `MCP API调用: ${finalOptions.method} ${url}`);
    common_vendor.index.__f__("log", "at utils/supabase.js:237", "查询参数:", options.queryParams);
    try {
      const response = await common_vendor.index.request(finalOptions);
      common_vendor.index.__f__("log", "at utils/supabase.js:242", "API响应状态码:", response.statusCode);
      common_vendor.index.__f__("log", "at utils/supabase.js:243", "API响应数据:", response.data);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      } else {
        throw handleSupabaseError(response, url, options);
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:251", "Supabase API调用失败:", error);
      common_vendor.index.__f__("error", "at utils/supabase.js:252", "请求详情:", {
        url,
        method: finalOptions.method,
        headers: finalOptions.header
      });
      throw error;
    }
  }
  // 创建新对话（修复版本）
  async createConversation(title, roleId, styleId) {
    try {
      const data = {
        user_id: this.userId,
        title: title || "新对话",
        role_id: roleId,
        style_id: styleId,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:274", "MCP: 创建对话，数据:", data);
      const result = await this.callApi("conversations", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:285", "MCP: 创建对话成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:288", "MCP: 创建对话失败:", error);
      throw error;
    }
  }
  // 获取用户的所有对话（修复HTTP 400错误）
  async getUserConversations() {
    try {
      common_vendor.index.__f__("log", "at utils/supabase.js:296", "MCP: 获取用户对话，用户ID:", this.userId);
      const result = await this.callApi("conversations", {
        method: "GET",
        queryParams: {
          user_id: `eq.${this.userId}`,
          is_active: "eq.true",
          select: "*"
        }
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:307", "MCP: 获取对话成功，数量:", result ? result.length : 0);
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:310", "MCP: 获取用户对话失败:", error);
      return [];
    }
  }
  // 获取对话的详细信息（修复版本）
  async getConversation(conversationId) {
    try {
      common_vendor.index.__f__("log", "at utils/supabase.js:319", "MCP: 获取对话详情，对话ID:", conversationId);
      const result = await this.callApi("conversations", {
        method: "GET",
        queryParams: {
          id: `eq.${conversationId}`,
          select: "*"
        }
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:329", "MCP: 获取对话详情成功:", result ? result[0] : null);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:332", "MCP: 获取对话详情失败:", error);
      return null;
    }
  }
  // 获取对话的所有消息（修复版本）
  async getConversationMessages(conversationId) {
    try {
      common_vendor.index.__f__("log", "at utils/supabase.js:340", "MCP: 获取对话消息，对话ID:", conversationId);
      const result = await this.callApi("messages", {
        method: "GET",
        queryParams: {
          conversation_id: `eq.${conversationId}`,
          order: "created_at.asc",
          select: "*"
        }
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:351", "MCP: 获取消息成功，数量:", result ? result.length : 0);
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:354", "MCP: 获取对话消息失败:", error);
      return [];
    }
  }
  // 保存消息（修复版本）
  async saveMessage(conversationId, role, content) {
    try {
      const data = {
        conversation_id: conversationId,
        role,
        content,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:369", "MCP: 保存消息，数据:", data);
      const result = await this.callApi("messages", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:380", "MCP: 保存消息成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:383", "MCP: 保存消息失败:", error);
      throw error;
    }
  }
  // 更新对话标题（修复版本）
  async updateConversationTitle(conversationId, title) {
    try {
      const data = {
        title,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:396", "MCP: 更新对话标题，对话ID:", conversationId, "标题:", title);
      const result = await this.callApi("conversations", {
        method: "PATCH",
        queryParams: {
          id: `eq.${conversationId}`
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:406", "MCP: 更新对话标题成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:409", "MCP: 更新对话标题失败:", error);
      throw error;
    }
  }
  // 删除对话（软删除，修复版本）
  async deleteConversation(conversationId) {
    try {
      const data = {
        is_active: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:422", "MCP: 删除对话，对话ID:", conversationId);
      const result = await this.callApi("conversations", {
        method: "PATCH",
        queryParams: {
          id: `eq.${conversationId}`
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:432", "MCP: 删除对话成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:435", "MCP: 删除对话失败:", error);
      throw error;
    }
  }
  // 获取对话统计信息（修复版本）
  async getConversationStats() {
    try {
      const conversations = await this.getUserConversations();
      const stats = {
        total: conversations.length,
        recent: conversations.filter((conv) => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
          return new Date(conv.created_at) > oneWeekAgo;
        }).length
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:453", "MCP: 获取统计信息成功:", stats);
      return stats;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:456", "MCP: 获取统计信息失败:", error);
      return { total: 0, recent: 0 };
    }
  }
}
class LocalStorageService {
  constructor() {
    this.storageKey = "ai_conversations";
    this.userId = getUserId();
  }
  // 生成本地ID
  generateId() {
    return "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
  // 获取所有对话
  getConversations() {
    const data = common_vendor.index.getStorageSync(this.storageKey) || {};
    return data[this.userId] || [];
  }
  // 保存对话
  saveConversation(conversation) {
    const data = common_vendor.index.getStorageSync(this.storageKey) || {};
    const userData = data[this.userId] || [];
    if (!conversation.id) {
      conversation.id = this.generateId();
      conversation.created_at = (/* @__PURE__ */ new Date()).toISOString();
      conversation.updated_at = conversation.created_at;
      userData.push(conversation);
    } else {
      const index = userData.findIndex((c) => c.id === conversation.id);
      if (index >= 0) {
        conversation.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        userData[index] = conversation;
      } else {
        userData.push(conversation);
      }
    }
    data[this.userId] = userData;
    common_vendor.index.setStorageSync(this.storageKey, data);
    return conversation;
  }
  // 保存消息
  saveMessage(conversationId, role, content) {
    const conversations = this.getConversations();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      if (!conversation.messages) {
        conversation.messages = [];
      }
      const message = {
        id: this.generateId(),
        conversation_id: conversationId,
        role,
        content,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      conversation.messages.push(message);
      conversation.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      this.saveConversation(conversation);
      return message;
    }
    return null;
  }
  // 删除对话
  deleteConversation(conversationId) {
    const conversations = this.getConversations();
    const filtered = conversations.filter((c) => c.id !== conversationId);
    const data = common_vendor.index.getStorageSync(this.storageKey) || {};
    data[this.userId] = filtered;
    common_vendor.index.setStorageSync(this.storageKey, data);
    return true;
  }
}
class ConversationService {
  constructor() {
    this.supabaseService = new SupabaseService();
    this.localService = new LocalStorageService();
    this.useSupabase = this.supabaseService.isConnected;
  }
  // 检查Supabase连接（增强版本）
  async checkSupabaseConnection() {
    try {
      const isConnected = this.supabaseService.isConnected;
      this.useSupabase = isConnected;
      common_vendor.index.__f__("log", "at utils/supabase.js:560", "MCP连接状态检查:", { useSupabase: this.useSupabase, isConnected });
      return isConnected;
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:563", "MCP连接检查失败，切换到本地存储:", error);
      this.useSupabase = false;
      return false;
    }
  }
  // 智能创建对话（增强版本）
  async createConversation(title, roleId, styleId) {
    if (this.useSupabase) {
      try {
        const result = await this.supabaseService.createConversation(title, roleId, styleId);
        if (result) {
          this.localService.saveConversation(result);
          return result;
        }
      } catch (error) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:581", "MCP创建对话失败，使用本地存储:", error);
        this.useSupabase = false;
      }
    }
    return this.localService.saveConversation({
      title: title || "新对话",
      role_id: roleId,
      style_id: styleId,
      is_active: true,
      messages: []
    });
  }
  // 智能获取用户对话（增强版本）
  async getUserConversations() {
    if (this.useSupabase) {
      try {
        const result = await this.supabaseService.getUserConversations();
        if (result && result.length > 0) {
          result.forEach((conv) => this.localService.saveConversation(conv));
          return result;
        }
      } catch (error) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:608", "MCP获取对话失败，切换到本地存储:", error);
        this.useSupabase = false;
      }
    }
    return this.localService.getConversations();
  }
  // 保存消息
  async saveMessage(conversationId, role, content) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.saveMessage(conversationId, role, content);
      } catch (error) {
        this.useSupabase = false;
      }
    }
    return this.localService.saveMessage(conversationId, role, content);
  }
  // 更新对话标题
  async updateConversationTitle(conversationId, title) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.updateConversationTitle(conversationId, title);
      } catch (error) {
        this.useSupabase = false;
      }
    }
    const conversations = this.localService.getConversations();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.title = title;
      return this.localService.saveConversation(conversation);
    }
    return null;
  }
  // 删除对话
  async deleteConversation(conversationId) {
    if (this.useSupabase) {
      try {
        return await this.supabaseService.deleteConversation(conversationId);
      } catch (error) {
        this.useSupabase = false;
      }
    }
    return this.localService.deleteConversation(conversationId);
  }
  // 获取统计信息
  async getConversationStats() {
    const conversations = await this.getUserConversations();
    const stats = {
      total: conversations.length,
      recent: conversations.filter((conv) => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
        return new Date(conv.created_at) > oneWeekAgo;
      }).length
    };
    return stats;
  }
}
const conversationService = new ConversationService();
exports.conversationService = conversationService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/supabase.js.map
