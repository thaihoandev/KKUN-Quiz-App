import { useNavigate } from "react-router-dom";
import { ArticleDto } from "@/types/article";
import {
    FolderOutlined,
    EyeOutlined,
    EllipsisOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    EyeOutlined as ViewOutlined,
    CalendarOutlined,
    MoreOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Dropdown, MenuProps, Popconfirm, message } from "antd";

interface Props {
  article: ArticleDto;
}

export default function SeriesArticleCard({ article }: Props) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      // ✅ Gọi API xóa bài viết (tùy service của bạn)
      // await deleteArticle(article.id);
      message.success(`Đã xóa "${article.title}"`);
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa bài viết");
    }
  };

  // 🎯 Menu dấu 3 chấm
    const menuItems = [
        {
        key: "view",
        label: "Xem bài viết",
        icon: <ViewOutlined />,
        onClick: () => navigate(`/articles/${article.slug}`),
        },
        {
        key: "edit",
        label: "Chỉnh sửa",
        icon: <EditOutlined />,
        onClick: () => navigate(`/articles/edit/${article.slug}`),
        },
    ];

  return (
    <div
      className="card card-body border-0 shadow-sm transition-all mb-1"
      style={{ cursor: "pointer", transition: "all 0.3s ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 8px 24px rgba(96, 165, 250, 0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="d-flex align-items-start gap-3">
        {/* Số thứ tự */}
        <div
          className="badge bg-primary-soft fw-bold d-flex align-items-center justify-content-center"
          style={{ minWidth: 40, height: 40, fontSize: 14 }}
        >
          {article.orderIndex ?? "?"}
        </div>

        {/* Nội dung bài viết */}
        <div className="flex-grow-1">
          <h6 className="mb-2 fw-bold">{article.title}</h6>
          <p className="text-muted small mb-2">
            {article.description || "Không có mô tả"}
          </p>
          <div className="d-flex align-items-center gap-2">
            <UserOutlined className="text-muted" />
            <small className="text-muted">
              {article.authorName || "Anonymous"}
            </small>
          </div>
        </div>

        {/* Bên phải */}
        <div className="d-flex flex-column align-items-end gap-2">
          

          {/* Menu 3 chấm */}
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                <button className="btn btn-sm btn-outline-secondary border-0 py-1 px-2 rounded-3">
                <MoreOutlined style={{ fontSize: 16 }} />
                </button>
            </Dropdown>
                  
                  {/* Nút “Đọc →” */}
            <button
                className="btn btn-sm btn-secondary rounded-3 py-1 px-2"
                onClick={() => navigate(`/articles/${article.slug}`)}
            >
                Đọc →
            </button>
        </div>
      </div>
    </div>
  );
}
