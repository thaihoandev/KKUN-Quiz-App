// src/utils/notificationText.ts
import { NotificationDTO } from "@/services/notificationService";

/**
 * ====== Formatter cho câu thông báo (dễ mở rộng) ======
 * - escapeHtml: tránh XSS khi render innerHTML
 * - capWords: viết hoa từng từ (unicode-safe)
 * - targetLabelMap / verb handlers: map kỹ thuật -> câu tự nhiên
 * - buildNotificationText: trả về chuỗi HTML an toàn để hiển thị
 */

// Escape HTML để tránh XSS khi bạn dùng dangerouslySetInnerHTML
const escapeHtml = (s?: string) =>
  s?.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!)) ?? "";

// Viết hoa từng từ (hỗ trợ unicode)
const capWords = (s?: string) =>
  s
    ? s
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\p{L}[\p{L}\p{M}]*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1))
    : "";

/** Map “thân thiện” cho target types (mở rộng dần tại đây) */
const targetLabelMap: Record<string, string> = {
  FRIEND: "bạn bè",
  FRIEND_REQUEST: "lời mời kết bạn",
  POST: "bài viết",
  COMMENT: "bình luận",
  QUIZ: "bài quiz",
};

/** Những target nên hiển thị kèm content (tiêu đề post, trích bình luận, ...) */
const showContentTargets = new Set(["POST", "COMMENT", "QUIZ"]);

/** i18n/language pack đơn giản (VN) — có thể thay bằng lib i18n thật trong tương lai */
const vi = {
  someone: "Ai đó",
  friendRequestSent: (actor: string) => `<strong>${actor}</strong> đã gửi <strong>lời mời kết bạn</strong>.`,
  friendRequestAccepted: (actor: string) => `<strong>${actor}</strong> đã <strong>chấp nhận</strong> lời mời kết bạn.`,
  friendRequestDeclined: (actor: string) => `<strong>${actor}</strong> đã <strong>từ chối</strong> lời mời kết bạn.`,
  friendRequestCanceled: (actor: string) => `<strong>${actor}</strong> đã <strong>hủy</strong> lời mời kết bạn.`,
  friendAdded: (actor: string) => `Bạn và <strong>${actor}</strong> đã trở thành bạn bè.`,
  generic: (actor: string, verb: string, target: string) => `<strong>${actor}</strong> ${verb} ${target}`,
};

/**
 * Build câu thông báo đẹp, không lộ keyword kỹ thuật
 * Trả về HTML an toàn (đã escape phần content).
 */
export const buildNotificationText = (dto: NotificationDTO): string => {
  const actor = capWords(dto.actor?.name || dto.actor?.name || vi.someone);
  const verb = (dto.verb || "").toUpperCase();
  const rawTarget = (dto.targetType || "").toUpperCase();
  const target = targetLabelMap[rawTarget] || rawTarget.toLowerCase();

  let core = "";

  switch (verb) {
    case "FRIEND_REQUEST_SENT":
      core = vi.friendRequestSent(actor);
      break;
    case "FRIEND_REQUEST_ACCEPTED":
    case "FRIEND_REQUEST_AUTO_ACCEPTED":
      core = vi.friendRequestAccepted(actor);
      break;
    case "FRIEND_REQUEST_DECLINED":
      core = vi.friendRequestDeclined(actor);
      break;
    case "FRIEND_REQUEST_CANCELED":
      core = vi.friendRequestCanceled(actor);
      break;
    case "FRIEND_ADDED":
        core = vi.friendAdded(actor);
        break;
    case "LIKED":
        core = `<strong>${actor}</strong> đã thích ${target}.`;
        break;
    case "UNLIKED":
        core = `<strong>${actor}</strong> đã bỏ thích ${target}.`;
        break;
    case "COMMENTED":
        core = `<strong>${actor}</strong> đã bình luận vào ${target}`;
        break;
    default: {
      const v = verb ? verb.replace(/_/g, " ").toLowerCase() : "cập nhật";
      core = vi.generic(actor, v, target);
      break;
    }
  }

  if (dto.content && showContentTargets.has(rawTarget)) {
    const text = escapeHtml(dto.content);
    return `${core} “<strong>${text}</strong>”.`;
  }
  return core;
};

/** ===== Extension hooks =====
 * - Thêm ngôn ngữ khác: tạo object tương tự `vi` rồi chọn theo user locale
 * - Thêm target/verb mới: mở rộng `targetLabelMap` & switch-case ở trên
 */
