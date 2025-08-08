import * as yup from "yup";
interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  terms: boolean;
}
export const loginSchema: yup.ObjectSchema<LoginFormData> = yup.object({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Must be at least 3 characters"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  rememberMe: yup.boolean().optional(),
}).required();

export const registerSchema: yup.ObjectSchema<RegisterFormData> = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .min(2, "Must be at least 2 characters"),
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Must be at least 3 characters"),
  email: yup
    .string()
    .email("Must be a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  terms: yup
    .boolean()
    .required("You must agree to the terms")
    .oneOf([true], "You must agree to the terms"),
}).required();

export const changePasswordschema = yup.object().shape({
    currentPassword: yup.string().required("Vui lòng nhập mật khẩu hiện tại"),
    newPassword: yup
        .string()
        .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
        .required("Vui lòng nhập mật khẩu mới"),
    confirmPassword: yup
        .string()
        .oneOf(
            [yup.ref("newPassword"), undefined],
            "Mật khẩu xác nhận không khớp",
        )
        .required("Vui lòng xác nhận mật khẩu"),
});
