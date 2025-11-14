import "@/assets/vendor/css/pages/page-profile.css";
import EditableField from "@/components/formFields/EditableField";
import HeaderProfile from "@/components/headers/HeaderProfile";
import EditAvatarModal from "@/components/modals/EditAvatarModal";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  deleteSoftUser,
  updateMyProfile,
  requestEmailOtp,
  verifyEmailOtp,
} from "@/services/userService";
import { useNavigate } from "react-router-dom";

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

  const storeUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshStoreMe = useAuthStore((s) => s.refreshMe);

  const [me, setMe] = useState(storeUser);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);

  // OTP
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  const safeUserId = storeUser?.userId ?? me?.userId;

  // Sync local `me` when store user updates (after refresh, edit,...)
  useEffect(() => {
    if (storeUser) setMe(storeUser);
  }, [storeUser]);

  const showMessage = (msg: Notice) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // ---------------------------
  // UPDATE PROFILE FIELDS
  // ---------------------------
  const handleFieldChange = async (fieldName: string, newValue: string) => {
    if (!safeUserId) return;

    // Email → use OTP
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
          message: `Đã gửi mã xác minh đến ${newValue}.`,
        });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.response?.data ??
          "Không thể gửi OTP.";
        showMessage({ type: "error", message: msg });
      } finally {
        setRequestingOtp(false);
      }
      return;
    }

    // Other fields
    setSaving(true);
    try {
      const payload: PartialUser = { [fieldName]: newValue };
      const updated = await updateMyProfile(payload);

      setMe(updated);
      showMessage({ type: "success", message: "Cập nhật thành công." });

      // sync store (global user)
      await refreshStoreMe();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Cập nhật thất bại.";
      showMessage({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // DELETE ACCOUNT
  // ---------------------------
  const handleDeleteAccount = async () => {
    if (!password || !confirmDelete || !safeUserId) return;

    setDeleting(true);
    try {
      await deleteSoftUser(String(safeUserId), password);
      showMessage({ type: "success", message: "Tài khoản đã bị vô hiệu hóa." });

      await logout?.();
      navigate("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Xóa tài khoản thất bại.";
      showMessage({ type: "error", message: msg });
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------
  // OTP HANDLERS
  // ---------------------------
  const resendOtp = async () => {
    if (!pendingEmail) return;

    setRequestingOtp(true);
    try {
      await requestEmailOtp(pendingEmail);
      showMessage({ type: "success", message: "Đã gửi lại mã OTP." });
    } catch {
      showMessage({ type: "error", message: "Không thể gửi lại mã." });
    } finally {
      setRequestingOtp(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp) return;

    setVerifyingOtp(true);
    try {
      await verifyEmailOtp(otp);

      await refreshStoreMe();
      const newest = useAuthStore.getState().user;
      if (newest) setMe(newest);

      setShowEmailOtp(false);
      showMessage({ type: "success", message: "Xác minh thành công." });
    } catch {
      showMessage({ type: "error", message: "Mã OTP không hợp lệ." });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div
      className="container-xxl flex-grow-1 container-p-y text-white"
      style={{ minHeight: "100vh" }}
    >
      {/* Notification */}
      {notice && (
        <div
          className={`alert alert-${notice.type === "success" ? "success" : "danger"} alert-dismissible fade show`}
          role="alert"
        >
          {notice.message}
          <button
            type="button"
            className="btn btn-close"
            onClick={() => setNotice(null)}
          />
        </div>
      )}

      {/* Header */}
      <HeaderProfile
        profile={me}
        onEditAvatar={() => setShowEditAvatar(true)}
      />

      {/* Profile Fields */}
      <div className="card p-0 rounded-4 border-0 shadow mb-4">
        <h5 className="card-header px-4 pb-3 border-bottom border-secondary">
          Thông tin cá nhân
        </h5>

        <div className="card-body px-4 pt-4">
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
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="card p-0 rounded-4 border-0 shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center p-4 border-bottom">
          <h5 className="m-0 text-danger d-flex align-items-center">
            <i className="bx bx-trash fs-4 me-2"></i>Xóa tài khoản
          </h5>
        </div>

        <div className="card-body p-4">
          <div className="alert alert-danger rounded-3 mb-4">
            <p className="mb-1 fw-semibold">Cảnh báo:</p>
            <p className="mb-0">Hành động này không thể hoàn tác.</p>
          </div>

          <label className="form-label text-muted">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            <label className="form-check-label">Tôi đồng ý xóa tài khoản</label>
          </div>

          <button
            className="btn btn-danger px-4 py-2"
            disabled={!password || !confirmDelete || deleting}
            onClick={handleDeleteAccount}
          >
            <i className={`bx ${deleting ? "bx-loader-alt bx-spin" : "bx-trash"} me-1`} />
            {deleting ? "Đang xóa..." : "Xóa tài khoản"}
          </button>
        </div>
      </div>

      {/* Avatar Modal */}
      {showEditAvatar && me && (
        <EditAvatarModal
          profile={me}
          onClose={() => setShowEditAvatar(false)}
          onUpdate={(updated) => {
            setMe(updated);
            setShowEditAvatar(false);
            showMessage({
              type: "success",
              message: "Cập nhật ảnh đại diện thành công.",
            });
            refreshStoreMe();
          }}
        />
      )}

      {/* OTP Modal */}
      {showEmailOtp && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white rounded-4 border-0">
              <div className="modal-header border-0">
                <h5 className="modal-title">Xác thực email mới</h5>
                <button
                  className="btn btn-close btn-close-white"
                  onClick={() => setShowEmailOtp(false)}
                />
              </div>

              <div className="modal-body">
                <p>Mã OTP đã gửi đến <b>{pendingEmail}</b>.</p>
                <input
                  type="text"
                  maxLength={6}
                  className="form-control"
                  placeholder="Nhập OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary"
                  onClick={resendOtp}
                  disabled={requestingOtp}
                >
                  Gửi lại
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmOtp}
                  disabled={!otp || verifyingOtp}
                >
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
