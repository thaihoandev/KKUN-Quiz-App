import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "react-bootstrap";
import NavigationMenu from "@/components/NavigationMenu"; // Use the provided NavigationMenu
import PasswordField from "@/components/formFields/PasswordField";
import { changePasswordschema } from "@/schemas/authSchema";
import { useState } from "react";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordPage = () => {
  const [activeTab, setActiveTab] = useState("/change-password"); // Manage active tab
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const menuItems = [
    { path: "/settings", icon: "bx-cog", label: "Settings" },
    { path: "/change-password", icon: "bx-lock", label: "Change Password" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({ resolver: yupResolver(changePasswordschema) });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    setSubmitMessage(null);
    try {
      // Replace with actual API call
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (response.ok) {
        setSubmitMessage({ type: "success", message: "Password updated successfully!" });
        reset(); // Clear form after success
      } else {
        const errorData = await response.json();
        setSubmitMessage({ type: "error", message: errorData.message || "Failed to update password" });
      }
    } catch (error) {
      setSubmitMessage({ type: "error", message: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container-xxl flex-grow-1 container-p-y text-white"
      style={{ minHeight: "100vh" }}
    >
      <div className="row">
        <div className="col-12">
          <NavigationMenu
            menuItems={menuItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Change Password Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card p-4 rounded-4 border-0 shadow">
            <h5 className="card-header px-0 pb-3 border-bottom border-secondary">
              Change Password
            </h5>
            <div className="card-body px-0 pt-4">
              {submitMessage && (
                <div
                  className={`alert alert-${submitMessage.type === "success" ? "success" : "danger"} mb-4`}
                  role="alert"
                >
                  {submitMessage.message}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row mb-3">
                  <div className="col-12">
                    <PasswordField
                      label="Current password"
                      id="currentPassword"
                      name="currentPassword"
                      placeholder="••••••••••"
                      register={register}
                      error={errors.currentPassword?.message}
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
                      error={errors.confirmPassword?.message}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-center">
                  <Button
                    variant="primary"
                    className="px-4 py-2 mt-5"
                    type="submit"
                    disabled={isLoading}
                    aria-disabled={isLoading}
                    aria-label="Update password"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
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