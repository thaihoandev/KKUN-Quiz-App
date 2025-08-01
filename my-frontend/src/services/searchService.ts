import {handleApiError} from "@/utils/apiErrorHandler";
import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_API_URL + "/search";

// API tìm kiếm quiz theo title
export const searchQuizzes = async (query: string) => {
    try {
        const response = await axios.get(
            `${API_URL}?q=${encodeURIComponent(query)}`,
        );
        return response.data; // Trả về danh sách quiz
    } catch (error) {
        handleApiError(error, "Search failed");
    }
};
