import React, { useMemo, useState } from "react";
import { Modal, Button, Tooltip, OverlayTrigger } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFieldValidationSchema } from "@/schemas/fieldSchema";

interface EditableFieldProps {
  label: string;
  initialValue: string;
  fieldName: string;
  fieldType?: "text" | "phoneNumber" | "email";
  disabled?: boolean; // NEW
  onValueChange?: (fieldName: string, newValue: string) => void | Promise<void>; // allow async
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  initialValue,
  fieldName,
  fieldType = "text",
  disabled = false,
  onValueChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Nếu initialValue thay đổi từ ngoài vào, sync lại (tuỳ nhu cầu có thể bỏ)
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const schema = getFieldValidationSchema(fieldType);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ newValue: string }>({
    resolver: yupResolver(schema),
    defaultValues: { newValue: value },
  });

  // Mỗi lần mở modal, reset giá trị form theo value hiện tại
  React.useEffect(() => {
    if (showModal) {
      reset({ newValue: value });
    }
  }, [showModal, value, reset]);

  const inputType = useMemo(() => {
    if (fieldType === "phoneNumber") return "tel";
    return fieldType; // "text" | "email"
  }, [fieldType]);

  const handleEditClick = () => setShowModal(true);

  const handleSave = async (data: { newValue: string }) => {
    try {
      setSubmitting(true);
      setValue(data.newValue);
      if (onValueChange) {
        await onValueChange(fieldName, data.newValue);
      }
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="col-md-6 d-flex justify-content-center align-items-center flex-column">
      <div className="form-group w-100">
        <label className="form-label text-muted fw-bold mb-1">{label}</label>
        <div className="d-flex align-items-center justify-content-between border rounded p-3 shadow-sm">
          <h6
            className="fw-semibold mb-0 flex-grow-1 text-truncate"
            style={{ maxWidth: "80%" }}
            title={value}
          >
            {value}
          </h6>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{`Chỉnh sửa ${label.toLowerCase()}`}</Tooltip>}
          >
            <span>
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center"
                onClick={handleEditClick}
                disabled={disabled}
              >
                <i className="bx bx-edit fs-5 me-1"></i>
                Sửa
              </Button>
            </span>
          </OverlayTrigger>
        </div>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => (submitting ? null : setShowModal(false))}
        dialogClassName="modal-dialog-centered"
        backdrop={submitting ? "static" : true}
      >
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="text-center w-100">Chỉnh sửa {label}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center pb-7">
          <form
            className="w-100 d-flex flex-column align-items-center"
            onSubmit={handleSubmit(handleSave)}
          >
            <input
              type={inputType}
              className={`form-control w-75 border-primary shadow-sm ${errors.newValue ? "is-invalid" : ""}`}
              {...register("newValue")}
              disabled={disabled || submitting}
            />
            <div className="invalid-feedback text-center mt-1">
              {errors.newValue?.message as string}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center mt-2">
          <Button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            className="btn btn-primary"
            type="submit"
            onClick={handleSubmit(handleSave)}
            disabled={disabled || submitting}
          >
            {submitting ? (
              <>
                <i className="bx bx-loader-alt bx-spin me-2" /> Đang lưu...
              </>
            ) : (
              "Lưu"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditableField;
