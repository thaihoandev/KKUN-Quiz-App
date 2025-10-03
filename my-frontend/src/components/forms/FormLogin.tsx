import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/schemas/authSchema";
import InputField from "@/components/formFields/InputField";
import PasswordField from "@/components/formFields/PasswordField";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";

interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const FormLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");
    try {
      await login(data.username, data.password);
      navigate("/");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse);
        navigate("/");
      } catch (error) {
        console.error("Google Login Failed:", error);
      }
    },
    onError: () => console.log("Google Login Failed"),
  });

  return (
    <div className="card shadow-lg p-4 border-0">
      <div className="card-body">
        <h3 className="text-center mb-3 fw-bold">Welcome to KKUN QUIZ! 👋</h3>
        <p className="text-center text-muted mb-4">
          Please sign in to start your adventure
        </p>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        <form id="formAuthentication" className="mb-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Email or Username"
            id="username"
            placeholder="Enter your email or username"
            name="username"
            register={register}
            error={errors.username?.message}
          />

          <PasswordField
            label="Password"
            id="password"
            name="password"
            placeholder="••••••••"
            register={register}
            error={errors.password?.message}
          />

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="remember-me"
                {...register("rememberMe")}
              />
              <label className="form-check-label" htmlFor="remember-me">
                Remember Me
              </label>
            </div>
            <Link to="/forgot-password" className="text-primary">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center mb-4">
          <span className="text-muted">New on our platform? </span>
          <Link to="/register" className="text-primary">
            Create an account
          </Link>
        </p>

        <div className="d-flex align-items-center mb-4">
          <hr className="flex-grow-1" />
          <span className="mx-2 text-muted">or</span>
          <hr className="flex-grow-1" />
        </div>

        <div className="d-flex justify-content-center">
          <button
            type="button"
            onClick={() => googleLogin()}
            className="btn btn-outline-primary btn-lg d-flex align-items-center"
          >
            <i className="bx bxl-google"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormLogin;
