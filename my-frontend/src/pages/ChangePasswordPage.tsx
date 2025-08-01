import React from "react";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import * as yup from "yup";
import NavigationMenuProfile from "@/components/NavigationMenuProfile";
import PasswordField from "@/components/formFields/PasswordField";
import {Button} from "react-bootstrap";
import {changePasswordschema} from "@/schemas/authSchema";

const ChangePasswordPage = () => {
    const testMenuItems = [
        {path: "/settings", icon: "bx-cog", label: "Settings"},
        {path: "/change-password", icon: "bx-lock", label: "Change Password"},
    ];

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm({resolver: yupResolver(changePasswordschema)});

    const onSubmit = (data: any) => {
        console.log("Mật khẩu đã được cập nhật", data);
        // Thêm logic cập nhật mật khẩu vào API nếu cần
    };

    return (
        <div
            className="container-xxl flex-grow-1 container-p-y text-white"
            style={{minHeight: "100vh"}}
        >
            <div className="row">
                <div className="col-12">
                    <NavigationMenuProfile menuItems={testMenuItems} />
                </div>
            </div>

            {/* Change Password Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card p-4 rounded-4 border-0 shadow">
                        <h5 className="card-header px-0 pb-3 border-bottom border-secondary">
                            Change password
                        </h5>
                        <div className="card-body px-0 pt-4">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <PasswordField
                                            label="Current password"
                                            id="currentPassword"
                                            name="currentPassword"
                                            placeholder="••••••••••"
                                            register={register}
                                            error={
                                                errors.currentPassword?.message
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <PasswordField
                                            label="New password"
                                            id="newPassword"
                                            name="newPassword"
                                            placeholder="••••••••••"
                                            register={register}
                                            error={errors.newPassword?.message}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <PasswordField
                                            label="Confirm password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="••••••••••"
                                            register={register}
                                            error={
                                                errors.confirmPassword?.message
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="d-flex justify-content-center">
                                    <Button
                                        className="btn btn-primary px-4 py-2 mt-5"
                                        type="submit"
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
