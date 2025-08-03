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
export function formatDateOnly(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const parseDate = (date: string | null | undefined): Date => {
  if (!date) {
    return new Date(); // Fallback to current date
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed; // Fallback if invalid
};
