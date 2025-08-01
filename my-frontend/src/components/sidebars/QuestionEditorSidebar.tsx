import React from "react";

const QuestionEditorSidebar: React.FC = () => (
    <div className="col-4">
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h6 className="fw-bold mb-3">
                    <i className="bx bx-bolt-circle text-primary me-2"></i>
                    Hành động
                </h6>
                <div className="list-group list-group-flush">
                    {[
                        {icon: "bx-plus-circle", text: "Thêm câu hỏi tương tự"},
                        {
                            icon: "bx-comment-detail",
                            text: "Thêm lời giải thích",
                        },
                        {icon: "bx-globe", text: "Dịch bài kiểm tra"},
                        {
                            icon: "bx-dots-horizontal-rounded",
                            text: "Lựa chọn khác",
                        },
                    ].map((item, idx) => (
                        <a
                            key={idx}
                            href="#"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2"
                        >
                            <span>
                                <i
                                    className={`bx ${item.icon} text-primary me-2`}
                                ></i>
                                {item.text}
                            </span>
                            <i className="bx bx-chevron-right"></i>
                        </a>
                    ))}
                </div>
                <div className="mt-3 text-muted small d-flex align-items-center">
                    <i className="bx bx-time-five me-2"></i>
                    AI limit 0/10 per month
                    <i className="bx bx-info-circle ms-2"></i>
                </div>
            </div>
        </div>
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h6 className="fw-bold mb-3">Bulk update questions</h6>
                {[
                    {icon: "bx-time-five", text: "Thời gian"},
                    {icon: "bx-trophy", text: "Điểm"},
                ].map((item, idx) => (
                    <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <span>
                                <i className={`bx ${item.icon} me-2`}></i>
                                {item.text}
                            </span>
                            <i className="bx bx-chevron-down"></i>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="card shadow-sm">
            <div className="card-body">
                <h6 className="fw-bold mb-3">Nhập từ</h6>
                <div className="list-group list-group-flush">
                    {[
                        {icon: "bx-file", text: "Biểu mẫu Google"},
                        {icon: "bx-spreadsheet", text: "Bảng tính"},
                    ].map((item, idx) => (
                        <a
                            key={idx}
                            href="#"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2"
                        >
                            <span>
                                <i
                                    className={`bx ${item.icon} text-primary me-2`}
                                ></i>
                                {item.text}
                            </span>
                            <i className="bx bx-chevron-right"></i>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default QuestionEditorSidebar;
