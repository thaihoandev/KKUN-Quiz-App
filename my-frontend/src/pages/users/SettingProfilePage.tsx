import EditableField from "@/components/formFields/EditableField";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  getCurrentUser,
  updateUser,
  deleteSoftUser,
  requestEmailOtp,     // 👈 NEW
  verifyEmailOtp,      // 👈 NEW
} from "@/services/userService";
import EditAvatarModal from "@/components/modals/EditAvatarModal";

type PartialUser = {
  username?: string;
  email?: string;
  phone?: string;
  school?: string;
  avatar?: string;
};

type Notice = { type: "success" | "error"; message: string };

const SettingProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [me, setMe] = useState<any | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);

  // 👉 Email OTP modal state
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  const showMessage = (msg: Notice) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const current = await getCurrentUser();
        if (current) setMe(current);
        else showMessage({ type: "error", message: "Không thể tải thông tin người dùng." });
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể tải thông tin người dùng.";
        showMessage({ type: "error", message });
      }
    })();
  }, []);

  const safeUserId = me?.userId || user?.userId;

  const refreshMe = async () => {
    try {
      const curr = await getCurrentUser(true);
      if (curr) setMe(curr);
    } catch {}
  };

  const handleFieldChange = async (fieldName: string, newValue: string) => {
    if (!safeUserId) return;

    // ⚠️ Email: dùng OTP, không update trực tiếp
    if (fieldName === "email") {
      if (!newValue || newValue === me?.email) return;
      setRequestingOtp(true);
      try {
        await requestEmailOtp(newValue);
        setPendingEmail(newValue);
        setOtp("");
        setShowEmailOtp(true);
        showMessage({
          type: "success",
          message: `Đã gửi mã xác thực đến ${newValue}. Vui lòng kiểm tra hộp thư.`,
        });
      } catch (err: any) {
        const m =
          err?.response?.data?.message ||
          err?.response?.data ||
          "Không thể gửi mã xác thực. Vui lòng thử lại.";
        showMessage({ type: "error", message: m });
      } finally {
        setRequestingOtp(false);
      }
      return;
    }

    // Các field còn lại cập nhật như cũ
    setSaving(true);
    try {
      const payload: PartialUser = { [fieldName]: newValue } as PartialUser;
      const updated = await updateUser(String(safeUserId), payload as any);
      setMe(updated);
      showMessage({ type: "success", message: "Cập nhật thông tin thành công." });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Cập nhật thất bại. Vui lòng thử lại.";
      showMessage({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!safeUserId) return;
    if (!password || !confirmDelete) return;

    setDeleting(true);
    try {
      await deleteSoftUser(String(safeUserId), String(password));
      showMessage({ type: "success", message: "Tài khoản đã được vô hiệu hóa." });
      if (logout) logout();
      navigate("/");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Xóa tài khoản thất bại. Vui lòng kiểm tra mật khẩu.";
      showMessage({ type: "error", message });
    } finally {
      setDeleting(false);
    }
  };

  const displayAvatar = me?.avatar || `/assets/img/avatars/${selectedAvatar}.png`;

  // ===== OTP handlers
  const resendOtp = async () => {
    if (!pendingEmail) return;
    setRequestingOtp(true);
    try {
      await requestEmailOtp(pendingEmail);
      showMessage({ type: "success", message: `Đã gửi lại mã đến ${pendingEmail}.` });
    } catch (e: any) {
      const m = e?.response?.data || "Không thể gửi lại mã. Vui lòng thử lại.";
      showMessage({ type: "error", message: m });
    } finally {
      setRequestingOtp(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp) return;
    setVerifyingOtp(true);
    try {
      await verifyEmailOtp(otp);
      await refreshMe();
      setShowEmailOtp(false);
      showMessage({ type: "success", message: "Xác minh thành công. Email đã được cập nhật." });
    } catch (e: any) {
      const m = e?.response?.data || "Mã không hợp lệ hoặc đã hết hạn.";
      showMessage({ type: "error", message: m });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y text-white" style={{ minHeight: "100vh" }}>
      {/* Notification */}
      {notice && (
        <div
          className={`alert alert-${notice.type === "success" ? "success" : "danger"} alert-dismissible fade show`}
          role="alert"
        >
          {notice.message}
          <button type="button" className="btn btn-close" aria-label="Close" onClick={() => setNotice(null)} />
        </div>
      )}

      {/* Profile Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card p-0 rounded-4 border-0 shadow">
            <h5 className="card-header px-4 pb-3 border-bottom border-secondary">Thông tin cá nhân</h5>

            <div className="card-body px-4 pt-4">
              <div className="d-flex flex-column flex-md-row align-items-center gap-3 mb-4">
                <div className="position-relative">
                  <img
                    src={displayAvatar}
                    alt="User avatar"
                    className="rounded-circle border border-2 border-primary"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                    style={{ width: "32px", height: "32px", padding: 0 }}
                    title="Đổi ảnh đại diện"
                    onClick={() => setShowEditAvatar(true)}
                  >
                    <i className="bx bx-camera fs-5"></i>
                  </button>
                </div>

                <div className="mt-3 mt-md-0">
                  <h5 className="mb-1">{me?.username ?? "Tài khoản"}</h5>
                  <p className="text-muted mb-3">Chọn ảnh đại diện</p>
                  <small className="text-muted d-block">
                    Tip: Chọn ảnh trong gallery chỉ thay đổi hiển thị tạm thời. Ảnh đại diện chính thức sẽ cập nhật sau khi bạn tải/cắt và lưu.
                  </small>
                </div>
              </div>

              <div className="row g-4">
                <EditableField
                  label="Tên người dùng"
                  initialValue={me?.username ?? ""}
                  fieldName="username"
                  fieldType="text"
                  onValueChange={handleFieldChange}
                  disabled={saving}
                />
                <EditableField
                  label="Email"
                  initialValue={me?.email ?? ""}
                  fieldName="email"
                  fieldType="email"
                  onValueChange={handleFieldChange}
                  disabled={requestingOtp || verifyingOtp}
                />
                <EditableField
                  label="Số điện thoại"
                  initialValue={me?.phone ?? ""}
                  fieldName="phone"
                  fieldType="phoneNumber"
                  onValueChange={handleFieldChange}
                  disabled={saving}
                />
                <EditableField
                  label="Trường"
                  initialValue={me?.school ?? ""}
                  fieldName="school"
                  onValueChange={handleFieldChange}
                  disabled={saving}
                />
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label text-muted">Loại tài khoản</label>
                    <select className="form-select rounded-3 border-0 bg-light" disabled>
                      <option>{me?.roles?.includes("ADMIN") ? "Admin" : "User"}</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Interface Settings */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card p-0 rounded-4 border-0 shadow">
            <h5 className="card-header px-4 pb-3 border-bottom border-secondary">
              Giao diện
            </h5>
            <div className="card-body px-4 pt-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="form-group">
                    <h5 className="form-label text-muted">Hình nền</h5>
                    <select className="form-select">
                      <option>Auto</option>
                      <option>Dark</option>
                      <option>Light</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <h5 className="form-label text-muted">Ngôn ngữ</h5>
                    <select className="form-select">
                      <option>Tiếng Việt</option>
                      <option>English</option>
                      <option>Français</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card p-0 rounded-4 border-0 shadow-sm overflow-hidden">
            <div className="card-header d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="m-0 text-danger d-flex align-items-center">
                <i className="bx bx-trash fs-4 me-2"></i>
                Xóa tài khoản
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="alert alert-danger rounded-3 mb-4" role="alert">
                <div className="d-flex">
                  <i className="bx bx-error-circle fs-4 me-2"></i>
                  <div>
                    <p className="mb-1 fw-semibold">Cảnh báo: Hành động không thể hoàn tác</p>
                    <p className="mb-0">
                      Tài khoản sẽ bị vô hiệu hóa (soft delete). Quản trị viên có thể khôi phục nếu cần.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="confirmDelete"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="confirmDelete">
                  Tôi xác nhận muốn xóa tài khoản của mình
                </label>
              </div>
              <button
                className="btn btn-danger px-4 py-2"
                disabled={!password || !confirmDelete || deleting}
                onClick={handleDeleteAccount}
                aria-disabled={!password || !confirmDelete || deleting}
              >
                <i className={`bx ${deleting ? "bx-loader-alt bx-spin" : "bx-trash-alt"} me-1`}></i>
                {deleting ? "Đang xóa..." : "Xóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal cắt & cập nhật avatar */}
      {showEditAvatar && me && (
        <EditAvatarModal
          profile={me}
          onClose={() => setShowEditAvatar(false)}
          onUpdate={(updated) => {
            setMe(updated);
            setShowEditAvatar(false);
            showMessage({ type: "success", message: "Cập nhật ảnh đại diện thành công." });
          }}
        />
      )}

      {/* ===== Modal nhập OTP xác thực email ===== */}
      {showEmailOtp && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white rounded-4 border-0">
              <div className="modal-header border-0">
                <h5 className="modal-title">Xác thực email mới</h5>
                <button className="btn btn-close btn-close-white" onClick={() => setShowEmailOtp(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted">
                  Nhập mã gồm 6 chữ số đã gửi tới <strong>{pendingEmail}</strong>.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="form-control"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="modal-footer border-0 d-flex justify-content-between">
                <button className="btn btn-outline-secondary" onClick={resendOtp} disabled={requestingOtp}>
                  {requestingOtp ? "Đang gửi lại..." : "Gửi lại mã"}
                </button>
                <button className="btn btn-primary" onClick={confirmOtp} disabled={!otp || verifyingOtp}>
                  {verifyingOtp ? "Đang xác minh..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingProfilePage;
