import ArticleForm from "@/components/layouts/article/ArticleForm";
import React from "react";
import { FileTextOutlined } from "@ant-design/icons";

export default function CreateArticlePage() {
  return (
    <div style={{minHeight: '100vh' }}>
      {/* Form Content */}
      <ArticleForm />
    </div>
  );
}