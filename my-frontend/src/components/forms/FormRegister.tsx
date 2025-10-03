import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "@/schemas/authSchema";
import TextInput from "@/components/formFields/InputField";
import PasswordInput from "@/components/formFields/PasswordField";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";

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
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");
    try {
      await registerUser(data.name, data.username, data.email, data.password);
      navigate("/");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred during registration."
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
    <div className="card shadow-lg w-100 mx-auto p-4 border-0" style={{ maxWidth: "420px" }}>
      <h4 className="mb-2 text-center fw-bold">Adventure starts here 🚀</h4>
      <p className="mb-4 text-center text-muted">
        Make your app management easy and fun!
      </p>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <form id="formAuthentication" className="mb-4" onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          label="Full name"
          id="name"
          name="name"
          placeholder="Enter your full name"
          register={register}
          error={errors.name?.message}
        />

        <TextInput
          label="Username"
          id="username"
          name="username"
          placeholder="Enter your username"
          register={register}
          error={errors.username?.message}
        />

        <TextInput
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          register={register}
          error={errors.email?.message}
        />

        <PasswordInput
          label="Password"
          id="password"
          name="password"
          placeholder="••••••••"
          register={register}
          error={errors.password?.message}
        />

        <div className="mb-4">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="terms-conditions"
              {...register("terms")}
            />
            <label className="form-check-label" htmlFor="terms-conditions">
              I agree to{" "}
              <Link to="#" className="text-primary">
                privacy policy & terms
              </Link>
            </label>
          </div>
          {errors.terms?.message && (
            <div className="invalid-feedback d-block">{errors.terms.message}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 mb-3"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            "Sign up"
          )}
        </button>
      </form>

      <p className="text-center mb-4">
        <span className="text-muted">Already have an account? </span>
        <Link to="/login" className="text-primary">
          Sign in instead
        </Link>
      </p>

      <div className="d-flex align-items-center mb-4">
        <hr className="flex-grow-1" />
        <span className="mx-2 text-muted">or</span>
        <hr className="flex-grow-1" />
      </div>

      <div className="d-flex justify-content-center">
        <button
          onClick={() => googleLogin()}
          className="btn btn-outline-primary btn-lg d-flex align-items-center"
        >
          <i className="bx bxl-google"></i>
        </button>
      </div>
    </div>
  );
};

export default FormRegister;
