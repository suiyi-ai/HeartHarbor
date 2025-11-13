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
  // 优先从登录用户信息中获取用户ID
  try {
    const currentUserStr = common_vendor.index.getStorageSync("current_user");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser && currentUser.id) {
        common_vendor.index.__f__("log", "at utils/supabase.js:49", "使用登录用户ID:", currentUser.id);
        return currentUser.id;
      }
    }
  } catch (error) {
    common_vendor.index.__f__("warn", "at utils/supabase.js:55", "获取登录用户信息失败:", error);
  }
  
  // 如果没有登录用户，使用本地存储的匿名用户ID
  let userId = common_vendor.index.getStorageSync("user_id");
  if (!userId) {
    userId = generateUUID();
    common_vendor.index.setStorageSync("user_id", userId);
    common_vendor.index.__f__("log", "at utils/supabase.js:61", "生成新匿名用户ID（UUID格式）:", userId);
  } else if (!isValidUUID(userId)) {
    const newUserId = convertLegacyUserId(userId);
    common_vendor.index.__f__("log", "at utils/supabase.js:65", "转换旧用户ID格式:", userId, "->", newUserId);
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
    // 不在构造函数中设置 userId，改为动态获取
    this.isConnected = false;
    this.initConnection();
  }
  
  // 获取当前用户ID（支持动态获取，优先使用登录用户ID）
  getUserId() {
    // 优先从登录用户信息中获取用户ID
    try {
      const currentUserStr = common_vendor.index.getStorageSync("current_user");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.id) {
          common_vendor.index.__f__("log", "at utils/supabase.js:139", "使用登录用户ID:", currentUser.id);
          return currentUser.id;
        }
      }
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:147", "获取登录用户信息失败:", error);
    }
    
    // 如果没有登录用户，使用本地存储的匿名用户ID
    let userId = common_vendor.index.getStorageSync("user_id");
    if (!userId) {
      userId = generateUUID();
      common_vendor.index.setStorageSync("user_id", userId);
      common_vendor.index.__f__("log", "at utils/supabase.js:155", "生成新匿名用户ID（UUID格式）:", userId);
    } else if (!isValidUUID(userId)) {
      const newUserId = convertLegacyUserId(userId);
      common_vendor.index.__f__("log", "at utils/supabase.js:159", "转换旧用户ID格式:", userId, "->", newUserId);
      userId = newUserId;
      common_vendor.index.setStorageSync("user_id", userId);
    }
    return userId;
  }
  
  // 初始化连接（修复版本）
  async initConnection() {
    try {
      await migrateUserData();
      // 验证用户ID格式
      const userId = this.getUserId();
      if (!isValidUUID(userId)) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:171", "用户ID格式无效，重新生成:", userId);
        const newUserId = generateUUID();
        common_vendor.index.setStorageSync("user_id", newUserId);
      }
      
      // 直接测试连接，不依赖isConnected状态
      const testResult = await this.testConnection();
      this.isConnected = true;
      common_vendor.index.__f__("log", "at utils/supabase.js:178", "Supabase MCP连接成功，用户ID:", this.getUserId());
      return testResult;
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:174", "Supabase MCP连接失败，将使用降级方案:", error);
      this.isConnected = false;
      throw error;
    }
  }
  // 测试连接（修复版本）
  async testConnection() {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/conversations?limit=1`;
    const options = {
      method: "GET",
      header: {
        "apikey": SUPABASE_CONFIG.anonKey,
        "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
        "Content-Type": "application/json"
      },
      timeout: 10e3
    };
    
    common_vendor.index.__f__("log", "at utils/supabase.js:175", "测试Supabase连接:", url);
    
    try {
      const response = await common_vendor.index.request({
        url,
        ...options
      });
      
      common_vendor.index.__f__("log", "at utils/supabase.js:183", "连接测试响应状态码:", response.statusCode);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      } else {
        throw handleSupabaseError(response, url, options);
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:191", "Supabase连接测试失败:", error);
      throw error;
    }
  }
  // API调用方法
  async callApi(endpoint, options = {}) {
    if (!this.isConnected) {
      throw new Error("Supabase连接不可用，请检查网络连接");
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
    if (options.queryParams) {
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
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      
      // 确保 styleId 不为 null 或 undefined
      // 如果没有提供，使用默认值 'friendly'
      const finalStyleId = styleId || 'friendly';
      
      const data = {
        user_id: userId,
        title: title || "新对话",
        role_id: roleId,
        style_id: finalStyleId, // 确保不为 null
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:274", "MCP: 创建对话，用户ID:", userId, "数据:", data);
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
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      common_vendor.index.__f__("log", "at utils/supabase.js:296", "MCP: 获取用户对话，用户ID:", userId);
      const result = await this.callApi("conversations", {
        method: "GET",
        queryParams: {
          user_id: `eq.${userId}`,
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
  // 获取对话的详细信息（修复版本，支持用户验证）
  async getConversation(conversationId, verifyUser = false) {
    try {
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      common_vendor.index.__f__("log", "at utils/supabase.js:319", "MCP: 获取对话详情，对话ID:", conversationId, "用户ID:", userId);
      
      // 构建查询参数
      const queryParams = {
        id: `eq.${conversationId}`,
        select: "*"
      };
      
      // 如果需要验证用户，添加用户ID过滤
      if (verifyUser) {
        queryParams.user_id = `eq.${userId}`;
      }
      
      const result = await this.callApi("conversations", {
        method: "GET",
        queryParams: queryParams
      });
      
      const conversation = result ? result[0] : null;
      
      // 如果找到了对话，验证用户所有权
      if (conversation && verifyUser && conversation.user_id !== userId) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:340", "MCP: 对话不属于当前用户，对话ID:", conversationId);
        return null;
      }
      
      common_vendor.index.__f__("log", "at utils/supabase.js:345", "MCP: 获取对话详情成功:", conversation);
      return conversation;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:348", "MCP: 获取对话详情失败:", error);
      return null;
    }
  }
  
  // 获取对话的所有消息（修复版本）
  async getConversationMessages(conversationId) {
    try {
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      
      // 首先验证对话属于当前用户
      const conversation = await this.getConversation(conversationId, true);
      if (!conversation) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:361", "MCP: 对话不存在或不属于当前用户，对话ID:", conversationId);
        return [];
      }
      
      common_vendor.index.__f__("log", "at utils/supabase.js:365", "MCP: 获取对话消息，对话ID:", conversationId, "用户ID:", userId);
      const result = await this.callApi("messages", {
        method: "GET",
        queryParams: {
          conversation_id: `eq.${conversationId}`,
          order: "created_at.asc",
          select: "*"
        }
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:376", "MCP: 获取消息成功，数量:", result ? result.length : 0);
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:379", "MCP: 获取对话消息失败:", error);
      return [];
    }
  }
  // 保存消息（修复版本）
  async saveMessage(conversationId, role, content) {
    try {
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      
      // 首先验证对话属于当前用户
      const conversation = await this.getConversation(conversationId, true);
      if (!conversation) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:391", "MCP: 对话不存在或不属于当前用户，无法保存消息，对话ID:", conversationId);
        throw new Error("对话不存在或不属于当前用户");
      }
      
      const data = {
        conversation_id: conversationId,
        role,
        content,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:400", "MCP: 保存消息，用户ID:", userId, "数据:", data);
      const result = await this.callApi("messages", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:411", "MCP: 保存消息成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:414", "MCP: 保存消息失败:", error);
      throw error;
    }
  }
  // 更新对话标题（修复版本）
  async updateConversationTitle(conversationId, title) {
    try {
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      
      // 首先验证对话属于当前用户
      const conversation = await this.getConversation(conversationId, true);
      if (!conversation) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:424", "MCP: 对话不存在或不属于当前用户，无法更新标题，对话ID:", conversationId);
        throw new Error("对话不存在或不属于当前用户");
      }
      
      const data = {
        title,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:432", "MCP: 更新对话标题，用户ID:", userId, "对话ID:", conversationId, "标题:", title);
      const result = await this.callApi("conversations", {
        method: "PATCH",
        queryParams: {
          id: `eq.${conversationId}`,
          user_id: `eq.${userId}` // 确保只更新当前用户的对话
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:442", "MCP: 更新对话标题成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:445", "MCP: 更新对话标题失败:", error);
      throw error;
    }
  }
  // 删除对话（软删除，修复版本）
  async deleteConversation(conversationId) {
    try {
      // 确保使用最新的用户ID（支持用户登录后动态更新）
      const userId = this.getUserId();
      
      // 首先验证对话属于当前用户
      const conversation = await this.getConversation(conversationId, true);
      if (!conversation) {
        common_vendor.index.__f__("warn", "at utils/supabase.js:456", "MCP: 对话不存在或不属于当前用户，无法删除，对话ID:", conversationId);
        throw new Error("对话不存在或不属于当前用户");
      }
      
      const data = {
        is_active: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:464", "MCP: 删除对话，用户ID:", userId, "对话ID:", conversationId);
      const result = await this.callApi("conversations", {
        method: "PATCH",
        queryParams: {
          id: `eq.${conversationId}`,
          user_id: `eq.${userId}` // 确保只删除当前用户的对话
        },
        data
      });
      common_vendor.index.__f__("log", "at utils/supabase.js:474", "MCP: 删除对话成功:", result);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:477", "MCP: 删除对话失败:", error);
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
  
  // ========== 树洞功能相关方法 ==========
  
  // 创建树洞帖子
  async createTreeholePost(content, emotion = 'neutral', isAnonymous = true) {
    try {
      const userId = this.getUserId();
      const data = {
        user_id: userId,
        content: content,
        emotion: emotion,
        is_anonymous: isAnonymous,
        like_count: 0,
        comment_count: 0,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.__f__("log", "at utils/supabase.js:525", "MCP: 创建树洞帖子");
      const result = await this.callApi("treehole_posts", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data
      });
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:540", "MCP: 创建树洞帖子失败:", error);
      if (error.message && error.message.includes('does not exist')) {
        return null;
      }
      throw error;
    }
  }
  
  // 获取树洞帖子列表（分页）
  async getTreeholePosts(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.callApi("treehole_posts", {
        method: "GET",
        queryParams: {
          is_active: "eq.true",
          order: "created_at.desc",
          limit: `${limit}`,
          offset: `${offset}`,
          select: "*"
        }
      });
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:562", "MCP: 获取树洞帖子列表失败:", error);
      if (error.message && error.message.includes('does not exist')) {
        return [];
      }
      return [];
    }
  }
  
  // 点赞树洞帖子
  async likeTreeholePost(postId) {
    try {
      const userId = this.getUserId();
      const existingLike = await this.callApi("treehole_likes", {
        method: "GET",
        queryParams: {
          post_id: `eq.${postId}`,
          user_id: `eq.${userId}`,
          select: "*"
        }
      });
      
      if (existingLike && existingLike.length > 0) {
        await this.callApi("treehole_likes", {
          method: "DELETE",
          queryParams: {
            post_id: `eq.${postId}`,
            user_id: `eq.${userId}`
          }
        });
        await this.updateTreeholePostLikeCount(postId, -1);
        return { liked: false };
      } else {
        await this.callApi("treehole_likes", {
          method: "POST",
          header: {
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          data: {
            post_id: postId,
            user_id: userId,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        await this.updateTreeholePostLikeCount(postId, 1);
        return { liked: true };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:603", "MCP: 点赞树洞帖子失败:", error);
      throw error;
    }
  }
  
  // 更新树洞帖子点赞数
  async updateTreeholePostLikeCount(postId, delta) {
    try {
      const post = await this.callApi("treehole_posts", {
        method: "GET",
        queryParams: {
          id: `eq.${postId}`,
          select: "like_count"
        }
      });
      
      if (post && post.length > 0) {
        const newLikeCount = Math.max(0, (post[0].like_count || 0) + delta);
        await this.callApi("treehole_posts", {
          method: "PATCH",
          queryParams: {
            id: `eq.${postId}`
          },
          data: {
            like_count: newLikeCount,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:631", "MCP: 更新树洞帖子点赞数失败:", error);
    }
  }
  
  // 检查用户是否已点赞某个帖子
  async checkUserLikedPost(postId) {
    try {
      const userId = this.getUserId();
      const result = await this.callApi("treehole_likes", {
        method: "GET",
        queryParams: {
          post_id: `eq.${postId}`,
          user_id: `eq.${userId}`,
          select: "*"
        }
      });
      return result && result.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  // 获取树洞帖子的评论列表
  async getTreeholeComments(postId) {
    try {
      const result = await this.callApi("treehole_comments", {
        method: "GET",
        queryParams: {
          post_id: `eq.${postId}`,
          order: "created_at.asc",
          select: "*"
        }
      });
      return result || [];
    } catch (error) {
      return [];
    }
  }
  
  // 添加树洞评论
  async addTreeholeComment(postId, content, isAnonymous = true) {
    try {
      const userId = this.getUserId();
      const data = {
        post_id: postId,
        user_id: userId,
        content: content,
        is_anonymous: isAnonymous,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await this.callApi("treehole_comments", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data
      });
      
      await this.updateTreeholePostCommentCount(postId, 1);
      return result ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:685", "MCP: 添加树洞评论失败:", error);
      throw error;
    }
  }
  
  // 删除树洞帖子
  async deleteTreeholePost(postId) {
    try {
      const userId = this.getUserId();
      
      // 先检查帖子是否存在且属于当前用户
      const post = await this.callApi("treehole_posts", {
        method: "GET",
        queryParams: {
          id: `eq.${postId}`,
          user_id: `eq.${userId}`,
          select: "id"
        }
      });
      
      if (!post || post.length === 0) {
        throw new Error("帖子不存在或无权删除");
      }
      
      // 删除帖子（级联删除会自动删除相关的点赞和评论）
      await this.callApi("treehole_posts", {
        method: "DELETE",
        queryParams: {
          id: `eq.${postId}`,
          user_id: `eq.${userId}`
        }
      });
      
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:750", "MCP: 删除树洞帖子失败:", error);
      throw error;
    }
  }
  
  // 更新树洞帖子评论数
  async updateTreeholePostCommentCount(postId, delta) {
    try {
      const post = await this.callApi("treehole_posts", {
        method: "GET",
        queryParams: {
          id: `eq.${postId}`,
          select: "comment_count"
        }
      });
      
      if (post && post.length > 0) {
        const newCommentCount = Math.max(0, (post[0].comment_count || 0) + delta);
        await this.callApi("treehole_posts", {
          method: "PATCH",
          queryParams: {
            id: `eq.${postId}`
          },
          data: {
            comment_count: newCommentCount,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:715", "MCP: 更新树洞帖子评论数失败:", error);
    }
  }
  
  // ============================================
  // 心理库文章相关方法
  // ============================================
  
  // 获取文章列表
  async getArticles(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        isHot = null,
        isNew = null,
        search = null,
        orderBy = 'created_at',
        order = 'desc'
      } = params;
      
      const queryParams = {
        is_active: 'eq.true',
        select: '*',
        order: `${orderBy}.${order}`,
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString()
      };
      
      // 按分类筛选
      if (category && category !== 'all') {
        queryParams.category_name = `eq.${category}`;
      }
      
      // 按热门筛选
      if (isHot !== null) {
        queryParams.is_hot = `eq.${isHot}`;
      }
      
      // 按新文章筛选
      if (isNew !== null) {
        queryParams.is_new = `eq.${isNew}`;
      }
      
      // 按搜索关键词筛选
      // 注意：Supabase REST API 不支持直接在 URL 中使用 or 查询
      // 如果需要多字段搜索，需要使用 PostgreSQL 的函数或在前端过滤
      // 这里我们使用 title 作为主要搜索字段
      // 更复杂的搜索可以通过 RPC 函数实现
      if (search && search.trim()) {
        // 使用 title 字段进行搜索
        queryParams.title = `ilike.%${search.trim()}%`;
      }
      
      const articles = await this.callApi("articles", {
        method: "GET",
        queryParams
      });
      
      // 转换数据格式，适配前端
      return articles.map(article => ({
        id: article.id,
        title: article.title,
        category: article.category_name || article.category,
        summary: article.summary,
        content: article.content,
        readTime: article.read_time || 5,
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        favoriteCount: article.favorite_count || 0,
        date: article.published_at || article.created_at,
        isHot: article.is_hot || false,
        isNew: article.is_new || false,
        isFeatured: article.is_featured || false,
        isFavorited: false, // 需要单独查询收藏状态
        authorName: article.author_name,
        coverImageUrl: article.cover_image_url,
        tags: article.tags || []
      }));
    } catch (error) {
      // 如果是表不存在的错误，给出明确的提示
      if (error.message && error.message.includes('Could not find the table')) {
        const errorMsg = '数据库表不存在，请先在Supabase中执行 scripts/create_library_tables_improved.sql 创建表结构';
        common_vendor.index.__f__("error", "at utils/supabase.js:853", errorMsg);
        throw new Error(errorMsg);
      }
      common_vendor.index.__f__("error", "at utils/supabase.js:853", "MCP: 获取文章列表失败:", error);
      throw error;
    }
  }
  
  // 获取文章详情
  async getArticleById(articleId) {
    try {
      const articles = await this.callApi("articles", {
        method: "GET",
        queryParams: {
          id: `eq.${articleId}`,
          is_active: 'eq.true',
          select: '*'
        }
      });
      
      if (!articles || articles.length === 0) {
        throw new Error("文章不存在");
      }
      
      const article = articles[0];
      
      // 转换数据格式
      return {
        id: article.id,
        title: article.title,
        category: article.category_name || article.category,
        summary: article.summary,
        content: article.content,
        readTime: article.read_time || 5,
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        favoriteCount: article.favorite_count || 0,
        date: article.published_at || article.created_at,
        isHot: article.is_hot || false,
        isNew: article.is_new || false,
        isFeatured: article.is_featured || false,
        isFavorited: false, // 需要单独查询收藏状态
        authorName: article.author_name,
        coverImageUrl: article.cover_image_url,
        tags: article.tags || [],
        seoKeywords: article.seo_keywords,
        seoDescription: article.seo_description
      };
    } catch (error) {
      // 如果是表不存在的错误，给出明确的提示
      if (error.message && error.message.includes('Could not find the table')) {
        const errorMsg = '数据库表不存在，请先在Supabase中执行 scripts/create_library_tables_improved.sql 创建表结构';
        common_vendor.index.__f__("error", "at utils/supabase.js:903", errorMsg);
        throw new Error(errorMsg);
      }
      common_vendor.index.__f__("error", "at utils/supabase.js:903", "MCP: 获取文章详情失败:", error);
      throw error;
    }
  }
  
  // 检查用户是否收藏了文章
  async checkUserFavoriteArticle(articleId) {
    try {
      const userId = this.getUserId();
      const favorites = await this.callApi("article_favorites", {
        method: "GET",
        queryParams: {
          article_id: `eq.${articleId}`,
          user_id: `eq.${userId}`,
          select: 'id'
        }
      });
      
      return favorites && favorites.length > 0;
    } catch (error) {
      // 如果是表不存在的错误，抛出明确的错误
      if (error.message && error.message.includes('Could not find the table')) {
        const errorMsg = '数据库表 article_favorites 不存在，请先在Supabase中执行 scripts/create_library_tables.sql 创建表结构';
        common_vendor.index.__f__("error", "at utils/supabase.js:902", errorMsg);
        throw new Error(errorMsg);
      }
      // 其他错误才记录
      common_vendor.index.__f__("warn", "at utils/supabase.js:902", "MCP: 检查收藏状态失败:", error);
      return false;
    }
  }
  
  // 切换文章收藏状态
  async toggleArticleFavorite(articleId) {
    try {
      const userId = this.getUserId();
      const isFavorited = await this.checkUserFavoriteArticle(articleId);
      
      if (isFavorited) {
        // 取消收藏
        await this.callApi("article_favorites", {
          method: "DELETE",
          queryParams: {
            article_id: `eq.${articleId}`,
            user_id: `eq.${userId}`
          }
        });
        return { favorited: false };
      } else {
        // 添加收藏
        await this.callApi("article_favorites", {
          method: "POST",
          data: {
            article_id: articleId,
            user_id: userId
          }
        });
        return { favorited: true };
      }
    } catch (error) {
      // 如果是表不存在的错误，给出明确的提示
      if (error.message && error.message.includes('Could not find the table')) {
        const errorMsg = '数据库表 article_favorites 不存在，请先在Supabase中执行 scripts/create_library_tables.sql 创建表结构';
        common_vendor.index.__f__("error", "at utils/supabase.js:928", errorMsg);
        throw new Error(errorMsg);
      }
      common_vendor.index.__f__("error", "at utils/supabase.js:928", "MCP: 切换收藏状态失败:", error);
      throw error;
    }
  }
  
  // 保存阅读历史
  async saveArticleReadHistory(articleId, readProgress = 100, readDuration = 0) {
    try {
      const userId = this.getUserId();
      
      // 先检查是否已存在阅读历史
      const existingHistory = await this.callApi("article_read_history", {
        method: "GET",
        queryParams: {
          article_id: `eq.${articleId}`,
          user_id: `eq.${userId}`,
          select: 'id,read_progress,read_duration'
        }
      });
      
      if (existingHistory && existingHistory.length > 0) {
        // 更新现有记录
        await this.callApi("article_read_history", {
          method: "PATCH",
          queryParams: {
            article_id: `eq.${articleId}`,
            user_id: `eq.${userId}`
          },
          data: {
            read_progress: readProgress,
            read_duration: (existingHistory[0].read_duration || 0) + readDuration,
            last_read_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      } else {
        // 创建新记录
        await this.callApi("article_read_history", {
          method: "POST",
          data: {
            article_id: articleId,
            user_id: userId,
            read_progress: readProgress,
            read_duration: readDuration,
            last_read_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      
      // 增加文章浏览数
      await this.increaseArticleViewCount(articleId);
      
      return true;
    } catch (error) {
      // 如果是表不存在的错误，给出明确的提示
      if (error.message && error.message.includes('Could not find the table')) {
        const errorMsg = '数据库表 article_read_history 不存在，请先在Supabase中执行 scripts/create_library_tables.sql 创建表结构';
        common_vendor.index.__f__("error", "at utils/supabase.js:955", errorMsg);
        throw new Error(errorMsg);
      }
      common_vendor.index.__f__("error", "at utils/supabase.js:955", "MCP: 保存阅读历史失败:", error);
      // 不抛出错误，阅读历史保存失败不影响主流程
      return false;
    }
  }
  
  // 增加文章浏览数
  async increaseArticleViewCount(articleId) {
    try {
      // 先获取当前浏览数
      const articles = await this.callApi("articles", {
        method: "GET",
        queryParams: {
          id: `eq.${articleId}`,
          select: "view_count"
        }
      });
      
      if (articles && articles.length > 0) {
        const newViewCount = (articles[0].view_count || 0) + 1;
        await this.callApi("articles", {
          method: "PATCH",
          queryParams: {
            id: `eq.${articleId}`
          },
          data: {
            view_count: newViewCount,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:940", "MCP: 增加浏览数失败:", error);
      // 不抛出错误，浏览数增加失败不影响主流程
    }
  }
  
  // 获取用户收藏的文章列表
  async getUserFavoriteArticles(page = 1, limit = 20) {
    try {
      const userId = this.getUserId();
      const favorites = await this.callApi("article_favorites", {
        method: "GET",
        queryParams: {
          user_id: `eq.${userId}`,
          select: 'article_id,created_at,articles(*)',
          order: 'created_at.desc',
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString()
        }
      });
      
      // 提取文章数据并转换格式
      return favorites.map(fav => {
        const article = fav.articles;
        if (!article || !article.is_active) return null;
        
        return {
          id: article.id,
          title: article.title,
          category: article.category_name || article.category,
          summary: article.summary,
          content: article.content,
          readTime: article.read_time || 5,
          viewCount: article.view_count || 0,
          likeCount: article.like_count || 0,
          favoriteCount: article.favorite_count || 0,
          date: article.published_at || article.created_at,
          isHot: article.is_hot || false,
          isNew: article.is_new || false,
          isFeatured: article.is_featured || false,
          isFavorited: true,
          authorName: article.author_name,
          coverImageUrl: article.cover_image_url,
          tags: article.tags || [],
          favoritedAt: fav.created_at
        };
      }).filter(article => article !== null);
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:990", "MCP: 获取收藏文章失败:", error);
      throw error;
    }
  }
  
  // 获取用户统计数据
  async getUserStats() {
    try {
      const userId = this.getUserId();
      
      // 并行获取各项统计数据
      const [treeholeCount, favoriteCount, readHistoryCount, conversationCount, moodRecordCount] = await Promise.all([
        // 树洞帖子数
        this.callApi("treehole_posts", {
          method: "GET",
          queryParams: {
            user_id: `eq.${userId}`,
            is_active: 'eq.true',
            select: 'id'
          }
        }).then(result => result ? result.length : 0).catch(() => 0),
        
        // 收藏文章数
        this.callApi("article_favorites", {
          method: "GET",
          queryParams: {
            user_id: `eq.${userId}`,
            select: 'id'
          }
        }).then(result => result ? result.length : 0).catch(() => 0),
        
        // 阅读历史数
        this.callApi("article_read_history", {
          method: "GET",
          queryParams: {
            user_id: `eq.${userId}`,
            select: 'id'
          }
        }).then(result => result ? result.length : 0).catch(() => 0),
        
        // 对话数
        this.getUserConversations().then(conversations => conversations ? conversations.length : 0).catch(() => 0),
        
        // 心情记录数
        this.callApi("mood_records", {
          method: "GET",
          queryParams: {
            user_id: `eq.${userId}`,
            select: 'id'
          }
        }).then(result => result ? result.length : 0).catch(() => 0)
      ]);
      
      return {
        treeholeCount,
        favoriteCount,
        readHistoryCount,
        conversationCount,
        moodRecordCount
      };
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:1122", "MCP: 获取用户统计失败:", error);
      return {
        treeholeCount: 0,
        favoriteCount: 0,
        readHistoryCount: 0,
        conversationCount: 0,
        moodRecordCount: 0
      };
    }
  }
  
  // ============================================
  // 心情记录相关方法
  // ============================================
  
  // 创建心情记录
  async createMoodRecord(moodData) {
    try {
      const userId = this.getUserId();
      const data = {
        user_id: userId,
        mood_type: moodData.moodType || 'neutral',
        mood_score: moodData.moodScore || 5,
        note: moodData.note || null,
        weather: moodData.weather || null,
        location: moodData.location || null,
        tags: moodData.tags || [],
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      
      const result = await this.callApi("mood_records", {
        method: "POST",
        data: data
      });
      
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1200", "MCP: 创建心情记录失败:", error);
      throw error;
    }
  }
  
  // 获取用户心情记录列表
  async getUserMoodRecords(page = 1, limit = 20, startDate = null, endDate = null) {
    try {
      const userId = this.getUserId();
      const queryParams = {
        user_id: `eq.${userId}`,
        order: 'created_at.desc',
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        select: '*'
      };
      
      // 如果提供了日期范围，添加日期过滤
      if (startDate) {
        queryParams.created_at = `gte.${startDate}`;
      }
      if (endDate) {
        queryParams.created_at = queryParams.created_at 
          ? `${queryParams.created_at},lte.${endDate}`
          : `lte.${endDate}`;
      }
      
      const result = await this.callApi("mood_records", {
        method: "GET",
        queryParams: queryParams
      });
      
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1230", "MCP: 获取心情记录失败:", error);
      // 如果表不存在，返回空数组
      if (error.message && error.message.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }
  
  // 删除心情记录
  async deleteMoodRecord(recordId) {
    try {
      const userId = this.getUserId();
      
      // 先检查记录是否属于当前用户
      const records = await this.callApi("mood_records", {
        method: "GET",
        queryParams: {
          id: `eq.${recordId}`,
          user_id: `eq.${userId}`,
          select: 'id'
        }
      });
      
      if (!records || records.length === 0) {
        throw new Error("记录不存在或无权限删除");
      }
      
      await this.callApi("mood_records", {
        method: "DELETE",
        queryParams: {
          id: `eq.${recordId}`
        }
      });
      
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1260", "MCP: 删除心情记录失败:", error);
      throw error;
    }
  }
  
  // 获取心情统计
  async getMoodStats(startDate = null, endDate = null) {
    try {
      const userId = this.getUserId();
      const queryParams = {
        user_id: `eq.${userId}`,
        select: 'mood_type,mood_score,created_at'
      };
      
      if (startDate) {
        queryParams.created_at = `gte.${startDate}`;
      }
      if (endDate) {
        queryParams.created_at = queryParams.created_at 
          ? `${queryParams.created_at},lte.${endDate}`
          : `lte.${endDate}`;
      }
      
      const records = await this.callApi("mood_records", {
        method: "GET",
        queryParams: queryParams
      });
      
      if (!records || records.length === 0) {
        return {
          total: 0,
          averageScore: 5,
          moodDistribution: {},
          recentMood: null
        };
      }
      
      // 计算统计数据
      const moodDistribution = {};
      let totalScore = 0;
      let count = 0;
      
      records.forEach(record => {
        const moodType = record.mood_type || 'neutral';
        moodDistribution[moodType] = (moodDistribution[moodType] || 0) + 1;
        if (record.mood_score) {
          totalScore += record.mood_score;
          count++;
        }
      });
      
      return {
        total: records.length,
        averageScore: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 5,
        moodDistribution: moodDistribution,
        recentMood: records.length > 0 ? records[0] : null
      };
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/supabase.js:1305", "MCP: 获取心情统计失败:", error);
      return {
        total: 0,
        averageScore: 5,
        moodDistribution: {},
        recentMood: null
      };
    }
  }
  
  // 获取用户阅读历史
  async getUserReadHistory(page = 1, limit = 20) {
    try {
      const userId = this.getUserId();
      const history = await this.callApi("article_read_history", {
        method: "GET",
        queryParams: {
          user_id: `eq.${userId}`,
          select: 'article_id,read_progress,read_duration,last_read_at,created_at,articles(*)',
          order: 'last_read_at.desc',
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString()
        }
      });
      
      // 提取文章数据并转换格式
      return history.map(h => {
        const article = h.articles;
        if (!article || !article.is_active) return null;
        
        return {
          id: article.id,
          title: article.title,
          category: article.category_name || article.category,
          summary: article.summary,
          content: article.content,
          readTime: article.read_time || 5,
          viewCount: article.view_count || 0,
          likeCount: article.like_count || 0,
          favoriteCount: article.favorite_count || 0,
          date: article.published_at || article.created_at,
          isHot: article.is_hot || false,
          isNew: article.is_new || false,
          isFeatured: article.is_featured || false,
          isFavorited: false, // 需要单独查询
          authorName: article.author_name,
          coverImageUrl: article.cover_image_url,
          tags: article.tags || [],
          readProgress: h.read_progress || 0,
          readDuration: h.read_duration || 0,
          lastReadAt: h.last_read_at
        };
      }).filter(article => article !== null);
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1030", "MCP: 获取阅读历史失败:", error);
      throw error;
    }
  }
  
  // 获取热门文章
  async getHotArticles(limit = 5) {
    try {
      return await this.getArticles({
        isHot: true,
        limit: limit,
        orderBy: 'view_count',
        order: 'desc'
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1045", "MCP: 获取热门文章失败:", error);
      throw error;
    }
  }
  
  // 获取新文章
  async getNewArticles(limit = 10) {
    try {
      return await this.getArticles({
        isNew: true,
        limit: limit,
        orderBy: 'created_at',
        order: 'desc'
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:1058", "MCP: 获取新文章失败:", error);
      throw error;
    }
  }
}

class ConversationService {
  constructor() {
    this.supabaseService = new SupabaseService();
  }
  // 检查Supabase连接
  async checkSupabaseConnection() {
    try {
      const isConnected = this.supabaseService.isConnected;
      common_vendor.index.__f__("log", "at utils/supabase.js:560", "Supabase连接状态检查:", { isConnected });
      return isConnected;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:563", "Supabase连接检查失败:", error);
      throw error;
    }
  }
  // 创建对话
  async createConversation(title, roleId, styleId) {
    try {
      // 如果没有提供 styleId，使用默认值
      // 默认样式可以根据角色类型选择，或者使用通用的 'friendly' 样式
      const defaultStyleId = styleId || 'friendly';
      const result = await this.supabaseService.createConversation(title, roleId, defaultStyleId);
      common_vendor.index.__f__("log", "at utils/supabase.js:571", "创建对话成功:", result);
      return result;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:574", "创建对话失败:", error);
      throw error;
    }
  }
  // 获取用户对话
  async getUserConversations() {
    try {
      const result = await this.supabaseService.getUserConversations();
      common_vendor.index.__f__("log", "at utils/supabase.js:582", "获取用户对话成功，数量:", result ? result.length : 0);
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:585", "获取用户对话失败:", error);
      throw error;
    }
  }
  // 保存消息
  async saveMessage(conversationId, role, content) {
    try {
      const result = await this.supabaseService.saveMessage(conversationId, role, content);
      common_vendor.index.__f__("log", "at utils/supabase.js:593", "保存消息成功:", result);
      return result;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:596", "保存消息失败:", error);
      throw error;
    }
  }
  // 更新对话标题
  async updateConversationTitle(conversationId, title) {
    try {
      const result = await this.supabaseService.updateConversationTitle(conversationId, title);
      common_vendor.index.__f__("log", "at utils/supabase.js:604", "更新对话标题成功:", result);
      return result;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:607", "更新对话标题失败:", error);
      throw error;
    }
  }
  // 删除对话
  async deleteConversation(conversationId) {
    try {
      const result = await this.supabaseService.deleteConversation(conversationId);
      common_vendor.index.__f__("log", "at utils/supabase.js:615", "删除对话成功:", result);
      return result;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:618", "删除对话失败:", error);
      throw error;
    }
  }
  // 获取对话消息
  async getConversationMessages(conversationId) {
    try {
      const result = await this.supabaseService.getConversationMessages(conversationId);
      common_vendor.index.__f__("log", "at utils/supabase.js:633", "获取对话消息成功，数量:", result ? result.length : 0);
      return result || [];
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:636", "获取对话消息失败:", error);
      throw error;
    }
  }

  // 获取统计信息
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
      common_vendor.index.__f__("log", "at utils/supabase.js:653", "获取统计信息成功:", stats);
      return stats;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/supabase.js:656", "获取统计信息失败:", error);
      throw error;
    }
  }
}
const conversationService = new ConversationService();
export default conversationService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/supabase.js.map
