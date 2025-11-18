// crypto-js 适配文件（小程序环境）
// 在小程序环境中，无法直接 require('crypto-js')
// 这个文件提供了一个纯 JavaScript 实现的 SHA256 哈希函数

// SHA256 算法的纯 JavaScript 实现
// 基于标准的 SHA-256 算法规范

// 右旋函数
function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

// SHA256 核心函数
function sha256(message) {
  // 初始化哈希值（前8个质数的平方根的小数部分的前32位）
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  // K 常量（前64个质数的立方根的小数部分的前32位）
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

  // 将消息转换为字节数组
  const msg = typeof message === 'string' ? stringToBytes(message) : message;
  
  // 预处理：添加填充
  const msgLength = msg.length;
  const bitLength = msgLength * 8;
  
  // 添加单个 1 位
  msg.push(0x80);
  
  // 添加 0 直到长度 ≡ 448 (mod 512)
  while (msg.length % 64 !== 56) {
    msg.push(0x00);
  }
  
  // 添加原始消息长度的 64 位表示
  for (let i = 7; i >= 0; i--) {
    msg.push((bitLength >>> (i * 8)) & 0xff);
  }

  // 处理每个 512 位块
  for (let chunk = 0; chunk < msg.length; chunk += 64) {
    const w = new Array(64);
    
    // 将块分解为 16 个 32 位字
    for (let i = 0; i < 16; i++) {
      w[i] = (msg[chunk + i * 4] << 24) |
             (msg[chunk + i * 4 + 1] << 16) |
             (msg[chunk + i * 4 + 2] << 8) |
             msg[chunk + i * 4 + 3];
    }
    
    // 扩展为 64 个字
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff;
    }
    
    // 初始化工作变量
    let [a, b, c, d, e, f, g, h0] = h;
    
    // 主循环
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
    
    // 添加到哈希值
    h[0] = (h[0] + a) & 0xffffffff;
    h[1] = (h[1] + b) & 0xffffffff;
    h[2] = (h[2] + c) & 0xffffffff;
    h[3] = (h[3] + d) & 0xffffffff;
    h[4] = (h[4] + e) & 0xffffffff;
    h[5] = (h[5] + f) & 0xffffffff;
    h[6] = (h[6] + g) & 0xffffffff;
    h[7] = (h[7] + h0) & 0xffffffff;
  }
  
  // 生成最终的哈希值
  const hashArray = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      hashArray.push((h[i] >>> (j * 8)) & 0xff);
    }
  }
  
  return hashArray;
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
      // 代理对
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

// 创建 CryptoJS 兼容的 API
const CryptoJS = {
  SHA256: function(message) {
    const hashBytes = sha256(message);
    return {
      toString: function(format) {
        if (format === 'hex' || format === 'Hex') {
          return bytesToHex(hashBytes);
        }
        // 默认返回十六进制
        return bytesToHex(hashBytes);
      },
      // 返回原始字节数组（如果需要）
      words: hashBytes
    };
  },
  enc: {
    Hex: {
      stringify: function(wordArray) {
        if (wordArray && wordArray.words) {
          return bytesToHex(wordArray.words);
        }
        if (Array.isArray(wordArray)) {
          return bytesToHex(wordArray);
        }
        return bytesToHex([wordArray]);
      },
      parse: function(hexStr) {
        const bytes = [];
        for (let i = 0; i < hexStr.length; i += 2) {
          bytes.push(parseInt(hexStr.substr(i, 2), 16));
        }
        return { words: bytes };
      }
    },
    Utf8: {
      parse: function(str) {
        return stringToBytes(str);
      },
      stringify: function(bytes) {
        if (Array.isArray(bytes)) {
          let str = '';
          for (let i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
          }
          return str;
        }
        return String(bytes);
      }
    },
    Base64: {
      stringify: function(wordArray) {
        // 简单的 Base64 编码
        const bytes = Array.isArray(wordArray) ? wordArray : (wordArray.words || []);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < bytes.length; i += 3) {
          const a = bytes[i];
          const b = bytes[i + 1] || 0;
          const c = bytes[i + 2] || 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += (i + 1 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=');
          result += (i + 2 < bytes.length ? chars.charAt(bitmap & 63) : '=');
        }
        return result;
      }
    }
  },
  HmacSHA256: function(message, key) {
    // HMAC-SHA256 实现
    const blockSize = 64;
    const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
    
    // 如果密钥长度大于块大小，先哈希密钥
    let processedKey = keyBytes;
    if (keyBytes.length > blockSize) {
      processedKey = sha256(keyBytes);
    }
    
    // 填充密钥到块大小
    while (processedKey.length < blockSize) {
      processedKey.push(0);
    }
    
    // 创建内部填充和外部填充
    const oKeyPad = [];
    const iKeyPad = [];
    for (let i = 0; i < blockSize; i++) {
      oKeyPad.push(processedKey[i] ^ 0x5c);
      iKeyPad.push(processedKey[i] ^ 0x36);
    }
    
    // 内部哈希
    const innerMessage = iKeyPad.concat(typeof message === 'string' ? stringToBytes(message) : message);
    const innerHash = sha256(innerMessage);
    
    // 外部哈希
    const outerMessage = oKeyPad.concat(innerHash);
    const outerHash = sha256(outerMessage);
    
    return {
      toString: function(format) {
        if (format === 'hex' || format === 'Hex') {
          return bytesToHex(outerHash);
        }
        return bytesToHex(outerHash);
      },
      words: outerHash
    };
  }
};

// 导出 CryptoJS（兼容 CommonJS）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoJS;
  module.exports.default = CryptoJS;
}

// ES6 模块导出
export default CryptoJS;
