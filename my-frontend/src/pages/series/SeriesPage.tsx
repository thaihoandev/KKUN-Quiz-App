import { useEffect, useState } from "react";
import {
  Button,
  Spin,
  Modal,
  Select,
  Dropdown,
  notification,
  Empty,
  Divider,
} from "antd";
import {
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  EllipsisOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getSeriesByAuthor,
  addArticleToSeries,
  deleteSeries,
  getUnassignedArticlesByAuthorPaged,
} from "@/services/seriesService";
import { ArticleDto } from "@/types/article";
import LoadMorePagination from "@/components/paginations/LoadMorePagination";
import ArticleCardHandleSmall from "@/components/layouts/article/ArticleCardHandleSmall";
import SelectSeriesModal from "@/components/modals/SelectSeriesModal";

interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesDto[]>([]);
  const [seriesTotal, setSeriesTotal] = useState(0);
  const [seriesPage, setSeriesPage] = useState(1);
  const [seriesSize, setSeriesSize] = useState(12);

  const [unassignedArticles, setUnassignedArticles] = useState<ArticleDto[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [unassignedSize, setUnassignedSize] = useState(12);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDto | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // ======================= Fetch Series =======================
  const fetchSeries = async (page = seriesPage, size = seriesSize, append = false) => {
    if (!user?.userId) return;
    const res = await getSeriesByAuthor(user.userId, page - 1, size, "createdAt,desc");
    setSeriesTotal(res.totalElements || 0);
    if (append) {
      setSeriesList((prev) => [...prev, ...(res.content || [])]);
    } else {
      setSeriesList(res.content || []);
    }
  };

  // ======================= Fetch Unassigned Articles =======================
  const fetchUnassigned = async (
    page = unassignedPage,
    size = unassignedSize,
    append = false
  ) => {
    if (!user?.userId) return;
    const res = await getUnassignedArticlesByAuthorPaged(
      user.userId,
      page - 1,
      size,
      "createdAt,desc"
    );
    setUnassignedTotal(res.totalElements || 0);
    if (append) {
      setUnassignedArticles((prev) => [...prev, ...(res.content || [])]);
    } else {
      setUnassignedArticles(res.content || []);
    }
  };

  // ======================= Init Load =======================
  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    Promise.all([fetchSeries(1, seriesSize), fetchUnassigned(1, unassignedSize)])
      .catch(() =>
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: "Không thể tải danh sách series hoặc bài viết.",
        })
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // ======================= Actions =======================
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa series?",
      content: "Series và liên kết bài viết của nó sẽ bị xóa.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        const ok = await deleteSeries(id);
        if (ok) {
          notification.success({
            message: "Đã xóa series",
            description: "Series đã được xóa thành công.",
          });
          fetchSeries(1, seriesSize);
          setSeriesPage(1);
        }
      },
    });
  };

  const handleAddToSeries = (article: ArticleDto) => {
    setSelectedArticle(article);
    setModalOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedArticle || !selectedSeriesId) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn series để thêm bài viết.",
      });
      return;
    }

    try {
      const updated = await addArticleToSeries(selectedSeriesId, selectedArticle.id, 1);
      if (updated) {
        notification.success({
          message: "Đã thêm vào series",
          description: `"${selectedArticle.title}" đã được thêm vào "${updated.title}".`,
        });
        fetchUnassigned(1, unassignedSize);
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Lỗi thêm bài viết",
        description: "Không thể thêm bài viết vào series.",
      });
    }
  };

  // ======================= Load More Handlers =======================
  const handleLoadMoreSeries = async () => {
    const nextPage = seriesPage + 1;
    setSeriesPage(nextPage);
    await fetchSeries(nextPage, seriesSize, true);
  };

  const handleLoadMoreArticles = async () => {
    const nextPage = unassignedPage + 1;
    setUnassignedPage(nextPage);
    await fetchUnassigned(nextPage, unassignedSize, true);
  };

  // ======================= Menus =======================
  const getSeriesMenu = (series: SeriesDto) => ({
    items: [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: <EyeOutlined />,
        onClick: () => navigate(`/series/${series.slug}`),
      },
      {
        key: "edit",
        label: "Chỉnh sửa",
        icon: <EditOutlined />,
        onClick: () => navigate(`/series/edit/${series.slug}`),
      },
      {
        key: "delete",
        label: "Xóa",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(series.id),
      },
    ],
  });

  const getArticleMenu = (article: ArticleDto) => ({
    items: [
      {
        key: "view",
        label: "Xem bài viết",
        icon: <EyeOutlined />,
        onClick: () => navigate(`/articles/${article.slug}`),
      },
      {
        key: "edit",
        label: "Chỉnh sửa bài viết",
        icon: <EditOutlined />,
        onClick: () => navigate(`/articles/edit/${article.slug}`),
      },
      {
        key: "add",
        label: "Thêm vào series",
        icon: <PlusOutlined />,
        onClick: () => handleAddToSeries(article),
      },
    ],
  });

  // ======================= Render =======================
  if (loading)
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="py-5" style={{ background: "var(--background-color)" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 45,
                  height: 45,
                  background: "var(--gradient-primary)",
                  color: "white",
                  fontSize: 24,
                }}
              >
                <BookOutlined />
              </div>
              Series của tôi
            </h2>
            <p className=" mb-0" style={{color:"var(--text-muted)"}}>{seriesTotal} series</p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/series/create")}
            style={{ borderRadius: 12, height: 45, fontSize: 16 }}
          >
            Tạo Series
          </Button>
        </div>

        {/* Danh sách series */}
        {seriesList.length === 0 ? (
          <Empty description="Chưa có series nào" />
        ) : (
          <>
            <div className="row g-4 mb-4">
              {seriesList.map((series) => (
                <div key={series.id} className="col-md-6 col-lg-4">
                  <div
                    className="card border-0 shadow-sm overflow-hidden rounded-4 h-100 position-relative"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/series/${series.slug}`)}
                  >
                    <div
                      className="position-absolute"
                      style={{ top: 10, right: 10, zIndex: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown menu={getSeriesMenu(series)} trigger={["click"]}>
                        <Button className="btn-icon btn-sm" type="text" icon={<EllipsisOutlined />} />
                      </Dropdown>
                    </div>

                    <div
                      style={{
                        height: 180,
                        background: series.thumbnailUrl
                          ? `url(${series.thumbnailUrl}) center / cover`
                          : "var(--surface-alt)",
                      }}
                      className="rounded-top"
                    >
                      {!series.thumbnailUrl && (
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <BookOutlined style={{ fontSize: 40, color: "var(--text-muted)" }} />
                        </div>
                      )}
                    </div>

                    <div className="card-body">
                      <h6 className="fw-bold mb-1">{series.title}</h6>
                      <p className="small mb-0 line-clamp-2">
                        {series.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Pagination */}
            <LoadMorePagination
              current={seriesPage}
              pageSize={seriesSize}
              total={seriesTotal}
              loading={loading}
              onLoadMore={handleLoadMoreSeries}
            />
          </>
        )}

        {/* Bài viết chưa thuộc series */}
        <Divider orientation="left" className="" >
          <h5 style={{color:"var(--text-light)"}}>
            <FileTextOutlined /> Bài viết chưa thuộc series nào
          </h5>
        </Divider>

        {unassignedArticles.length === 0 ? (
          <Empty description="Tất cả bài viết đều đã thuộc series" />
        ) : (
          <>
            <div className="row g-3 mb-4">
              {unassignedArticles.map((a) => (
                <div key={a.id} className="col-md-6 col-lg-4">
                  <ArticleCardHandleSmall
                    article={a}
                    onAddToSeries={handleAddToSeries}
                    onDelete={(id) => console.log("Delete article:", id)}
                  />
                </div>
              ))}
            </div>

            {/* Load More for Articles */}
            <LoadMorePagination
              current={unassignedPage}
              pageSize={unassignedSize}
              total={unassignedTotal}
              loading={loading}
              onLoadMore={handleLoadMoreArticles}
            />
          </>
        )}
      </div>

      <SelectSeriesModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        seriesList={seriesList}
        selectedSeriesId={selectedSeriesId}
        setSelectedSeriesId={setSelectedSeriesId}
        selectedArticle={selectedArticle}
      />

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
