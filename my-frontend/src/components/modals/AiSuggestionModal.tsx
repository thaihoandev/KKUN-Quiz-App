import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Modal, Button, Tag, Space, Typography, Checkbox, Input, Empty, Alert } from "antd";
import type { Question } from "@/interfaces";
import QuestionCard from "../cards/QuestionCard";
import ErrorBoundary from "../error/ErrorBoundary";

const { Text } = Typography;
const { Search } = Input;

type Props = {
  show: boolean;
  loading?: boolean;
  questions: Question[];
  onClose: () => void;
  onAccept: (selected: Question[]) => void;
};

// ✅ FIX 1: Đảm bảo getQKey luôn trả về string hợp lệ
const getQKey = (q: Question, idx: number): string => {
  if (!q) return `fallback-${idx}-${Date.now()}`;
  const key = (q as any).clientKey || (q as any).questionId || `idx-${idx}`;
  return String(key); // Đảm bảo luôn là string
};

const AiSuggestionModal: React.FC<Props> = ({
  show,
  loading,
  questions,
  onClose,
  onAccept,
}) => {
  // ✅ FIX 2: Validate questions array trước khi dùng
  const validQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.filter(q => q && typeof q === 'object');
  }, [questions]);

  const total = validQuestions.length;

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedKeyRef = useRef<string | null>(null);

  // UI state
  const [query, setQuery] = useState("");
  const [onlySelectedView, setOnlySelectedView] = useState(false);

  // ✅ FIX: Reset state khi modal đóng HOÀN TOÀN
  useEffect(() => {
    if (!show) {
      // ✅ Khi modal đóng, reset mọi state
      const timer = setTimeout(() => {
        setSelected(new Set());
        setQuery("");
        setOnlySelectedView(false);
        lastClickedKeyRef.current = null;
      }, 300); // Delay để tránh flash UI
      
      return () => clearTimeout(timer);
    } else {
      // ✅ Khi modal mở, reset ngay
      setSelected(new Set());
      setQuery("");
      setOnlySelectedView(false);
      lastClickedKeyRef.current = null;
    }
  }, [show]);

  // ✅ Cleanup khi component unmount
  useEffect(() => {
    return () => {
      setSelected(new Set());
      setQuery("");
      setOnlySelectedView(false);
      lastClickedKeyRef.current = null;
    };
  }, []);

  const allKeys = useMemo(
    () => validQuestions.map((q, i) => getQKey(q, i)),
    [validQuestions]
  );

  const filteredIndexes = useMemo(() => {
    if (total === 0) return [];
    const q = query.trim().toLowerCase();
    const indices: number[] = [];
    
    validQuestions.forEach((item, i) => {
      if (!q) {
        indices.push(i);
        return;
      }
      
      // ✅ FIX 4: Safe access với optional chaining
      const questionText = item?.questionText || "";
      const optionsText = (item?.options || [])
        .map((o: any) => o?.optionText || "")
        .join(" ");
      
      const haystack = `${questionText} ${optionsText}`.toLowerCase();
      if (haystack.includes(q)) indices.push(i);
    });
    
    return indices;
  }, [validQuestions, query, total]);

  const visibleIndexes = useMemo(() => {
    if (total === 0) return [];
    if (!onlySelectedView) return filteredIndexes;

    return filteredIndexes.filter((i) => {
      const key = getQKey(validQuestions[i], i);
      return selected.has(key);
    });
  }, [validQuestions, filteredIndexes, onlySelectedView, selected, total]);

  const allVisibleKeys = useMemo(() => {
    return visibleIndexes.map((i) => getQKey(validQuestions[i], i));
  }, [validQuestions, visibleIndexes]);

  const setSelectedKeys = useCallback((keys: string[]) => {
    setSelected(new Set(keys));
  }, []);

  const toggle = useCallback((key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(key) : next.delete(key);
      return next;
    });
  }, []);

  const toggleWithRange = useCallback(
    (key: string, idx: number, checked: boolean, withRange: boolean) => {
      if (!withRange || lastClickedKeyRef.current == null) {
        lastClickedKeyRef.current = key;
        toggle(key, checked);
        return;
      }

      const lastKey = lastClickedKeyRef.current;
      const lastIdx = visibleIndexes.findIndex((i) => 
        getQKey(validQuestions[i], i) === lastKey
      );
      const curIdx = visibleIndexes.findIndex((i) => 
        getQKey(validQuestions[i], i) === key
      );

      if (lastIdx === -1 || curIdx === -1) {
        lastClickedKeyRef.current = key;
        toggle(key, checked);
        return;
      }

      const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
      const rangeKeys = visibleIndexes
        .slice(start, end + 1)
        .map((i) => getQKey(validQuestions[i], i));

      setSelected((prev) => {
        const next = new Set(prev);
        rangeKeys.forEach((rk) => (checked ? next.add(rk) : next.delete(rk)));
        return next;
      });
      lastClickedKeyRef.current = key;
    },
    [validQuestions, visibleIndexes, toggle]
  );

  const selectAllVisible = useCallback(() => 
    setSelectedKeys(allVisibleKeys), 
    [allVisibleKeys, setSelectedKeys]
  );
  
  const clearAll = useCallback(() => 
    setSelected(new Set()), 
    []
  );
  
  const invertVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      allVisibleKeys.forEach((k) => {
        if (next.has(k)) next.delete(k);
        else next.add(k);
      });
      return next;
    });
  }, [allVisibleKeys]);

  const acceptSelected = useCallback(() => {
    if (selected.size === 0) {
      onAccept([]);
      return;
    }
    
    const out: Question[] = [];
    validQuestions.forEach((q, i) => {
      if (selected.has(getQKey(q, i))) out.push(q);
    });
    onAccept(out);
  }, [onAccept, validQuestions, selected]);

  const selectedCount = selected.size;
  const visibleSelectedCount = useMemo(
    () => allVisibleKeys.filter((k) => selected.has(k)).length,
    [allVisibleKeys, selected]
  );

  const allVisibleChecked = visibleSelectedCount > 0 && 
    visibleSelectedCount === allVisibleKeys.length;
  const partiallyChecked = visibleSelectedCount > 0 && !allVisibleChecked;

  return (
    <Modal
      key={show ? 'ai-modal-open' : 'ai-modal-closed'} // ✅ Force re-mount
      open={show}
      destroyOnClose
      title={
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span>Gợi ý câu hỏi (AI)</span>
          <Space size={8} wrap>
            <Tag color="blue">Tổng: {total}</Tag>
            <Tag color={filteredIndexes.length ? "geekblue" : "default"}>
              Khớp bộ lọc: {filteredIndexes.length}
            </Tag>
            <Tag color={selectedCount > 0 ? "green" : "default"}>
              Đã chọn: {selectedCount}
            </Tag>
          </Space>
        </div>
      }
      width={980}
      onCancel={loading ? undefined : onClose}
      maskClosable={!loading}
      keyboard={!loading}
      footer={
        <Space wrap>
          <Button 
            onClick={selectAllVisible} 
            disabled={loading || allVisibleKeys.length === 0}
          >
            Chọn tất cả (đang hiển thị)
          </Button>
          <Button 
            onClick={invertVisible} 
            disabled={loading || allVisibleKeys.length === 0}
          >
            Đảo chọn (đang hiển thị)
          </Button>
          <Button 
            onClick={clearAll} 
            disabled={loading || selectedCount === 0}
          >
            Bỏ chọn tất cả
          </Button>
          <Button
            type="primary"
            onClick={acceptSelected}
            disabled={loading || selectedCount === 0}
          >
            Thêm các câu đã chọn ({selectedCount})
          </Button>
        </Space>
      }
    >
      {/* Toolbar */}
      <div
        className="d-flex align-items-center gap-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          background: "#fff",
          padding: "8px 0 12px",
        }}
      >
        <Checkbox
          indeterminate={partiallyChecked}
          checked={allVisibleChecked}
          onChange={(e) => 
            e.target.checked ? selectAllVisible() : invertVisible()
          }
          disabled={loading || allVisibleKeys.length === 0}
        >
          Chọn tất cả (đang hiển thị)
        </Checkbox>

        <Search
          placeholder="Lọc theo nội dung/đáp án..."
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={(v) => setQuery(v)}
          style={{ maxWidth: 320 }}
          disabled={loading || total === 0}
        />

        <Checkbox
          checked={onlySelectedView}
          onChange={(e) => setOnlySelectedView(e.target.checked)}
          disabled={loading || selectedCount === 0}
        >
          Chỉ hiển thị đã chọn
        </Checkbox>
      </div>

      {/* List */}
      {total === 0 ? (
        <div style={{ padding: 24 }}>
          <Text type="secondary">Không có gợi ý nào để hiển thị.</Text>
        </div>
      ) : visibleIndexes.length === 0 ? (
        <div style={{ padding: 24 }}>
          <Empty description="Không có câu hỏi nào khớp bộ lọc" />
        </div>
      ) : (
        <div style={{ maxHeight: 600, overflowY: "auto", paddingRight: 4 }}>
          {visibleIndexes.map((i) => {
            const q = validQuestions[i];
            const k = getQKey(q, i);
            const checked = selected.has(k);
            
            // ✅ FIX 5: Thêm error boundary cho mỗi card
            return (
              <div 
                key={k} 
                className="mb-3 border rounded" 
                style={{ overflow: "hidden" }}
              >
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <Checkbox
                      checked={checked}
                      disabled={!!loading}
                      onChange={(e) => 
                        toggleWithRange(
                          k, 
                          i, 
                          e.target.checked, 
                          e.nativeEvent.shiftKey
                        )
                      }
                    />
                    <span className="text-muted small">Chọn câu này</span>
                  </div>
                  <Tag color={checked ? "green" : "default"}>
                    {checked ? "Đã chọn" : "Chưa chọn"}
                  </Tag>
                </div>
                <div className="p-2">
                  {/* ✅ Wrap QuestionCard với ErrorBoundary để bắt lỗi render */}
                  <ErrorBoundary
                    fallback={
                      <Alert
                        message="Lỗi render câu hỏi"
                        description={`Không thể hiển thị câu hỏi #${i + 1}. Dữ liệu có thể bị lỗi.`}
                        type="warning"
                        showIcon
                      />
                    }
                    onError={(err) => {
                      console.error(`Error rendering question #${i}:`, err);
                      console.log("Question data:", q);
                    }}
                  >
                    <QuestionCard 
                      question={q} 
                      index={i} 
                      showAnswers 
                    />
                  </ErrorBoundary>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default AiSuggestionModal;