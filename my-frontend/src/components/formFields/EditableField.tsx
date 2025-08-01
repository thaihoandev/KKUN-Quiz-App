import React, {useState} from "react";
import {Modal, Button, Tooltip, OverlayTrigger} from "react-bootstrap";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {getFieldValidationSchema} from "@/schemas/fieldSchema";
import "bootstrap/dist/css/bootstrap.min.css";

interface EditableFieldProps {
    label: string;
    initialValue: string;
    fieldName: string;
    fieldType?: "text" | "phoneNumber" | "email";
    onValueChange?: (fieldName: string, newValue: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
    label,
    initialValue,
    fieldName,
    fieldType = "text",
    onValueChange,
}) => {
    const [value, setValue] = useState(initialValue);
    const [showModal, setShowModal] = useState(false);

    const schema = getFieldValidationSchema(fieldType);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm({resolver: yupResolver(schema)});

    const handleEditClick = () => setShowModal(true);
    const handleSave = (data: any) => {
        setValue(data.newValue);
        setShowModal(false);
        if (onValueChange) {
            onValueChange(fieldName, data.newValue);
        }
    };

    return (
        <div className="col-md-6 d-flex justify-content-center align-items-center flex-column">
            <div className="form-group w-100">
                <label className="form-label text-muted fw-bold mb-1">
                    {label}
                </label>
                <div className="d-flex align-items-center justify-content-between border rounded p-3 shadow-sm">
                    <h6
                        className="fw-semibold mb-0 flex-grow-1 text-truncate"
                        style={{maxWidth: "80%"}}
                    >
                        {value}
                    </h6>
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>{`Chỉnh sửa ${label.toLowerCase()}`}</Tooltip>
                        }
                    >
                        <Button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center"
                            onClick={handleEditClick}
                        >
                            <i className="bx bx-edit fs-5 me-1"></i>
                            Sửa
                        </Button>
                    </OverlayTrigger>
                </div>
            </div>

            {/* Modal từ React-Bootstrap */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                dialogClassName="modal-dialog-centered"
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="text-center w-100">
                        Chỉnh sửa {label}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-column align-items-center pb-7">
                    <form
                        className="w-100 d-flex flex-column align-items-center "
                        onSubmit={handleSubmit(handleSave)}
                    >
                        <input
                            type={fieldType}
                            className={`form-control w-75 border-primary shadow-sm ${errors.newValue ? "is-invalid" : ""}`}
                            {...register("newValue")}
                            defaultValue={value}
                        />
                        <div className="invalid-feedback text-center mt-1">
                            {errors.newValue?.message}
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-center mt-2">
                    <Button
                        className="btn btn-secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        className="btn btn-primary"
                        type="submit"
                        onClick={handleSubmit(handleSave)}
                    >
                        Lưu
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EditableField;
