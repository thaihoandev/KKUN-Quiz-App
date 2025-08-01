import React, {useState} from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface AddQuestionByTypeModalProps {
    show: boolean;
    onHide: () => void;
    onAddQuestion: (type: string) => void;
}

const AddQuestionByTypeModal: React.FC<AddQuestionByTypeModalProps> = ({
    show,
    onHide,
    onAddQuestion,
}) => {
    const [selectedType, setSelectedType] = useState<string>("");

    const handleAdd = () => {
        if (selectedType) {
            onAddQuestion(selectedType);
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Chọn loại câu hỏi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-column">

                    <Button
                        variant={
                            selectedType === "SINGLE_CHOICE"
                                ? "primary"
                                : "outline-primary"
                        }
                        className="mb-2"
                        onClick={() => setSelectedType("SINGLE_CHOICE")}
                    >
                        Một lựa chọn (Single Choice)
                    </Button>
                    <Button
                        variant={
                            selectedType === "MULTIPLE_CHOICE"
                                ? "primary"
                                : "outline-primary"
                        }
                        className="mb-2"
                        onClick={() => setSelectedType("MULTIPLE_CHOICE")}
                    >
                        Nhiều lựa chọn (Multiple Choice)
                    </Button>
                    <Button
                        variant={
                            selectedType === "TRUE_FALSE"
                                ? "primary"
                                : "outline-primary"
                        }
                        className="mb-2"
                        onClick={() => setSelectedType("TRUE_FALSE")}
                    >
                        Đúng/Sai (True/False)
                    </Button>
                    <Button
                        variant={
                            selectedType === "FILL_IN_THE_BLANK"
                                ? "primary"
                                : "outline-primary"
                        }
                        className="mb-2"
                        onClick={() => setSelectedType("FILL_IN_THE_BLANK")}
                    >
                        Điền vào chỗ trống (Fill in the Blank)
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Hủy
                </Button>
                <Button
                    variant="primary"
                    onClick={handleAdd}
                    disabled={!selectedType}
                >
                    Thêm
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddQuestionByTypeModal;
