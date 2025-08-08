import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/schemas/authSchema";
import InputField from "@/components/formFields/InputField";
import PasswordField from "@/components/formFields/PasswordField";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";

// Define form data interface
interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const FormLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { login, loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver<LoginFormData, any, LoginFormData>(loginSchema),
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
    <div className="col-12 col-lg-5 col-xl-4 d-flex align-items-center p-sm-5 p-4">
      <div className="card shadow-lg w-100 mx-auto p-4">
        <h4 className="mb-2 text-center fw-bold">Welcome to KKUN QUIZ! 👋</h4>
        <p className="mb-4 text-center text-muted">
          Please sign in to start your adventure
        </p>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        <form
          id="formAuthentication"
          className="mb-4"
          onSubmit={handleSubmit(onSubmit)}
        >
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
            placeholder="••••••••••"
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
            className="btn btn-primary btn-lg d-grid w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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

        <div className="divider mb-4">
          <div className="divider-text text-muted">or</div>
        </div>

        <div className="d-flex justify-content-center">
          <button
            onClick={() => googleLogin()}
            className="btn btn-outline-primary btn-lg d-flex align-items-center"
          >
            <i className="bx bxl-google me-2"></i>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormLogin;