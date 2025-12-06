import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

// Lấy quizId từ cả hai kiểu URL: /quiz/:quizId hoặc /quiz/:slug (với slug = "123-ten-bai-quiz")
export const useQuizIdFromParams = () => {
    const { quizId, slug } = useParams<{ quizId?: string; slug?: string }>();

    return useMemo(() => {
        // Ưu tiên quizId trực tiếp
        if (quizId) return quizId;

        // Nếu không có quizId mà có slug → tách phần đầu là ID
        // Giả sử slug luôn có format: {id}-{anything}
        if (slug) {
            const parts = slug.split("-");
            const firstPart = parts[0];
            // Kiểm tra xem phần đầu có phải là số không (quizId là number string)
            if (/^\d+$/.test(firstPart)) {
                return firstPart;
            }
        }

        return null;
    }, [quizId, slug]);
};
