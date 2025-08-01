import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {loginSchema} from "@/schemas/authSchema";
import InputField from "@/components/formFields/InputField";
import PasswordField from "@/components/formFields/PasswordField";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {useAuth} from "@/hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";

const FormLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {login, loginWithGoogle} = useAuth();

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        setErrorMessage("");
        try {
            await login(data.username, data.password);
            navigate("/"); // Chuyển hướng khi đăng nhập thành công
        } catch (error: any) {
            setErrorMessage(error?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await loginWithGoogle(tokenResponse);
                navigate("/"); // Chuyển hướng sau khi đăng nhập thành công
            } catch (error) {
                console.error("Google Login Failed:", error);
            }
        },
        onError: () => console.log("Google Login Failed"),
    });

    return (
        <div className="d-flex col-12 col-lg-5 col-xl-4 align-items-center authentication-bg p-sm-12 p-6">
            <div className="w-px-400 mx-auto mt-sm-12 mt-8">
                <h4 className="mb-1">Welcome to KKUN QUIZ! 👋</h4>
                <p className="mb-6">
                    Please sign in to your account and start the adventure
                </p>

                {errorMessage && <p className="text-danger">{errorMessage}</p>}

                <form
                    id="formAuthentication"
                    className="mb-6"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    {/* Email Input */}
                    <InputField
                        label="Email or Username"
                        id="username"
                        placeholder="Enter your email or username"
                        name="username"
                        register={register}
                        error={errors.username?.message}
                    />

                    {/* Password Input */}
                    <PasswordField
                        label="Password"
                        id="password"
                        name="password"
                        placeholder="••••••••••"
                        register={register}
                        error={errors.password?.message}
                    />

                    {/* Remember Me */}
                    <div className="my-3">
                        <div className="d-flex justify-content-between">
                            <div className="form-check mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="remember-me"
                                    {...register("rememberMe")}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="remember-me"
                                >
                                    Remember Me
                                </label>
                            </div>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                <p className="mb-0">Forgot Password?</p>
                            </a>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary d-grid w-100"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                {/* Register */}
                <p className="text-center">
                    <span>New on our platform?</span>
                    <Link to={"/register"}>
                        <span> Create an account</span>
                    </Link>
                </p>

                <div className="divider my-6">
                    <div className="divider-text">or</div>
                </div>

                {/* Social Login */}
                <div className="d-flex justify-content-center">
                    {/* <a href="#" onClick={(e) => e.preventDefault()} className="btn btn-sm btn-icon rounded-circle btn-text-facebook me-2">
                        <i className="icon-base bx bxl-facebook-circle icon-40px"></i>
                    </a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="btn btn-sm btn-icon rounded-circle btn-text-twitter me-2">
                        <i className="icon-base bx bxl-twitter icon-40px"></i>
                    </a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="btn btn-sm btn-icon rounded-circle btn-text-github me-2">
                        <i className="icon-base bx bxl-github icon-40px"></i>
                    </a> */}
                    <a
                        href="#"
                        onClick={() => googleLogin()}
                        className="btn btn-sm btn-icon rounded-circle btn-text-google-plus"
                    >
                        <i className="icon-base bx bxl-google icon-40px"></i>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FormLogin;
