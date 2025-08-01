// src/utils/dateUtils.ts

// Hàm lấy đầy đủ ngày, giờ, phút, giây
export const formatDateTime = (
    dateString: string | null | undefined,
): string => {
    if (!dateString) return "N/A"; // Xử lý trường hợp null hoặc undefined

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
};

// Hàm chỉ lấy ngày, tháng, năm
export const formatDateOnly = (
    dateString: string | null | undefined,
): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};
