"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_supabase = require("../../utils/supabase.js");
const _sfc_main = {
  data() {
    return {
      content: "",
      selectedEmotion: "neutral",
      isSubmitting: false,
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 20,
      posts: [],
      scrollTop: 0,
      showBackToTop: false,
      textareaFocused: false,
      showPublishSection: false,
      // 默认折叠发布区域，固定在底部
      // 情绪标签
      emotions: [
        { value: "happy", label: "开心", icon: "😊", color: "#FFD700" },
        { value: "sad", label: "难过", icon: "😢", color: "#87CEEB" },
        { value: "anxious", label: "焦虑", icon: "😰", color: "#FF6B6B" },
        { value: "angry", label: "愤怒", icon: "😠", color: "#FF4757" },
        { value: "neutral", label: "平静", icon: "😐", color: "#95A5A6" },
        { value: "tired", label: "疲惫", icon: "😴", color: "#A8E6CF" },
        { value: "confused", label: "困惑", icon: "😕", color: "#FFA07A" },
        { value: "grateful", label: "感恩", icon: "🙏", color: "#FFD93D" }
      ]
    };
  },
  onLoad() {
    this.loadPosts();
  },
  onShow() {
    if (this.posts.length > 0) {
      this.onRefresh();
    }
  },
  methods: {
    // 文本域聚焦
    onTextareaFocus() {
      this.textareaFocused = true;
    },
    // 文本域失焦
    onTextareaBlur() {
      this.textareaFocused = false;
    },
    // 选择情绪
    selectEmotion(emotion) {
      this.selectedEmotion = emotion;
    },
    // 获取情绪标签
    getEmotionLabel(emotion) {
      const emotionObj = this.emotions.find((e) => e.value === emotion);
      return emotionObj ? `${emotionObj.icon} ${emotionObj.label}` : emotion;
    },
    // 清空内容
    clearContent() {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空输入的内容吗？",
        success: (res) => {
          if (res.confirm) {
            this.content = "";
            this.selectedEmotion = "neutral";
          }
        }
      });
    },
    // 提交内容
    async submitContent() {
      if (!this.content.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      this.isSubmitting = true;
      try {
        let post = null;
        try {
          post = await utils_supabase.conversationService.supabaseService.createTreeholePost(
            this.content,
            this.selectedEmotion,
            true
          );
        } catch (error) {
          common_vendor.index.__f__("log", "at pages/hole/hole.vue:343", "保存到数据库失败，使用本地存储:", error);
        }
        if (!post) {
          const now = /* @__PURE__ */ new Date();
          const currentUserId = utils_supabase.conversationService.supabaseService.getUserId();
          post = {
            id: "local_" + Date.now(),
            user_id: currentUserId,
            content: this.content,
            emotion: this.selectedEmotion,
            is_anonymous: true,
            like_count: 0,
            comment_count: 0,
            isLiked: false,
            comments: [],
            showComments: false,
            commentText: "",
            created_at: now.toISOString(),
            time: this.formatTime(now.toISOString())
          };
          const localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
          localPosts.unshift(post);
          common_vendor.index.setStorageSync("treehole_posts", localPosts.slice(0, 100));
        }
        this.posts.unshift({
          ...post,
          isLiked: false,
          comments: [],
          showComments: false,
          commentText: "",
          time: post.time || this.formatTime(post.created_at)
        });
        this.content = "";
        this.selectedEmotion = "neutral";
        this.scrollToTop();
        common_vendor.index.showToast({
          title: "发布成功",
          icon: "success",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hole/hole.vue:395", "发布失败:", error);
        common_vendor.index.showToast({
          title: "发布失败，请重试",
          icon: "none"
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    // 加载帖子列表
    async loadPosts(refresh = false) {
      if (this.isLoading)
        return;
      this.isLoading = true;
      if (refresh) {
        this.currentPage = 1;
        this.hasMore = true;
      }
      try {
        let newPosts = [];
        try {
          newPosts = await utils_supabase.conversationService.supabaseService.getTreeholePosts(
            this.currentPage,
            this.pageSize
          );
          for (let post of newPosts) {
            try {
              post.isLiked = await utils_supabase.conversationService.supabaseService.checkUserLikedPost(post.id);
            } catch (error) {
              post.isLiked = false;
            }
            if (post.comment_count > 0) {
              post.showComments = true;
              try {
                post.comments = await utils_supabase.conversationService.supabaseService.getTreeholeComments(post.id);
                if (post.comments && post.comments.length > 0) {
                  post.comments = post.comments.map((comment) => ({
                    ...comment,
                    time: this.formatTime(comment.created_at)
                  }));
                }
              } catch (error) {
                common_vendor.index.__f__("error", "at pages/hole/hole.vue:445", "加载评论失败:", error);
                post.comments = [];
              }
            } else {
              post.comments = [];
              post.showComments = false;
            }
            post.commentText = "";
            post.time = this.formatTime(post.created_at);
          }
        } catch (error) {
          common_vendor.index.__f__("log", "at pages/hole/hole.vue:456", "从数据库加载失败，使用本地存储:", error);
          const localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
          newPosts = localPosts.slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
          ).map((post) => {
            const hasComments = post.comment_count > 0 || post.comments && post.comments.length > 0;
            return {
              ...post,
              isLiked: false,
              comments: post.comments || [],
              showComments: hasComments,
              // 有评论时默认展开
              commentText: "",
              time: post.time || this.formatTime(post.created_at)
            };
          });
        }
        if (refresh) {
          this.posts = newPosts;
        } else {
          this.posts = [...this.posts, ...newPosts];
        }
        this.hasMore = newPosts.length >= this.pageSize;
        if (this.hasMore) {
          this.currentPage++;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hole/hole.vue:488", "加载帖子失败:", error);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
        this.isRefreshing = false;
      }
    },
    // 下拉刷新
    onRefresh() {
      this.isRefreshing = true;
      this.loadPosts(true);
    },
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.isLoading) {
        this.loadPosts(false);
      }
    },
    // 切换点赞
    async toggleLike(post, index) {
      post.isLiking = true;
      if (!post.id || post.id.startsWith("local_")) {
        post.isLiked = !post.isLiked;
        post.like_count = (post.like_count || 0) + (post.isLiked ? 1 : -1);
        post.like_count = Math.max(0, post.like_count);
        const localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
        const localIndex = localPosts.findIndex((p) => p.id === post.id);
        if (localIndex !== -1) {
          localPosts[localIndex] = { ...post };
          common_vendor.index.setStorageSync("treehole_posts", localPosts);
        }
        setTimeout(() => {
          post.isLiking = false;
        }, 300);
        return;
      }
      try {
        const result = await utils_supabase.conversationService.supabaseService.likeTreeholePost(post.id);
        post.isLiked = result.liked;
        if (result.liked) {
          post.like_count = (post.like_count || 0) + 1;
        } else {
          post.like_count = Math.max(0, (post.like_count || 0) - 1);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hole/hole.vue:547", "点赞失败:", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      } finally {
        setTimeout(() => {
          post.isLiking = false;
        }, 300);
      }
    },
    // 显示评论 - 默认展开，自动加载
    async showComments(post, index) {
      post.showComments = !post.showComments;
      if (post.showComments && (!post.comments || post.comments.length === 0)) {
        try {
          if (post.id && !post.id.startsWith("local_")) {
            post.comments = await utils_supabase.conversationService.supabaseService.getTreeholeComments(post.id);
            if (post.comments && post.comments.length > 0) {
              post.comments = post.comments.map((comment) => ({
                ...comment,
                time: this.formatTime(comment.created_at)
              }));
            }
          } else {
            const localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
            const localPost = localPosts.find((p) => p.id === post.id);
            if (localPost) {
              post.comments = localPost.comments || [];
            }
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/hole/hole.vue:586", "加载评论失败:", error);
          post.comments = [];
        }
      }
    },
    // 切换发布区域显示
    togglePublishSection() {
      this.showPublishSection = !this.showPublishSection;
    },
    // 提交评论
    async submitComment(post, index) {
      if (!post.commentText || !post.commentText.trim()) {
        return;
      }
      const commentContent = post.commentText.trim();
      post.commentText = "";
      try {
        let comment = null;
        if (post.id && !post.id.startsWith("local_")) {
          comment = await utils_supabase.conversationService.supabaseService.addTreeholeComment(
            post.id,
            commentContent,
            true
          );
          post.comment_count = (post.comment_count || 0) + 1;
        } else {
          comment = {
            id: "comment_" + Date.now(),
            content: commentContent,
            is_anonymous: true,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
          post.comment_count = (post.comment_count || 0) + 1;
          const localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
          const localIndex = localPosts.findIndex((p) => p.id === post.id);
          if (localIndex !== -1) {
            localPosts[localIndex] = { ...post };
            common_vendor.index.setStorageSync("treehole_posts", localPosts);
          }
        }
        if (comment) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push({
            ...comment,
            time: this.formatTime(comment.created_at)
          });
        }
        common_vendor.index.showToast({
          title: "评论成功",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hole/hole.vue:655", "评论失败:", error);
        common_vendor.index.showToast({
          title: "评论失败，请重试",
          icon: "none"
        });
      }
    },
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr)
        return "";
      const now = /* @__PURE__ */ new Date();
      const time = new Date(timeStr);
      const diff = now - time;
      if (diff < 60 * 1e3) {
        return "刚刚";
      }
      if (diff < 60 * 60 * 1e3) {
        return Math.floor(diff / (60 * 1e3)) + "分钟前";
      }
      if (diff < 24 * 60 * 60 * 1e3) {
        return Math.floor(diff / (60 * 60 * 1e3)) + "小时前";
      }
      if (diff < 7 * 24 * 60 * 60 * 1e3) {
        return Math.floor(diff / (24 * 60 * 60 * 1e3)) + "天前";
      }
      const year = time.getFullYear();
      const month = String(time.getMonth() + 1).padStart(2, "0");
      const day = String(time.getDate()).padStart(2, "0");
      const hour = String(time.getHours()).padStart(2, "0");
      const minute = String(time.getMinutes()).padStart(2, "0");
      if (year === now.getFullYear()) {
        return `${month}-${day} ${hour}:${minute}`;
      } else {
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
    },
    // 滚动到顶部
    scrollToTop() {
      this.scrollTop = 0;
      this.$nextTick(() => {
        this.scrollTop = Math.random();
      });
    },
    // 判断是否是当前用户的帖子
    isMyPost(post) {
      const currentUserId = utils_supabase.conversationService.supabaseService.getUserId();
      return post.user_id === currentUserId;
    },
    // 删除帖子
    async deletePost(post, index) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条心事吗？删除后将无法恢复。",
        confirmText: "删除",
        cancelText: "取消",
        confirmColor: "#FF4757",
        success: async (res) => {
          if (res.confirm) {
            try {
              if (post.id && !post.id.startsWith("local_")) {
                await utils_supabase.conversationService.supabaseService.deleteTreeholePost(post.id);
              } else {
                let localPosts = common_vendor.index.getStorageSync("treehole_posts") || [];
                localPosts = localPosts.filter((p) => p.id !== post.id);
                common_vendor.index.setStorageSync("treehole_posts", localPosts);
              }
              this.posts.splice(index, 1);
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/hole/hole.vue:747", "删除帖子失败:", error);
              common_vendor.index.showToast({
                title: "删除失败，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    }
  },
  onPageScroll(e) {
    this.showBackToTop = e.scrollTop > 500;
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoading && $data.posts.length === 0
  }, !$data.isLoading && $data.posts.length === 0 ? {
    b: common_vendor.o((...args) => $options.scrollToTop && $options.scrollToTop(...args))
  } : {}, {
    c: common_vendor.f($data.posts, (post, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(post.is_anonymous ? "匿名用户" : "用户"),
        b: common_vendor.t($options.formatTime(post.created_at || post.time)),
        c: post.emotion
      }, post.emotion ? {
        d: common_vendor.t($options.getEmotionLabel(post.emotion))
      } : {}, {
        e: $options.isMyPost(post)
      }, $options.isMyPost(post) ? {
        f: common_vendor.o(($event) => $options.deletePost(post, index), post.id || index)
      } : {}, {
        g: common_vendor.t(post.content),
        h: common_vendor.t(post.like_count || 0),
        i: post.isLiked ? 1 : "",
        j: post.isLiking ? 1 : "",
        k: common_vendor.o(($event) => $options.toggleLike(post, index), post.id || index),
        l: common_vendor.t(post.comment_count || 0),
        m: post.showComments ? 1 : "",
        n: common_vendor.o(($event) => $options.showComments(post, index), post.id || index),
        o: common_vendor.t(post.comment_count || 0),
        p: common_vendor.t(post.showComments ? "收起" : "展开"),
        q: common_vendor.o(($event) => $options.showComments(post, index), post.id || index),
        r: post.showComments
      }, post.showComments ? common_vendor.e({
        s: common_vendor.f(post.comments, (comment, cIndex, i1) => {
          return {
            a: common_vendor.t(comment.is_anonymous ? "匿名用户" : "用户"),
            b: common_vendor.t($options.formatTime(comment.created_at)),
            c: common_vendor.t(comment.content),
            d: cIndex
          };
        }),
        t: !post.comments || post.comments.length === 0
      }, !post.comments || post.comments.length === 0 ? {} : {}) : {}, {
        v: post.showComments
      }, post.showComments ? {
        w: common_vendor.o(($event) => $options.submitComment(post, index), post.id || index),
        x: post.commentText,
        y: common_vendor.o(($event) => post.commentText = $event.detail.value, post.id || index),
        z: common_vendor.o(($event) => $options.submitComment(post, index), post.id || index),
        A: !post.commentText || post.commentText.trim() === ""
      } : {}, {
        B: post.showComments ? 1 : "",
        C: post.id || index,
        D: index * 0.05 + "s"
      });
    }),
    d: $data.hasMore && !$data.isLoading && $data.posts.length > 0
  }, $data.hasMore && !$data.isLoading && $data.posts.length > 0 ? {} : {}, {
    e: $data.isLoading && $data.posts.length > 0
  }, $data.isLoading && $data.posts.length > 0 ? {} : {}, {
    f: !$data.hasMore && $data.posts.length > 0
  }, !$data.hasMore && $data.posts.length > 0 ? {} : {}, {
    g: $data.isRefreshing,
    h: common_vendor.o((...args) => $options.onRefresh && $options.onRefresh(...args)),
    i: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args)),
    j: $data.scrollTop,
    k: $data.showBackToTop
  }, $data.showBackToTop ? {
    l: common_vendor.o((...args) => $options.scrollToTop && $options.scrollToTop(...args))
  } : {}, {
    m: common_vendor.t($data.showPublishSection ? "收起 ▲" : "展开 ▼"),
    n: common_vendor.o((...args) => $options.togglePublishSection && $options.togglePublishSection(...args)),
    o: $data.showPublishSection
  }, $data.showPublishSection ? {
    p: $data.isSubmitting,
    q: common_vendor.o((...args) => $options.onTextareaFocus && $options.onTextareaFocus(...args)),
    r: common_vendor.o((...args) => $options.onTextareaBlur && $options.onTextareaBlur(...args)),
    s: $data.content,
    t: common_vendor.o(($event) => $data.content = $event.detail.value),
    v: common_vendor.t($data.content.length),
    w: $data.content.length > 450 ? 1 : "",
    x: common_vendor.f($data.emotions, (emotion, index, i0) => {
      return {
        a: common_vendor.t(emotion.icon),
        b: common_vendor.t(emotion.label),
        c: index,
        d: $data.selectedEmotion === emotion.value ? 1 : "",
        e: common_vendor.o(($event) => $options.selectEmotion(emotion.value), index)
      };
    }),
    y: common_vendor.o((...args) => $options.clearContent && $options.clearContent(...args)),
    z: $data.isSubmitting || !$data.content.trim(),
    A: common_vendor.t($data.isSubmitting ? "发布中..." : "匿名发布"),
    B: common_vendor.o((...args) => $options.submitContent && $options.submitContent(...args)),
    C: $data.isSubmitting || !$data.content.trim(),
    D: $data.isSubmitting
  } : {}, {
    E: !$data.showPublishSection ? 1 : "",
    F: $data.showPublishSection ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cb95333c"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hole/hole.js.map
