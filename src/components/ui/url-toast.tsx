"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./url-toast.module.css";

type ToastState = {
  id: number;
  type: "success" | "error";
  message: string;
};

const successMessages: Record<string, string> = {
  created: "Đã tạo mới thành công.",
  updated: "Đã cập nhật thành công.",
  saved: "Đã lưu thay đổi.",
  deleted: "Đã xóa thành công.",
  archived: "Đã lưu trữ thành công.",
  restored: "Đã khôi phục thành công.",
  "goal-created": "Đã tạo Goal thành công.",
  "goal-updated": "Đã cập nhật Goal.",
  "quest-created": "Đã tạo Quest thành công.",
  "quest-updated": "Đã cập nhật Quest.",
  "quest-assigned": "Đã giao Quest cho thành viên.",
  "checkin-created": "Đã lưu cập nhật tiến độ.",
  "dependency-created": "Đã thêm quan hệ phụ thuộc.",
  "note-created": "Đã thêm ghi chú vào Archives.",
  "note-updated": "Đã cập nhật ghi chú.",
  "note-archived": "Đã lưu trữ ghi chú.",
  "note-restored": "Đã khôi phục ghi chú.",
  "proposal-created": "Đã tạo đề xuất mới.",
  "proposal-updated": "Đã cập nhật đề xuất.",
  "vote-submitted": "Đã ghi nhận lá phiếu.",
  "score-saved": "Đã lưu điểm đánh giá.",
  "decision-recorded": "Đã ghi nhận quyết định.",
  "workspace-created": "Đã tạo workspace thành công.",
  "account-created": "Tài khoản mới đã được tạo.",
  "pin-saved": "Đã lưu mã PIN khôi phục.",
  "signed-out": "Đã đăng xuất.",
  suspended: "Đã tạm khóa tài khoản.",
  "invitation-created": "Đã tạo lời mời thành công.",
  joined: "Đã tham gia workspace.",
  "role-updated": "Đã cập nhật quyền thành viên.",
  "member-removed": "Đã xóa thành viên khỏi workspace.",
  "invitation-revoked": "Đã thu hồi lời mời.",
  "left-workspace": "Đã rời workspace.",
};

const errorMessages: Record<string, string> = {
  invalid: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
  "invalid-input": "Thông tin gửi lên chưa hợp lệ.",
  "update-failed": "Không thể cập nhật dữ liệu. Vui lòng thử lại.",
  credentials: "Email hoặc mật khẩu chưa chính xác.",
  "invalid-name": "Tên hiển thị chưa hợp lệ.",
  "invalid-email": "Địa chỉ email chưa hợp lệ.",
  password: "Mật khẩu chưa đáp ứng yêu cầu.",
  "pin-invalid": "Mã PIN phải gồm 6 chữ số.",
  "pin-mismatch": "Hai mã PIN không trùng khớp.",
  "pin-check": "Không thể xác minh mã PIN khôi phục.",
  "email-exists": "Email này đã được đăng ký.",
  "rate-limit": "Anh thao tác quá nhanh. Vui lòng thử lại sau.",
  "server-error": "Máy chủ chưa thể xử lý yêu cầu.",
  "signup-disabled": "Chức năng đăng ký hiện không khả dụng.",
  save: "Không thể lưu thay đổi. Vui lòng thử lại.",
  assign: "Chưa thể giao Quest cho thành viên.",
  checkin: "Chưa thể lưu cập nhật tiến độ.",
  dependency: "Quan hệ phụ thuộc không hợp lệ hoặc tạo vòng lặp.",
  update: "Chưa thể cập nhật dữ liệu.",
  archive: "Chưa thể thay đổi trạng thái lưu trữ.",
  vote: "Chưa thể ghi nhận lá phiếu.",
  score: "Chưa thể lưu điểm đánh giá.",
  decision: "Chưa thể ghi nhận quyết định.",
  proposal: "Chưa thể tạo đề xuất.",
  status: "Chưa thể cập nhật trạng thái.",
  "invalid-workspace": "Thông tin workspace chưa hợp lệ.",
  "invalid-slug": "Tên workspace chưa thể dùng làm đường dẫn.",
  "slug-taken": "Đường dẫn workspace đã được sử dụng.",
  "create-failed": "Không thể tạo workspace. Vui lòng thử lại.",
  "invalid-invitation": "Lời mời không hợp lệ hoặc đã hết hạn.",
  "invite-failed": "Không thể tạo lời mời.",
  "invalid-member": "Thông tin thành viên chưa hợp lệ.",
  "role-update": "Không thể cập nhật quyền thành viên.",
  "remove-failed": "Không thể xóa thành viên.",
  "revoke-failed": "Không thể thu hồi lời mời.",
  "leave-failed": "Không thể rời workspace.",
  "delete-confirm": "Anh chưa xác nhận thao tác xóa workspace.",
  "delete-failed": "Không thể xóa workspace.",
};

export function UrlToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const notice = searchParams.get("notice");
  const error = searchParams.get("error");
  const handledCode = useRef<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const code = error ? `error:${error}` : notice ? `notice:${notice}` : null;

    if (!code) {
      handledCode.current = null;
      return;
    }
    if (handledCode.current === code) return;
    handledCode.current = code;

    setToast({
      id: Date.now(),
      type: error ? "error" : "success",
      message: error
        ? errorMessages[error] ?? "Thao tác chưa thành công. Vui lòng thử lại."
        : successMessages[notice ?? ""] ?? "Thao tác đã hoàn tất.",
    });

    // Remove only feedback parameters. Keep unrelated parameters such as an invitation token.
    const params = new URLSearchParams(queryString);
    params.delete("notice");
    params.delete("error");
    const remainingQuery = params.toString();
    router.replace(remainingQuery ? `${pathname}?${remainingQuery}` : pathname, { scroll: false });
  }, [error, notice, pathname, queryString, router]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="true">
      <div
        className={`${styles.toast} ${toast.type === "error" ? styles.error : styles.success}`}
        key={toast.id}
        role={toast.type === "error" ? "alert" : "status"}
      >
        <span className={styles.icon} aria-hidden="true">
          {toast.type === "error" ? "!" : "✓"}
        </span>
        <p className={styles.message}>{toast.message}</p>
        <button
          className={styles.close}
          type="button"
          aria-label="Đóng thông báo"
          onClick={() => setToast(null)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
