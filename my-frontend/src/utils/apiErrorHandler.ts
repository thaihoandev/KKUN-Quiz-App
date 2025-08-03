import axios from "axios";

/**
 * Centralized API error handling utility
 * @param error - The error object from the API call
 * @param defaultMessage - A fallback error message
 * @throws {Error} with a specific or generic error message
 */

export const handleApiError = (
    error: any,
    defaultMessage = "An unexpected error occurred", // Removed `: string`
) => {
    if (axios.isAxiosError(error) && error.response) {
        // Extract error message from different possible response structures
        const errorMessage =
            error.response.data?.details ||
            error.response.data?.message ||
            error.response.data?.error ||
            (typeof error.response.data === "string"
                ? error.response.data
                : null) ||
            defaultMessage;
        
        throw new Error(errorMessage);
    }

    // For non-Axios errors or network issues
    throw new Error(error instanceof Error ? error.message : defaultMessage);
};
