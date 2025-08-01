import React from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Question} from "@/interfaces";
import {updateQuestion} from "@/services/questionService";
import QuestionForm from "@/components/forms/QuestionForm";

const QuestionEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {quizId} = useParams<{quizId: string}>();
    const question = location.state?.question as Question;

    const handleSaveQuestion = async (formData: FormData) => {
        try {
            if (!quizId || !question?.questionId)
                throw new Error("Thiếu thông tin quizId hoặc questionId");

            await updateQuestion(quizId, question.questionId, formData);
            navigate(`/quizzes/${quizId}/edit`, {
                state: {updatedQuestion: true},
            });
        } catch (error) {
            console.error("Error saving question:", error);
            alert("Có lỗi xảy ra khi lưu câu hỏi!");
        }
    };

    const handleCancel = () => {
        navigate(`/quizzes/${quizId}/edit`);
    };

    if (!quizId) return <div>Không tìm thấy ID của quiz</div>;
    if (!question) return <div>Không tìm thấy câu hỏi</div>;

    return (
        <QuestionForm
            initialQuestion={question}
            quizId={quizId}
            onSave={handleSaveQuestion}
            onCancel={handleCancel}
            isCreateMode={false}
        />
    );
};

export default QuestionEditorPage;
