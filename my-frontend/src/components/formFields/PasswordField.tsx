import React, { useState, useRef } from "react";
import { UseFormRegister } from "react-hook-form";

interface PasswordFieldProps {
  label: string;
  id: string;
  name: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  id,
  name,
  placeholder,
  register,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTogglePassword = () => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    setShowPassword((prev) => !prev);
    
    // Giữ position con trỏ
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  return (
    <div className="mb-4">
      <label className="form-label fw-bold mb-2" htmlFor={id}>
        {label}
      </label>

      <div className="position-relative">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          className={`form-control ${error ? "is-invalid" : ""}`}
          {...register(name)}
          placeholder={placeholder}
          style={{ paddingRight: "3rem" }}
        />

        <button
          type="button"
          className="btn-icon position-absolute end-0 top-50 translate-middle-y"
          onClick={() => setShowPassword((prev) => !prev)}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-light)",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}></i>
        </button>
      </div>

      {error && (
        <div className="invalid-feedback d-block mt-2 text-danger small fw-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default PasswordField;