import React, {useEffect, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
    getQuestionsByQuizId,
    publishedQuiz,
    updateQuiz,
} from "@/services/quizService";
import {useParams, useNavigate} from "react-router-dom";
import QuestionEditorHeader from "@/components/headers/QuestionEditorHeader";
import QuestionEditorSidebar from "@/components/sidebars/QuestionEditorSidebar";
import QuestionEditorCard from "@/components/cards/QuestionEditorCard";
import AddQuestionByTypeModal from "@/components/modals/AddQuestionByTypeModal";
import {Question} from "@/interfaces";

const QuizEditorPage: React.FC = () => {
    const {quizId} = useParams<{quizId: string}>();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!quizId) return;
            setLoading(true);
            try {
                const data = await getQuestionsByQuizId(quizId);
                setQuestions(data);
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
            setLoading(false);
        };
        fetchQuestions();
    }, [quizId]);

    const handleTimeChange = (
        quizId: string,
        questionId: string,
        time: number,
    ) => {
        setQuestions((prevQuestions) =>
            prevQuestions.map((q) =>
                q.questionId === questionId ? {...q, timeLimit: time} : q,
            ),
        );
    };

    const handlePointsChange = (
        quizId: string,
        questionId: string,
        points: number,
    ) => {
        setQuestions((prevQuestions) =>
            prevQuestions.map((q) =>
                q.questionId === questionId ? {...q, points: points} : q,
            ),
        );
    };

    // Chuyển hướng đến trang tạo câu hỏi mới khi chọn loại câu hỏi
    const handleQuestionTypeSelection = (type: string) => {
        if (!quizId) return;
        // Đóng modal
        setShowModal(false);
        // Chuyển hướng đến trang tạo câu hỏi với loại câu hỏi được chọn
        navigate(`/quizzes/${quizId}/questions/create?type=${type}`);
    };

    const handlePublish = async () => {
        if (!quizId) return;
        setPublishing(true);
        try {
            await publishedQuiz(quizId);
            alert("Bài quiz đã được xuất bản thành công!");
            navigate(`/quizzes`);
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất bản bài quiz!");
        } finally {
            setPublishing(false);
        }
    };

    const handleBack = () => {
        navigate(`/quizzes/${quizId}`);
    };

    return (
        <div className="container-fluid bg-light" style={{minHeight: "100vh"}}>
            <QuestionEditorHeader
                onBack={handleBack}
                onPublish={handlePublish}
                publishing={publishing}
            />
            <div className="container py-4">
                <div className="row">
                    <QuestionEditorSidebar />
                    <div className="col-8">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <h6 className="fw-bold mb-3">
                                    Tìm kiếm từ Thư viện Quizizz
                                </h6>
                                <div className="input-group mb-3">
                                    <span className="input-group-text bg-white border-end-0">
                                        <i className="bx bx-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder="Nhận biết"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="fw-bold fs-5">
                                {questions.length} câu hỏi{" "}
                                <span className="text-muted small">
                                    (
                                    {questions.reduce(
                                        (sum, q) => sum + q.points,
                                        0,
                                    )}{" "}
                                    điểm)
                                </span>
                            </span>
                            <button
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={() => setShowModal(true)}
                            >
                                <i className="bx bx-plus-circle"></i> Thêm câu
                                hỏi
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">
                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Đang tải...
                                    </span>
                                </div>
                                <p className="mt-2">Đang tải câu hỏi...</p>
                            </div>
                        ) : questions.length > 0 ? (
                            questions.map((question, idx) => (
                                <QuestionEditorCard
                                    key={question.questionId}
                                    quizId={quizId ?? ""}
                                    question={question}
                                    index={idx}
                                    onTimeChange={handleTimeChange}
                                    onPointsChange={handlePointsChange}
                                />
                            ))
                        ) : (
                            <div className="text-center py-4 card shadow-sm">
                                <div className="card-body">
                                    <p className="mb-3">
                                        Chưa có câu hỏi nào. Hãy thêm câu hỏi
                                        đầu tiên!
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowModal(true)}
                                    >
                                        <i className="bx bx-plus-circle me-1"></i>{" "}
                                        Thêm câu hỏi
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-center mt-4">
                            <button
                                className="btn btn-outline-primary me-2"
                                onClick={() => setShowModal(true)}
                            >
                                <i className="bx bx-plus-circle"></i> Thêm câu
                                hỏi
                            </button>
                            <button className="btn btn-outline-secondary">
                                <i className="bx bx-bulb"></i> Thêm tương tự
                                (AI)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Cập nhật modal để sử dụng hàm handleQuestionTypeSelection mới */}
            <AddQuestionByTypeModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onAddQuestion={handleQuestionTypeSelection}
            />
        </div>
    );
};

export default QuizEditorPage;
