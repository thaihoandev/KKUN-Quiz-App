import React, {useEffect, useState} from "react";
import {useNavigate, useParams, useLocation} from "react-router-dom";
import {createQuestion} from "@/services/questionService";
import {DEFAULT_QUESTION_TYPE, QUESTION_TYPES} from "@/constants/quizConstants";
import QuestionForm from "@/components/forms/QuestionForm";

type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

const QuestionCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {quizId} = useParams<{quizId: string}>();

    const [questionType, setQuestionType] = useState<QuestionType | null>(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const typeParam = searchParams.get("type");

        if (
            typeParam &&
            Object.values(QUESTION_TYPES).includes(typeParam as QuestionType)
        ) {
            setQuestionType(typeParam as QuestionType);
        } else {
            setQuestionType(DEFAULT_QUESTION_TYPE);
        }
    }, [location.search]);

    const handleCreateQuestion = async (formData: FormData) => {
        try {
            if (!quizId) throw new Error("Quiz ID not found");
            await createQuestion(quizId, formData);
            navigate(`/quizzes/${quizId}/edit`, {
                state: {createdQuestion: true},
            });
        } catch (error) {
            alert("Có lỗi xảy ra khi tạo câu hỏi mới!");
            console.error(error);
        }
    };

    const handleCancel = () => {
        navigate(`/quizzes/${quizId}/edit`);
    };

    if (!quizId) return <div>Không tìm thấy ID của quiz</div>;
    if (!questionType) return <div>Đang tải...</div>;

    return (
        <QuestionForm
            quizId={quizId}
            onSave={handleCreateQuestion}
            onCancel={handleCancel}
            isCreateMode={true}
            initialQuestionType={questionType}
        />
    );
};

export default QuestionCreatePage;
