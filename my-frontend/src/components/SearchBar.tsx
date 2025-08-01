import React, {useState, useEffect, useRef} from "react";
import {searchQuizzes} from "../services/searchService"; // Import service gọi API
import {useNavigate} from "react-router-dom"; // Import useNavigate để điều hướng

interface SearchResult {
    quizId: string;
    title: string;
    description: string;
    status: string;
    hostId: string | null;
}

// Hàm cắt ngắn mô tả nếu quá dài
const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
};

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate(); // Hook để điều hướng trang

    // Debounce để hạn chế gọi API khi người dùng gõ nhanh
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                fetchSearchResults(searchQuery);
            } else {
                setSuggestions([]);
                setIsDropdownOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Gọi API để lấy danh sách gợi ý tìm kiếm
    const fetchSearchResults = async (query: string) => {
        try {
            const data = await searchQuizzes(query);
            setSuggestions(data);
            setIsDropdownOpen(true);
            setActiveIndex(-1);
        } catch (error) {
            console.error("Error fetching search results:", error);
            setSuggestions([]);
            setIsDropdownOpen(true);
            setActiveIndex(-1);
        }
    };

    // Xử lý khi nhập vào ô tìm kiếm
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    // Xử lý khi chọn một gợi ý
    const handleSelectSuggestion = (index: number) => {
        if (index >= 0 && index < suggestions.length) {
            const selectedQuiz = suggestions[index];
            setSearchQuery(selectedQuiz.title); // Hiển thị title trong ô input
            setSuggestions([]);
            setIsDropdownOpen(false);
            setActiveIndex(-1);

            // Chuyển hướng đến trang quiz chi tiết
            navigate(`/quizzes/${selectedQuiz.quizId}`);
        }
    };

    // Xử lý phím tắt và điều hướng bàn phím
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "q") {
                event.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
                return;
            }

            if (!isDropdownOpen) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev,
                );
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((prev) => (prev > -1 ? prev - 1 : -1));
            } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                handleSelectSuggestion(activeIndex);
            } else if (event.key === "Escape") {
                setIsDropdownOpen(false);
                setActiveIndex(-1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, suggestions, isDropdownOpen]);

    // Ẩn dropdown khi nhấp ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="dropdown position-relative w-100" ref={dropdownRef}>
            <div className="input-group">
                <span className="input-group-text text-light">
                    <i className="bx bx-search"></i>
                </span>
                <input
                    type="text"
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search quizzes [Ctrl + Q]"
                    className="form-control text-light"
                    onFocus={() => setIsDropdownOpen(true)}
                />
            </div>

            {isDropdownOpen && (
                <ul className="dropdown-menu show w-100 position-absolute shadow-lg">
                    {suggestions.length > 0 ? (
                        suggestions.map((result, index) => (
                            <li key={result.quizId} className="px-2">
                                <button
                                    className={`dropdown-item d-flex align-items-start p-2 ${index === activeIndex ? "active" : ""}`}
                                    onMouseDown={() =>
                                        handleSelectSuggestion(index)
                                    }
                                >
                                    <div className="me-2">
                                        <i className="bx bx-book-open text-primary fs-5"></i>
                                    </div>
                                    <div className="text-start">
                                        <strong className="text-dark d-block">
                                            {result.title}
                                        </strong>
                                        <small className="text-muted d-block">
                                            {truncateText(
                                                result.description,
                                                50,
                                            )}
                                        </small>
                                    </div>
                                </button>
                            </li>
                        ))
                    ) : (
                        <li className="dropdown-item text-center text-muted">
                            Không có kết quả
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
