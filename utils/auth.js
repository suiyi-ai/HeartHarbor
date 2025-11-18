const common_vendor = require("../common/vendor.js");

// SHA256 算法的纯 JavaScript 实现（内联，避免模块导入问题）
// 右旋函数
function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

// 将字符串转换为字节数组
function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      i++;
      const charCode2 = str.charCodeAt(i);
      const codePoint = 0x10000 + (((charCode & 0x3ff) << 10) | (charCode2 & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
}

// 将字节数组转换为十六进制字符串
function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex += ((byte >>> 4) & 0xf).toString(16);
    hex += (byte & 0xf).toString(16);
  }
  return hex;
}

// SHA256 核心函数
function sha256(message) {
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const msg = typeof message === 'string' ? stringToBytes(message) : message;
  const msgLength = msg.length;
  const bitLength = msgLength * 8;
  
  msg.push(0x80);
  while (msg.length % 64 !== 56) {
    msg.push(0x00);
  }
  
  for (let i = 7; i >= 0; i--) {
    msg.push((bitLength >>> (i * 8)) & 0xff);
  }

  for (let chunk = 0; chunk < msg.length; chunk += 64) {
    const w = new Array(64);
    
    for (let i = 0; i < 16; i++) {
      w[i] = (msg[chunk + i * 4] << 24) |
             (msg[chunk + i * 4 + 1] << 16) |
             (msg[chunk + i * 4 + 2] << 8) |
             msg[chunk + i * 4 + 3];
    }
    
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff;
    }
    
    let [a, b, c, d, e, f, g, h0] = h;
    
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h0 + S1 + ch + k[i] + w[i]) & 0xffffffff;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) & 0xffffffff;
      
      h0 = g;
      g = f;
      f = e;
      e = (d + temp1) & 0xffffffff;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) & 0xffffffff;
    }
    
    h[0] = (h[0] + a) & 0xffffffff;
    h[1] = (h[1] + b) & 0xffffffff;
    h[2] = (h[2] + c) & 0xffffffff;
    h[3] = (h[3] + d) & 0xffffffff;
    h[4] = (h[4] + e) & 0xffffffff;
    h[5] = (h[5] + f) & 0xffffffff;
    h[6] = (h[6] + g) & 0xffffffff;
    h[7] = (h[7] + h0) & 0xffffffff;
  }
  
  const hashArray = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      hashArray.push((h[i] >>> (j * 8)) & 0xff);
    }
  }
  
  return hashArray;
}

// 创建 crypto-js 兼容的 API
const crypto = {
  SHA256: function(message) {
    const hashBytes = sha256(message);
    return {
      toString: function(format) {
        if (format === 'hex' || format === 'Hex') {
          return bytesToHex(hashBytes);
        }
        return bytesToHex(hashBytes);
      }
    };
  },
  enc: {
    Hex: 'hex'
  }
};

const SUPABASE_CONFIG = {
  url: "https://etvdmnsernfiegfeadad.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dmRtbnNlcm5maWVnZmVhZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM1MDUsImV4cCI6MjA3NzQ0OTUwNX0.FNvK-NrAxGrY5TwYblFC__hScR9lxjC5VFEUPlMYtTY"
};

// 密码加密函数
function hashPassword(password) {
  return crypto.SHA256(password).toString(crypto.enc.Hex);
}

// 生成访问令牌
function generateToken(userId) {
  const timestamp = Date.now();
  const data = `${userId}_${timestamp}`;
  return crypto.SHA256(data).toString(crypto.enc.Hex);
}

// 验证密码强度
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: "密码长度至少6位" };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: "密码必须包含大小写字母和数字" };
  }
  return { valid: true, message: "密码强度符合要求" };
}

// 验证邮箱格式
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证用户名格式
function validateUsername(username) {
  if (username.length < 3 || username.length > 50) {
    return { valid: false, message: "用户名长度应为3-50个字符" };
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return { valid: false, message: "用户名只能包含字母、数字、下划线和中文字符" };
  }
  return { valid: true, message: "用户名格式正确" };
}

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.restoreSession();
  }

  // 恢复会话
  restoreSession() {
    try {
      const token = common_vendor.index.getStorageSync("auth_token");
      const user = common_vendor.index.getStorageSync("current_user");
      
      if (token && user) {
        this.currentUser = JSON.parse(user);
        this.isAuthenticated = true;
        common_vendor.index.__f__("log", "at utils/auth.js:67", "会话恢复成功，用户:", this.currentUser.username);
      }
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/auth.js:70", "会话恢复失败:", error);
      this.clearSession();
    }
  }

  // 清除会话
  clearSession() {
    this.currentUser = null;
    this.isAuthenticated = false;
    common_vendor.index.removeStorageSync("auth_token");
    common_vendor.index.removeStorageSync("current_user");
    common_vendor.index.__f__("log", "at utils/auth.js:80", "会话已清除");
  }

  // 构建Supabase查询
  buildQuery(params) {
    const parts = [];
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined) {
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

  // 调用Supabase API
  async callApi(endpoint, options = {}) {
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
      const queryString = this.buildQuery(options.queryParams);
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

    common_vendor.index.__f__("log", "at utils/auth.js:131", `认证API调用: ${finalOptions.method} ${url}`);

    try {
      const response = await common_vendor.index.request(finalOptions);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      } else {
        let errorMessage = `API Error: ${response.statusCode}`;
        if (response.data) {
          if (response.data.message) errorMessage += ` - ${response.data.message}`;
          if (response.data.hint) errorMessage += ` (${response.data.hint})`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:146", "认证API调用失败:", error);
      throw error;
    }
  }

  // 用户注册
  async register(userData) {
    try {
      // 验证输入数据
      const { username, email, password, confirmPassword } = userData;
      
      if (!username || !email || !password || !confirmPassword) {
        throw new Error("请填写所有必填字段");
      }

      if (password !== confirmPassword) {
        throw new Error("两次输入的密码不一致");
      }

      // 验证邮箱格式
      if (!validateEmail(email)) {
        throw new Error("邮箱格式不正确");
      }

      // 验证用户名格式
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.message);
      }

      // 验证密码强度
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // 检查用户名是否已存在
      const existingUser = await this.callApi("users", {
        method: "GET",
        queryParams: {
          username: `eq.${username}`,
          select: "id"
        }
      });

      if (existingUser && existingUser.length > 0) {
        throw new Error("用户名已被使用");
      }

      // 检查邮箱是否已存在
      const existingEmail = await this.callApi("users", {
        method: "GET",
        queryParams: {
          email: `eq.${email}`,
          select: "id"
        }
      });

      if (existingEmail && existingEmail.length > 0) {
        throw new Error("邮箱已被注册");
      }

      // 创建新用户
      const newUser = {
        username,
        email,
        password_hash: hashPassword(password),
        nickname: username,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      common_vendor.index.__f__("log", "at utils/auth.js:219", "注册新用户，数据:", { username, email });

      const result = await this.callApi("users", {
        method: "POST",
        data: newUser
      });

      if (result && result.length > 0) {
        const user = result[0];
        
        // 生成令牌并保存会话
        const token = generateToken(user.id);
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          bio: user.bio
        };
        this.isAuthenticated = true;

        // 保存到本地存储
        common_vendor.index.setStorageSync("auth_token", token);
        common_vendor.index.setStorageSync("current_user", JSON.stringify(this.currentUser));

        common_vendor.index.__f__("log", "at utils/auth.js:241", "用户注册成功:", this.currentUser);
        
        return {
          success: true,
          user: this.currentUser,
          token: token,
          message: "注册成功"
        };
      }

      throw new Error("注册失败，请稍后重试");
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:254", "用户注册失败:", error);
      throw error;
    }
  }

  // 用户登录
  async login(identifier, password) {
    try {
      if (!identifier || !password) {
        throw new Error("请填写用户名/邮箱和密码");
      }

      // 确定是用户名还是邮箱
      const isEmail = validateEmail(identifier);
      const queryField = isEmail ? "email" : "username";

      common_vendor.index.__f__("log", "at utils/auth.js:269", "用户登录尝试:", { identifier, queryField });

      // 查找用户
      const users = await this.callApi("users", {
        method: "GET",
        queryParams: {
          [queryField]: `eq.${identifier}`,
          status: "eq.active",
          select: "*"
        }
      });

      if (!users || users.length === 0) {
        throw new Error("用户不存在或账号已被禁用");
      }

      const user = users[0];

      // 验证密码
      const hashedPassword = hashPassword(password);
      if (user.password_hash !== hashedPassword) {
        throw new Error("密码错误");
      }

      // 生成令牌并保存会话
      const token = generateToken(user.id);
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname || user.username,
        avatar_url: user.avatar_url,
        bio: user.bio,
        phone: user.phone
      };
      this.isAuthenticated = true;

      // 更新登录信息
      await this.callApi("users", {
        method: "PATCH",
        queryParams: {
          id: `eq.${user.id}`
        },
        data: {
          last_login: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1,
          updated_at: new Date().toISOString()
        }
      });

      // 保存到本地存储
      common_vendor.index.setStorageSync("auth_token", token);
      common_vendor.index.setStorageSync("current_user", JSON.stringify(this.currentUser));

      common_vendor.index.__f__("log", "at utils/auth.js:320", "用户登录成功:", this.currentUser);

      return {
        success: true,
        user: this.currentUser,
        token: token,
        message: "登录成功"
      };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:330", "用户登录失败:", error);
      throw error;
    }
  }

  // 微信登录
  async loginWithWeChat() {
    try {
      // 检查是否在小程序环境
      if (typeof uni === 'undefined' || !uni.login) {
        throw new Error("当前环境不支持微信登录");
      }

      common_vendor.index.__f__("log", "at utils/auth.js:494", "开始微信登录流程");

      // 第一步：获取微信登录 code
      const loginRes = await new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error("获取微信登录凭证失败");
      }

      const code = loginRes.code;
      common_vendor.index.__f__("log", "at utils/auth.js:507", "获取到微信 code:", code);

      // 第二步：获取用户信息（需要用户授权）
      let userInfo = null;
      try {
        // 尝试获取用户信息（新版本API）
        const profileRes = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: reject
          });
        });
        userInfo = profileRes.userInfo;
        common_vendor.index.__f__("log", "at utils/auth.js:520", "获取到用户信息:", userInfo);
      } catch (error) {
        // 如果获取用户信息失败，尝试使用旧API
        try {
          const infoRes = await new Promise((resolve, reject) => {
            uni.getUserInfo({
              success: resolve,
              fail: reject
            });
          });
          userInfo = infoRes.userInfo;
          common_vendor.index.__f__("log", "at utils/auth.js:530", "使用旧API获取到用户信息:", userInfo);
        } catch (err) {
          common_vendor.index.__f__("warn", "at utils/auth.js:533", "获取用户信息失败，将使用默认信息:", err);
          // 如果都失败，使用默认信息
          userInfo = {
            nickName: '微信用户',
            avatarUrl: ''
          };
        }
      }

      // 第三步：查找或创建用户
      // 使用 code 作为临时标识（实际应该通过后端换取 openid）
      // 这里简化处理：使用 code 的哈希值作为微信唯一标识
      const wechatId = hashPassword(code).substring(0, 32); // 使用 code 的哈希作为唯一标识
      
      // 查找是否已有该微信用户
      const existingUsers = await this.callApi("users", {
        method: "GET",
        queryParams: {
          wechat_openid: `eq.${wechatId}`,
          select: "*"
        }
      });

      let user;
      if (existingUsers && existingUsers.length > 0) {
        // 用户已存在，直接登录
        user = existingUsers[0];
        common_vendor.index.__f__("log", "at utils/auth.js:550", "找到已存在的微信用户:", user);
      } else {
        // 创建新用户
        const newUserData = {
          username: `wx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, // 生成唯一用户名
          email: `wx_${wechatId}@wechat.local`, // 临时邮箱
          password_hash: hashPassword(wechatId), // 使用 wechatId 作为密码（实际上不会用于登录）
          nickname: userInfo.nickName || '微信用户',
          avatar_url: userInfo.avatarUrl || '',
          wechat_openid: wechatId,
          wechat_unionid: null, // 如果有 unionid，可以在这里设置
          status: 'active',
          login_count: 1,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const createdUsers = await this.callApi("users", {
          method: "POST",
          data: newUserData
        });

        if (!createdUsers || createdUsers.length === 0) {
          throw new Error("创建微信用户失败");
        }

        user = createdUsers[0];
        common_vendor.index.__f__("log", "at utils/auth.js:572", "创建新的微信用户:", user);
      }

      // 第四步：生成令牌并保存会话
      const token = generateToken(user.id);
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname || user.username,
        avatar_url: user.avatar_url || userInfo.avatarUrl || '',
        bio: user.bio,
        phone: user.phone,
        wechat_openid: user.wechat_openid
      };
      this.isAuthenticated = true;

      // 更新登录信息和用户信息（如果有新的头像或昵称）
      const updateData = {
        last_login: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
        updated_at: new Date().toISOString()
      };

      // 如果用户信息有更新，也更新到数据库
      if (userInfo && (userInfo.nickName !== user.nickname || userInfo.avatarUrl !== user.avatar_url)) {
        updateData.nickname = userInfo.nickName || user.nickname;
        updateData.avatar_url = userInfo.avatarUrl || user.avatar_url;
      }

      await this.callApi("users", {
        method: "PATCH",
        queryParams: {
          id: `eq.${user.id}`
        },
        data: updateData
      });

      // 保存到本地存储
      common_vendor.index.setStorageSync("auth_token", token);
      common_vendor.index.setStorageSync("current_user", JSON.stringify(this.currentUser));

      common_vendor.index.__f__("log", "at utils/auth.js:605", "微信登录成功:", this.currentUser);

      return {
        success: true,
        user: this.currentUser,
        token: token,
        message: "微信登录成功"
      };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:612", "微信登录失败:", error);
      throw error;
    }
  }

  // 用户退出
  logout() {
    this.clearSession();
    common_vendor.index.__f__("log", "at utils/auth.js:337", "用户已退出登录");
    return { success: true, message: "退出成功" };
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.currentUser;
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.isAuthenticated;
  }

  // 更新用户信息
  async updateProfile(userData) {
    try {
      if (!this.isAuthenticated) {
        throw new Error("请先登录");
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      // 只允许更新特定字段
      const allowedFields = ['nickname', 'avatar_url', 'bio', 'phone'];
      allowedFields.forEach(field => {
        if (userData[field] !== undefined) {
          updateData[field] = userData[field];
        }
      });

      const result = await this.callApi("users", {
        method: "PATCH",
        queryParams: {
          id: `eq.${this.currentUser.id}`
        },
        data: updateData
      });

      if (result && result.length > 0) {
        // 更新本地存储的用户信息
        Object.assign(this.currentUser, updateData);
        common_vendor.index.setStorageSync("current_user", JSON.stringify(this.currentUser));
        
        common_vendor.index.__f__("log", "at utils/auth.js:382", "用户信息更新成功:", this.currentUser);
        return { success: true, user: this.currentUser, message: "信息更新成功" };
      }

      throw new Error("更新失败");
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:389", "用户信息更新失败:", error);
      throw error;
    }
  }

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    try {
      if (!this.isAuthenticated) {
        throw new Error("请先登录");
      }

      // 验证旧密码
      const users = await this.callApi("users", {
        method: "GET",
        queryParams: {
          id: `eq.${this.currentUser.id}`,
          select: "password_hash"
        }
      });

      if (!users || users.length === 0) {
        throw new Error("用户不存在");
      }

      const user = users[0];
      const hashedOldPassword = hashPassword(oldPassword);
      
      if (user.password_hash !== hashedOldPassword) {
        throw new Error("原密码错误");
      }

      // 验证新密码强度
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // 更新密码
      const result = await this.callApi("users", {
        method: "PATCH",
        queryParams: {
          id: `eq.${this.currentUser.id}`
        },
        data: {
          password_hash: hashPassword(newPassword),
          updated_at: new Date().toISOString()
        }
      });

      if (result && result.length > 0) {
        common_vendor.index.__f__("log", "at utils/auth.js:437", "密码修改成功");
        return { success: true, message: "密码修改成功" };
      }

      throw new Error("密码修改失败");
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/auth.js:444", "密码修改失败:", error);
      throw error;
    }
  }
}

// 创建单例实例
const authService = new AuthService();

export default authService;