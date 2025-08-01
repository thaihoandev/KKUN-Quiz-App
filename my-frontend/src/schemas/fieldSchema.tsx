import * as yup from "yup";

export const getFieldValidationSchema = (fieldType: string) => {
    switch (fieldType) {
        case "text":
            return yup.object().shape({
                newValue: yup
                    .string()
                    .required("Trường này không được để trống")
                    .max(50, "Tối đa 50 ký tự"),
            });
        case "email":
            return yup.object().shape({
                newValue: yup
                    .string()
                    .email("Email không hợp lệ")
                    .required("Trường này không được để trống"),
            });
        case "phoneNumber":
            return yup.object().shape({
                newValue: yup
                    .string()
                    .matches(
                        /^\d{10,15}$/,
                        "Số điện thoại phải có từ 10 đến 15 chữ số",
                    )
                    .required("Trường này không được để trống"),
            });
        default:
            return yup.object().shape({
                newValue: yup
                    .string()
                    .required("Trường này không được để trống"),
            });
    }
};
