import EditableField from "@/components/formFields/EditableField";
import React, {useState} from "react";
import NavigationMenuProfile from "@/components/NavigationMenuProfile";

const SettingProfilePage = () => {
    const [selectedAvatar, setSelectedAvatar] = useState(1);
    const testMenuItems = [
        {path: "/settings", icon: "bx-cog", label: "Settings"},
        {path: "/change-password", icon: "bx-cog", label: "Change password"},
    ];
    // Callback để xử lý thay đổi giá trị từ EditableField
    const handleFieldChange = (fieldName: string, newValue: string) => {
        console.log(`Field ${fieldName} updated to: ${newValue}`);
        // Bạn có thể thêm logic để lưu giá trị vào state hoặc API tại đây
    };

    return (
        <div
            className="container-xxl flex-grow-1 container-p-y text-white"
            style={{minHeight: "100vh"}}
        >
            <div className="row">
                <div className="col-12">
                    {/* <!-- Navbar pills --> */}
                    <NavigationMenuProfile menuItems={testMenuItems} />
                </div>
            </div>

            {/* Profile Information */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card p-4 rounded-4 border-0 shadow">
                        <h5 className="card-header px-0 pb-3 border-bottom border-secondary">
                            Thông tin cá nhân
                        </h5>

                        {/* Avatar Section */}
                        <div className="card-body px-0 pt-4">
                            <div className="d-flex flex-column flex-md-row align-items-center gap-3 mb-4">
                                <div className="position-relative">
                                    <img
                                        src={`../../assets/img/avatars/${selectedAvatar}.png`}
                                        alt="user-avatar"
                                        className="rounded-circle border border-2 border-primary"
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            objectFit: "cover",
                                        }}
                                    />
                                    <button
                                        className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            padding: "0",
                                        }}
                                    >
                                        <i className="bx bx-camera fs-5"></i>
                                    </button>
                                </div>

                                <div className="mt-3 mt-md-0">
                                    <h5 className="mb-1">quizlettel5936986</h5>
                                    <p className="text-muted mb-3">
                                        Chọn ảnh đại diện
                                    </p>

                                    <div
                                        className="avatar-gallery d-flex flex-wrap gap-2 mb-2"
                                        style={{maxWidth: "500px"}}
                                    >
                                        {[...Array(8)].map((_, index) => (
                                            <img
                                                key={index}
                                                src={`~/assets/img/avatars/avatar-${index + 1}.png`}
                                                alt="avatar"
                                                className={`rounded-circle ${selectedAvatar === index + 1 ? "border-2 border-primary" : "border-1 border-secondary"}`}
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    cursor: "pointer",
                                                    transition:
                                                        "transform 0.2s",
                                                }}
                                                onClick={() =>
                                                    setSelectedAvatar(index + 1)
                                                }
                                            />
                                        ))}
                                        <button
                                            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                padding: "0",
                                            }}
                                        >
                                            <i className="bx bx-plus fs-5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* User Details với EditableField */}
                            <div className="row g-4">
                                <EditableField
                                    label="Tên người dùng"
                                    initialValue="quizlettel5936986"
                                    fieldName="username"
                                    fieldType="text"
                                    onValueChange={handleFieldChange}
                                />

                                <EditableField
                                    label="Email"
                                    initialValue="hoanthail103@gmail.com"
                                    fieldName="email"
                                    fieldType="email"
                                    onValueChange={handleFieldChange}
                                />

                                <EditableField
                                    label="Số điện thoại"
                                    initialValue="+84 123 456 789"
                                    fieldName="phone"
                                    fieldType="phoneNumber"
                                    onValueChange={handleFieldChange}
                                />

                                <EditableField
                                    label="Trường"
                                    initialValue="HUTECH"
                                    fieldName="school"
                                    onValueChange={handleFieldChange}
                                />

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label text-muted">
                                            Loại tài khoản
                                        </label>
                                        <select className="form-select rounded-3 border-0 bg-light">
                                            <option>Teacher</option>
                                            <option>Student</option>
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
                    <div className="card p-4 rounded-4 border-0 shadow">
                        <h5 className="card-header px-0 pb-3 border-bottom border-secondary">
                            Giao diện
                        </h5>

                        <div className="card-body px-0 pt-4">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label text-muted">
                                            Hình nền
                                        </label>
                                        <select className="form-select rounded-3 border-0 bg-light">
                                            <option>Auto</option>
                                            <option>Dark</option>
                                            <option>Light</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label text-muted">
                                            Ngôn ngữ
                                        </label>
                                        <select className="form-select rounded-3 border-0 bg-light">
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
                    <div
                        className={`card p-0 rounded-4 border-0 shadow-sm overflow-hidden`}
                    >
                        <div className="card-header d-flex justify-content-between align-items-center p-4 border-bottom">
                            <h5 className="m-0 text-danger d-flex align-items-center">
                                <i className="bx bx-trash fs-4 me-2"></i>
                                Xóa tài khoản
                            </h5>
                        </div>

                        <div className="card-body p-4">
                            <div
                                className="alert alert-danger rounded-3 mb-4"
                                role="alert"
                            >
                                <div className="d-flex">
                                    <i className="bx bx-error-circle fs-4 me-2"></i>
                                    <div>
                                        <p className="mb-1 fw-semibold">
                                            Cảnh báo: Hành động không thể hoàn
                                            tác
                                        </p>
                                        <p className="mb-0">
                                            Bạn có chắc chắn muốn xóa tài khoản
                                            của mình không? Hành động này không
                                            thể hoàn tác và tất cả dữ liệu của
                                            bạn sẽ bị xóa vĩnh viễn, bao gồm:
                                        </p>
                                        <ul className="mt-2 mb-0">
                                            <li>Tất cả dữ liệu cá nhân</li>
                                            <li>Lịch sử hoạt động</li>
                                            <li>Các tài liệu đã lưu</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label text-muted">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Nhập mật khẩu của bạn"
                                />
                            </div>

                            <div className="form-check mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="confirmDelete"
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="confirmDelete"
                                >
                                    Tôi xác nhận muốn xóa tài khoản của mình
                                </label>
                            </div>

                            <button
                                className="btn btn-danger px-4 py-2"
                                disabled
                            >
                                <i className="bx bx-trash-alt me-1"></i>
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingProfilePage;
