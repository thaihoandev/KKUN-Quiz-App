// src/utils/dateUtils.ts

export const formatDateTime = (dateInput: string | number | Date | null | undefined): string => {
  if (!dateInput) return "N/A";
  const date = parseDate(dateInput);
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

// < 1 phút -> tính theo giây; < 1 giờ -> phút; < 24h -> giờ; còn lại -> ngày/tháng/năm
export const formatDateOnly = (dateInput: Date | string | number): string => {
  const inputDate = parseDate(dateInput as any);
  if (isNaN(inputDate.getTime())) return "Invalid date";

  const now = new Date();
  let diffMs = now.getTime() - inputDate.getTime();
  if (diffMs < 0) diffMs = 0; // nếu là ngày tương lai, coi như "just now"

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    if (diffSec < 5) return "just now";
    return `${diffSec} ${diffSec === 1 ? "second" : "seconds"} ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  return inputDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const parseDate = (v: string | number | Date | null | undefined): Date => {
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v; // giây -> ms
    return new Date(ms);
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(); // fallback để tránh 1970
};
