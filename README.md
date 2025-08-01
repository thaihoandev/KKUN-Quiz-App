
- **Frontend** communicates exclusively via WebSocket: authentication, PDF upload, quiz session, real-time question delivery, answer submission, leaderboard updates.  
- **Backend** orchestrates sessions, validates JWT auth over socket, manages quiz state, interacts with Redis, and delegates PDF processing to the AI service.  
- **AI Extraction Service** ingests PDFs (text or scanned), uses OCR if needed, and calls a large language model to parse and normalize multiple-choice questions into structured JSON.  
- **Redis** handles shared state, room coordination, leaderboards, and can be used for scaling with pub/sub or streams.

---

## 🧰 Tech Stack

- **Backend:** Java 21, Spring Boot 3.x, WebSocket (STOMP or raw), Spring Security (JWT over socket), Resilience4j, Micrometer, structured JSON logging (SLF4J/Logback)  
- **Frontend:** React + TypeScript, Vite, WebSocket client (or SockJS/STOMP), optional state helpers (Zustand / React Query fallback), ESLint, Prettier, Husky  
- **State & Cache:** Redis (session/room state, pub-sub, dedupe, caching question banks)  
- **Persistence:** PostgreSQL (recommended with Flyway migrations) or JSON-backed store for simplicity  
- **Containerization:** Docker & Docker Compose  
- **CI/CD:** GitHub Actions  
- **Observability:** Prometheus (via Micrometer), health endpoints, correlation ID tracing  
- **Security:** JWT, rate limiting, input sanitization, secure file handling

## 🧰 Incomming
- **AI Extraction Service:** Python 3.11+ (FastAPI or minimal HTTP), `pdfplumber` + Tesseract OCR, integration with LLMs (OpenAI or local), prompt engineering  
---

## ✨ Features

- Real-time quiz flow via WebSocket (no REST endpoints)  
- Chunked PDF upload with progress reporting  
- AI-powered extraction of multiple-choice questions from PDFs (including scanned documents)  
- JWT authentication embedded in WebSocket sessions  
- Real-time question broadcast, answer submission, scoring, and leaderboard updates  
- Shared room/session state and scaling support via Redis  
- Retry/fallback and circuit breakers for AI calls  
- CI/CD pipeline with build/test/publish  
- Role-based access (user/admin), multi-player rooms  
- Structured logs, metrics, health checks

---

## 🛰 WebSocket Protocol (Core)
