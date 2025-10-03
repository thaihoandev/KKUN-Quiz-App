import React from "react";
import {UseFormRegister} from "react-hook-form";

interface InputFieldProps {
    label: string;
    id: string;
    name: string;
    type?: string;
    placeholder?: string;
    register: UseFormRegister<any>;
    error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    id,
    name,
    type = "text",
    placeholder,
    register,
    error,
}) => {
    return (
        <div className="mb-3 form-control-validation position-relative pb-3">
            <label htmlFor={id} className="form-label fw-bold">
                {label}
            </label>
            <input
                type={type}
                className={`form-control ${error ? "is-invalid" : ""}`}
                id={id}
                {...register(name)}
                placeholder={placeholder}
            />
            <div className="invalid-feedback position-absolute mt-1">
                {error}
            </div>
        </div>
    );
};

export default InputField;
