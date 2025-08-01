import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {registerSchema} from "@/schemas/authSchema";
import TextInput from "@/components/formFields/InputField";
import PasswordInput from "@/components/formFields/PasswordField";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {useAuth} from "@/hooks/useAuth";
import {useGoogleLogin} from "@react-oauth/google";

const FormRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // ✅ Lấy hàm register từ Zustand thay vì từ Context
    const {register: registerUser, loginWithGoogle} = useAuth();
    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm({
        resolver: yupResolver(registerSchema),
    });

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

    // Xử lý submit form đăng ký
    const onSubmit = async (data: any) => {
        setLoading(true);
        setErrorMessage("");

        try {
            await registerUser(
                data.name,
                data.username,
                data.email,
                data.password,
            );
            navigate("/"); // Chuyển hướng sau khi đăng ký thành công
        } catch (error) {
            setErrorMessage(error as string);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex col-12 col-lg-5 col-xl-4 align-items-center authentication-bg p-sm-12 p-6">
            <div className="w-px-400 mx-auto mt-sm-12 mt-8">
                <h4 className="mb-1">Adventure starts here 🚀</h4>
                <p className="mb-6">Make your app management easy and fun!</p>

                {/* Hiển thị lỗi nếu có */}
                {errorMessage && (
                    <p className="text-danger text-center">{errorMessage}</p>
                )}

                {/* Form đăng ký */}
                <form
                    id="formAuthentication"
                    className="mb-6"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <TextInput
                        label="Full name"
                        id="name"
                        name="name"
                        placeholder="Enter your fullname"
                        register={register}
                        error={errors.name?.message}
                    />

                    {/* Username */}
                    <TextInput
                        label="Username"
                        id="username"
                        name="username"
                        placeholder="Enter your username"
                        register={register}
                        error={errors.username?.message}
                    />

                    {/* Email */}
                    <TextInput
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        register={register}
                        error={errors.email?.message}
                    />

                    {/* Password */}
                    <PasswordInput
                        label="Password"
                        id="password"
                        name="password"
                        placeholder="••••••••••"
                        register={register}
                        error={errors.password?.message}
                    />

                    {/* Điều khoản */}
                    <div className="my-4 form-control-validation ">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="terms-conditions"
                                {...register("terms")}
                                required
                            />
                            <label
                                className="form-check-label"
                                htmlFor="terms-conditions"
                            >
                                I agree to{" "}
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    privacy policy & terms
                                </a>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary d-grid w-100"
                        disabled={loading}
                    >
                        {loading ? "Signing up..." : "Sign up"}
                    </button>
                </form>

                {/* Already have an account */}
                <p className="text-center">
                    <span>Already have an account?</span>
                    <Link to="/login">
                        <span> Sign in instead</span>
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

export default FormRegister;
