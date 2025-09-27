import React from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";
import { TopicGenerateRequest } from "@/services/quizService";

type Props = {
  open: boolean;
  loading?: boolean;
  initial?: Partial<TopicGenerateRequest>;
  onCancel: () => void;
  onSubmit: (payload: TopicGenerateRequest) => void;
};

const TopicGenerateModal: React.FC<Props> = ({ open, loading, initial, onCancel, onSubmit }) => {
  const [form] = Form.useForm<TopicGenerateRequest>();

  return (
    <Modal
      open={open}
      title="Sinh câu hỏi theo chủ đề (AI)"
      onCancel={loading ? undefined : onCancel}  // đang loading thì không cho đóng
      maskClosable={!loading}
      keyboard={!loading}
      okText={loading ? "Đang sinh..." : "Sinh câu hỏi"}
      okButtonProps={{ loading, disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      onOk={() => {
        if (loading) return;
        form
          .validateFields()
          .then(values => onSubmit(values as TopicGenerateRequest))
          .catch(() => {});
      }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          topic: initial?.topic ?? "",
          count: initial?.count ?? 5,               // server clamp tối đa 10
          questionType: initial?.questionType ?? "AUTO",
          timeLimit: initial?.timeLimit ?? 10,      // mặc định 60s
          points: initial?.points ?? 1000,
          language: initial?.language ?? "vi",
        }}
      >
        <Form.Item
          label="Chủ đề"
          name="topic"
          rules={[
            { required: true, message: "Nhập chủ đề!" },
            { max: 300, message: "Tối đa 300 ký tự" },
          ]}
        >
          <Input.TextArea rows={3} placeholder='VD: "Java OOP", "HTTP cơ bản", "Địa lý Việt Nam"...' />
        </Form.Item>

        <Form.Item
          label="Số câu"
          name="count"
          rules={[{ type: "number", min: 1, max: 10, message: "1–10 câu mỗi lần" }]}
        >
          <InputNumber min={1} max={10} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Loại câu hỏi" name="questionType">
          <Select
            options={[
              { value: "AUTO", label: "Tự chọn (AUTO)" },
              { value: "TRUE_FALSE", label: "True/False" },
              { value: "SINGLE_CHOICE", label: "Single Choice" },
              { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Thời gian mỗi câu (giây)"
          name="timeLimit"
          rules={[{ type: "number", min: 5, max: 300, message: "Trong khoảng 5–300 giây" }]}
        >
          <InputNumber min={5} max={300} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Điểm mỗi câu"
          name="points"
          rules={[{ type: "number", min: 1, max: 100000 }]}
        >
          <InputNumber min={1} max={100000} step={100} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Ngôn ngữ" name="language">
          <Select
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TopicGenerateModal;
