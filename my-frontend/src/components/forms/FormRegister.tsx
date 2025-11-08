import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "@/schemas/authSchema";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import { notification } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  GoogleOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";

interface RegisterFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  terms: boolean;
}

const FormRegister: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register: registerUser, loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.username, data.email, data.password);
      notification.success({
        message: "Success",
        description: "Account created successfully! Redirecting...",
        duration: 2,
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Registration failed. Please try again.";
      notification.error({
        message: "Registration Failed",
        description: errorMsg,
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      try {
        await loginWithGoogle(tokenResponse);
        navigate("/");
      } catch (error: unknown) {
        console.error("Google Login Failed:", error);
      }
    },
    onError: () => console.log("Google Login Failed"),
  });

  return (
    <div style={{ width: "100%", maxWidth: "380px", maxHeight: "90vh", overflowY: "auto" }}>
      {/* Form Header */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <h2
          style={{
            color: "var(--primary-color)",
            fontWeight: 900,
            fontSize: "1.6rem",
            marginBottom: "0.3rem",
          }}
        >
          Create Account 🚀
        </h2>
        <p style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
          Join millions of players
        </p>
      </div>

      {/* Form */}
      <div>
        {/* Full Name Field */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            <UserOutlined style={{ marginRight: "0.4rem" }} />
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            {...register("name")}
            style={{
              width: "100%",
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              border: errors.name ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
              background: "var(--surface-color)",
              color: "var(--text-color)",
              fontSize: "0.85rem",
              transition: "var(--transition)",
              fontFamily: "var(--font-family)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              if (!errors.name) e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.name ? "var(--danger-color)" : "var(--border-color)";
            }}
          />
          {errors.name && (
            <p style={{ color: "var(--danger-color)", fontSize: "0.7rem", marginTop: "0.2rem" }}>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Username Field */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            <UserOutlined style={{ marginRight: "0.4rem" }} />
            Username
          </label>
          <input
            type="text"
            placeholder="Enter username"
            {...register("username")}
            style={{
              width: "100%",
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              border: errors.username ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
              background: "var(--surface-color)",
              color: "var(--text-color)",
              fontSize: "0.85rem",
              transition: "var(--transition)",
              fontFamily: "var(--font-family)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              if (!errors.username) e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.username ? "var(--danger-color)" : "var(--border-color)";
            }}
          />
          {errors.username && (
            <p style={{ color: "var(--danger-color)", fontSize: "0.7rem", marginTop: "0.2rem" }}>
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            <MailOutlined style={{ marginRight: "0.4rem" }} />
            Email
          </label>
          <input
            type="email"
            placeholder="Enter email"
            {...register("email")}
            style={{
              width: "100%",
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              border: errors.email ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
              background: "var(--surface-color)",
              color: "var(--text-color)",
              fontSize: "0.85rem",
              transition: "var(--transition)",
              fontFamily: "var(--font-family)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              if (!errors.email) e.currentTarget.style.borderColor = "var(--primary-color)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.email ? "var(--danger-color)" : "var(--border-color)";
            }}
          />
          {errors.email && (
            <p style={{ color: "var(--danger-color)", fontSize: "0.7rem", marginTop: "0.2rem" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.3rem",
            }}
          >
            <LockOutlined style={{ marginRight: "0.4rem" }} />
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                paddingRight: "2.3rem",
                borderRadius: "8px",
                border: errors.password ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
                background: "var(--surface-color)",
                color: "var(--text-color)",
                fontSize: "0.85rem",
                transition: "var(--transition)",
                fontFamily: "var(--font-family)",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                if (!errors.password) e.currentTarget.style.borderColor = "var(--primary-color)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.password ? "var(--danger-color)" : "var(--border-color)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0.8rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-light)",
                cursor: "pointer",
                fontSize: "0.95rem",
                transition: "color 0.25s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-light)";
              }}
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
          {errors.password && (
            <p style={{ color: "var(--danger-color)", fontSize: "0.7rem", marginTop: "0.2rem" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              cursor: "pointer",
              color: "var(--text-light)",
              fontSize: "0.8rem",
            }}
          >
            <input
              type="checkbox"
              {...register("terms")}
              style={{ cursor: "pointer", marginTop: "0.2rem" }}
            />
            <span>
              I agree to{" "}
              <a
                href="/terms"
                style={{
                  color: "var(--primary-color)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                privacy policy & terms
              </a>
            </span>
          </label>
          {errors.terms && (
            <p style={{ color: "var(--danger-color)", fontSize: "0.7rem", margin: "0.3rem 0 0" }}>
              {errors.terms.message}
            </p>
          )}
        </div>

        {/* Sign Up Button */}
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: loading ? "var(--primary-dark)" : "var(--gradient-primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: loading ? 0.8 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        {/* Sign In Link */}
        <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: "0.8rem", marginTop: "1rem", marginBottom: "1.2rem" }}>
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "var(--primary-color)",
              textDecoration: "none",
              fontWeight: 700,
              transition: "opacity 0.25s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.7";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Sign in
          </a>
        </p>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={() => googleLogin()}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "var(--surface-alt)",
            color: "var(--text-color)",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--gradient-primary)";
            (e.currentTarget as HTMLElement).style.color = "white";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-color)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-alt)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-color)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
          }}
        >
          <GoogleOutlined style={{ fontSize: "0.95rem" }} />
          Google
        </button>
      </div>
    </div>
  );
};

export default FormRegister;