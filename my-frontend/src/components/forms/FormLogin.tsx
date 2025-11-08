import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/schemas/authSchema";
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
} from "@ant-design/icons";

interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const FormLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      notification.success({
        message: "Success",
        description: "Login successful! Redirecting...",
        duration: 2,
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Login failed. Please try again.";
      notification.error({
        message: "Login Failed",
        description: errorMsg,
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse);
        notification.success({
          message: "Success",
          description: "Google login successful! Redirecting...",
          duration: 2,
        });
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        notification.error({
          message: "Google Login Failed",
          description: "Failed to login with Google. Please try again.",
          duration: 4,
        });
      }
    },
    onError: () => {
      notification.error({
        message: "Google Login Error",
        description: "Google login failed. Please try again.",
        duration: 4,
      });
    },
  });

  return (
    <div style={{ width: "100%", maxWidth: "380px", maxHeight: "90vh", overflowY: "auto" }}>
      {/* Form Header */}
      <div style={{ marginBottom: "1.8rem", textAlign: "center" }}>
        <h2
          style={{
            color: "var(--primary-color)",
            fontWeight: 900,
            fontSize: "1.8rem",
            marginBottom: "0.4rem",
          }}
        >
          Welcome Back
        </h2>
        <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
          Sign in to continue
        </p>
      </div>

      {/* Username Field */}
      <div style={{ marginBottom: "1.2rem" }}>
        <label
          style={{
            display: "block",
            color: "var(--text-color)",
            fontWeight: 600,
            fontSize: "0.85rem",
            marginBottom: "0.4rem",
          }}
        >
          <UserOutlined style={{ marginRight: "0.4rem" }} />
          Email or Username
        </label>
        <input
          type="text"
          placeholder="Enter email or username"
          {...register("username")}
          style={{
            width: "100%",
            padding: "0.7rem 0.9rem",
            borderRadius: "8px",
            border: errors.username ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
            background: "var(--surface-color)",
            color: "var(--text-color)",
            fontSize: "0.9rem",
            transition: "var(--transition)",
            fontFamily: "var(--font-family)",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (!errors.username) {
              e.currentTarget.style.borderColor = "var(--primary-color)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.username ? "var(--danger-color)" : "var(--border-color)";
          }}
        />
        {errors.username && (
          <p style={{ color: "var(--danger-color)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div style={{ marginBottom: "1.2rem" }}>
        <label
          style={{
            display: "block",
            color: "var(--text-color)",
            fontWeight: 600,
            fontSize: "0.85rem",
            marginBottom: "0.4rem",
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
              padding: "0.7rem 0.9rem",
              paddingRight: "2.3rem",
              borderRadius: "8px",
              border: errors.password ? "2px solid var(--danger-color)" : "2px solid var(--border-color)",
              background: "var(--surface-color)",
              color: "var(--text-color)",
              fontSize: "0.9rem",
              transition: "var(--transition)",
              fontFamily: "var(--font-family)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              if (!errors.password) {
                e.currentTarget.style.borderColor = "var(--primary-color)";
              }
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
              fontSize: "1rem",
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
          <p style={{ color: "var(--danger-color)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember & Forgot */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.2rem",
          fontSize: "0.8rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: "pointer",
            color: "var(--text-light)",
          }}
        >
          <input
            type="checkbox"
            {...register("rememberMe")}
            style={{ cursor: "pointer" }}
          />
          Remember me
        </label>
        <a
          href="/forgot-password"
          style={{
            color: "var(--primary-color)",
            textDecoration: "none",
            fontWeight: 600,
            transition: "opacity 0.25s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          Forgot?
        </a>
      </div>

      {/* Sign In Button */}
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.8rem",
          background: loading ? "var(--primary-dark)" : "var(--gradient-primary)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "0.95rem",
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
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {/* Sign Up Link */}
      <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: "0.8rem", marginTop: "1.2rem", marginBottom: "1.5rem" }}>
        No account?{" "}
        <a
          href="/register"
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
          Sign up
        </a>
      </p>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.2rem" }}>
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
          padding: "0.8rem",
          background: "var(--surface-alt)",
          color: "var(--text-color)",
          border: "2px solid var(--border-color)",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
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
        <GoogleOutlined style={{ fontSize: "1rem" }} />
        Google
      </button>
    </div>
  );
};

export default FormLogin;