import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Tag, Space, Typography, Checkbox } from "antd";
import type { Question } from "@/interfaces";
import QuestionCard from "../cards/QuestionCard";

const { Text } = Typography;

type Props = {
  show: boolean;
  loading?: boolean;
  questions: Question[];
  onClose: () => void;
  onAccept: (selected: Question[]) => void;
};

const getQKey = (q: Question, idx: number) =>
  (q as any).clientKey || q.questionId || `idx-${idx}`;

const AiSuggestionModal: React.FC<Props> = ({
  show,
  loading,
  questions,
  onClose,
  onAccept,
}) => {
  const total = questions?.length ?? 0;

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [show, total]);

  const allKeys = useMemo(
    () => (questions ?? []).map((q, i) => getQKey(q, i)),
    [questions]
  );

  const toggle = (k: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(k) : next.delete(k);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allKeys));
  const clearAll = () => setSelected(new Set());

  const acceptSelected = () => {
    if (!questions || selected.size === 0) return onAccept([]);
    const out: Question[] = [];
    questions.forEach((q, i) => {
      if (selected.has(getQKey(q, i))) out.push(q);
    });
    onAccept(out);
  };

  return (
    <Modal
      open={show}
      destroyOnClose
      title={
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span>Gợi ý câu hỏi (AI)</span>
          <Space size={8}>
            <Tag color="blue">Tổng: {total}</Tag>
            <Tag color={selected.size > 0 ? "green" : "default"}>
              Đã chọn: {selected.size}
            </Tag>
          </Space>
        </div>
      }
      width={960}
      onCancel={loading ? undefined : onClose}
      maskClosable={!loading}
      keyboard={!loading}
      footer={
        <Space wrap>
          <Button onClick={selectAll} disabled={loading || total === 0}>Chọn tất cả</Button>
          <Button onClick={clearAll} disabled={loading || selected.size === 0}>Bỏ chọn tất cả</Button>
          <Button type="primary" onClick={acceptSelected} disabled={loading || selected.size === 0}>
            Thêm các câu đã chọn ({selected.size})
          </Button>
        </Space>
      }
    >
      {total === 0 ? (
        <div style={{ padding: 24 }}>
          <Text type="secondary">Không có gợi ý nào để hiển thị.</Text>
        </div>
      ) : (
        <div style={{ maxHeight: 600, overflowY: "auto", paddingRight: 4 }}>
          {questions.map((q, i) => {
            const k = getQKey(q, i);
            const checked = selected.has(k);
            return (
              <div key={k} className="mb-3 border rounded" style={{ overflow: "hidden" }}>
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <Checkbox
                      checked={checked}
                      disabled={!!loading}
                      onChange={(e) => toggle(k, e.target.checked)}
                    />
                    <span className="text-muted small">Chọn câu này</span>
                  </div>
                  <Tag color={checked ? "green" : "default"}>
                    {checked ? "Đã chọn" : "Chưa chọn"}
                  </Tag>
                </div>
                <div className="p-2">
                  <QuestionCard question={q} index={i} showAnswers />
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
