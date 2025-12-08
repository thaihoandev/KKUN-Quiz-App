"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getGameDetails,
  getSavedParticipantId,
  clearParticipantSession,
} from "@/services/gameService";
import type {
  GameDetailDTO,
  QuestionResponseDTO,
  AnswerResultDTO,
  LeaderboardEntryDTO,
  GameEventPayload,
} from "@/types/game";

import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import avatar1 from "@/assets/img/avatars/1.png";
import avatar2 from "@/assets/img/avatars/2.png";
import avatar3 from "@/assets/img/avatars/3.png";
import avatar4 from "@/assets/img/avatars/4.png";
import avatar5 from "@/assets/img/avatars/5.png";
import avatar6 from "@/assets/img/avatars/6.png";
import avatar7 from "@/assets/img/avatars/7.png";
import avatar8 from "@/assets/img/avatars/8.png";
import avatar9 from "@/assets/img/avatars/9.png";
import avatar10 from "@/assets/img/avatars/10.png";
import avatar11 from "@/assets/img/avatars/11.png";
import avatar12 from "@/assets/img/avatars/12.png";
import avatar13 from "@/assets/img/avatars/13.png";
import avatar14 from "@/assets/img/avatars/14.png";
import avatar15 from "@/assets/img/avatars/15.png";
import { webSocketService } from "@/services/webSocketService";
import { OptionButton } from "@/components/layouts/question/OptionButton";

const AVATAR_POOL = [
  avatar1, avatar2, avatar3, avatar4, avatar5,
  avatar6, avatar7, avatar8, avatar9, avatar10,
  avatar11, avatar12, avatar13, avatar14, avatar15,
];

const GamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const participantId = useMemo(() => getSavedParticipantId(), []);
  const [game, setGame] = useState<GameDetailDTO | null>(null);
  const [question, setQuestion] = useState<QuestionResponseDTO | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [fillAnswer, setFillAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<QuestionResponseDTO | null>(null);
  const [pendingLeaderboard, setPendingLeaderboard] = useState<LeaderboardEntryDTO[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHost = game?.isHost === true;

  // Avatar giống hệt Waiting Room
  const participantsWithAvatar = useMemo(() => {
    const used = new Set<string>();
    return leaderboard.map((p) => {
      let avatar = unknownAvatar;
      if (p.isAnonymous) {
        const available = AVATAR_POOL.filter(a => !used.has(a));
        avatar = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : unknownAvatar;
        used.add(avatar);
      }
      return { ...p, avatar };
    });
  }, [leaderboard]);

  // === Load game ban đầu + bảo vệ truy cập ===
  useEffect(() => {
    if (!gameId) {
      navigate("/", { replace: true });
      return;
    }

    if (!participantId) {
      toast.error("Bạn chưa tham gia phòng chơi");
      navigate(`/join-game`, { replace: true });
      return;
    }

    const load = async () => {
      try {
        const data = await getGameDetails(gameId);
        setGame(data);

        if (data.gameStatus !== "IN_PROGRESS") {
          navigate(`/game-session/${gameId}`, { replace: true });
          return;
        }

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Không thể tải trò chơi");
        setIsLoading(false);
      }
    };

    load();
  }, [gameId, participantId, navigate]);

  // === WebSocket: Khớp 100% với backend hiện tại của bạn ===
  useEffect(() => {
    if (!gameId || isLoading || !participantId) return;

    // 1. Join room chính để nhận các event cơ bản
    webSocketService.joinGameRoom(gameId);

    // 2. Subscribe riêng các topic theo backend
    webSocketService.subscribeToGameStarted(gameId);     // GAME_STARTED
    webSocketService.subscribeToQuestions(gameId);       // QUESTION_STARTED
    webSocketService.subscribeToLeaderboard(gameId);     // QUESTION_ENDED + leaderboard
    if (participantId && !isHost) {
      webSocketService.subscribeToKickNotifications(gameId, participantId);
    }
    // 3. Lắng nghe tất cả event (vì backend gửi nhiều nơi)
    const handleGameEvent = (event: GameEventPayload) => {
      console.log("GamePlay received event:", event.eventType);

      switch (event.eventType) {
        case "GAME_STARTED":
          // Đã được xử lý ở Waiting Room → không cần làm gì thêm
          break;

        case "QUESTION_STARTED":
          if (event.data?.question) {
            if (showAnswer) {
              setPendingQuestion(event.data.question);
            } else {
              setQuestion(event.data.question);
              setTimeLeft(event.data.question.timeLimitSeconds || 15);
              setSelectedOptions([]);
              setFillAnswer("");
              setHasAnswered(false);
              setShowAnswer(false);
            }
          }
          break;

        case "QUESTION_ENDED":
          setShowAnswer(true);
          if (event.data?.leaderboard) {
            if (showAnswer) {
              setPendingLeaderboard(event.data.leaderboard);
            } else {
              setLeaderboard(event.data.leaderboard);
            }
          }
          break;

        case "GAME_ENDED":
        case "GAME_CANCELLED":
          clearParticipantSession();
          toast.success("Trò chơi đã kết thúc!");
          navigate("/", { replace: true });
          break;
      }
    };

    webSocketService.onGameEvent(handleGameEvent);

    // 4. Kết quả trả lời riêng (private queue)
    const handleAnswerResult = (result: AnswerResultDTO) => {
      setHasAnswered(true);
      if (result.correct) {
        toast.success(`Đúng rồi! +${result.pointsEarned} điểm`);
      } else {
        toast.error("Sai rồi!");
      }
    };

    webSocketService.onAnswerResult(handleAnswerResult);

    // 5. Bị kick
    const handleKicked = () => {
      toast.error("Bạn đã bị loại khỏi phòng!");
      clearParticipantSession();
      navigate("/", { replace: true });
    };

    webSocketService.onKicked(handleKicked);

    return () => {
      webSocketService.leaveGameRoom(gameId);
      webSocketService.unsubscribeFromAllGameTopics(gameId);
    };
  }, [gameId, isLoading, participantId, showAnswer, navigate]);

  // === Timer đếm ngược ===
  useEffect(() => {
    if (!question || hasAnswered || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, hasAnswered, timeLeft]);

  // === Gửi đáp án ===
  const sendAnswer = () => {
    if (!gameId || !participantId || !question || hasAnswered || isSubmitting) return;
    setIsSubmitting(true);

    let answer: any = null;

    if (question.type === "FILL_IN_THE_BLANK") {
      answer = fillAnswer.trim();
    } else if (question.type === "MULTIPLE_CHOICE") {
      answer = selectedOptions;
    } else {
      answer = selectedOptions[0] || null;
    }

    webSocketService.submitAnswer(gameId, participantId, answer);
    setIsSubmitting(false);
  };

  const toggleOption = (optionId: string) => {
    if (hasAnswered || timeLeft === 0) return;

    if (question?.type === "MULTIPLE_CHOICE") {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
      sendAnswer();
    }
  };

  // === Render ===
  if (isLoading || error || !game) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary">
        <div className="text-center text-white">
          {error ? (
            <>
              <i className="bx bx-error-circle display-1 mb-3" />
              <h4>{error}</h4>
              <button className="btn btn-light mt-3" onClick={() => navigate("/")}>
                Về trang chủ
              </button>
            </>
          ) : (
            <>
              <div className="spinner-border mb-3" style={{ width: "3rem", height: "3rem" }} />
              <h4>Đang kết nối trò chơi...</h4>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Header */}
              <div className="text-white text-center py-4" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                <h1 className="display-6 fw-bold mb-1">{game.quiz.title}</h1>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <span className="badge bg-white text-primary px-3 py-2">
                    Câu {game.currentQuestionIndex + 1} / {game.totalQuestions}
                  </span>
                  <span className={`badge px-3 py-2 ${timeLeft <= 5 ? "bg-danger" : "bg-success"}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              <div className="card-body p-4 p-md-5">
                {/* Câu hỏi đang diễn ra */}
                {question && !showAnswer && (
                  <div className="text-center mb-5">
                    <h2 className="display-5 fw-bold text-dark mb-4">{question.questionText}</h2>

                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="Question"
                        className="img-fluid rounded-3 shadow-sm mb-4"
                        style={{ maxHeight: "300px" }}
                      />
                    )}

                    <div className="progress mb-5" style={{ height: "20px" }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                        style={{ width: `${(timeLeft / (question.timeLimitSeconds || 15)) * 100}%` }}
                      />
                    </div>

                    {/* Đáp án */}
                    {question.type === "FILL_IN_THE_BLANK" ? (
                      <div className="d-flex justify-content-center gap-3">
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-pill text-center"
                          style={{ maxWidth: "500px" }}
                          placeholder="Nhập đáp án..."
                          value={fillAnswer}
                          onChange={(e) => setFillAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
                          disabled={hasAnswered}
                        />
                        <button
                          className="btn btn-primary btn-lg rounded-pill px-5"
                          onClick={sendAnswer}
                          disabled={hasAnswered || !fillAnswer.trim()}
                        >
                          Gửi
                        </button>
                      </div>
                    ) : (
                      <div className="row g-3 justify-content-center">
                        {question.options.map((opt) => (
                          <div key={opt.optionId} className="col-md-6">
                            <OptionButton
                              option={opt}
                              isSelected={selectedOptions.includes(opt.optionId)}
                              onClick={() => toggleOption(opt.optionId)}
                              disabled={hasAnswered}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bảng xếp hạng sau mỗi câu */}
                {showAnswer && (
                  <div className="text-center">
                    <h3 className="fw-bold mb-5 text-primary">
                      {pendingQuestion ? "Câu tiếp theo..." : "Đáp án đã hiện!"}
                    </h3>

                    {pendingLeaderboard && (
                      <div className="row g-4 justify-content-center">
                        {pendingLeaderboard.slice(0, 10).map((entry, i) => {
                          const player = participantsWithAvatar.find(p => p.participantId === entry.participantId);
                          return (
                            <div key={entry.participantId} className="col-md-6 col-lg-4">
                              <div className={`card h-100 border-0 shadow-sm rounded-4 p-3 ${i < 3 ? "border-warning border-3" : ""}`}>
                                <div className="d-flex align-items-center">
                                  <div className="me-3 fs-3 fw-bold">#{i + 1}</div>
                                  <img
                                    src={player?.avatar || unknownAvatar}
                                    alt={entry.nickname}
                                    className="rounded-circle me-3"
                                    width={56}
                                    height={56}
                                  />
                                  <div className="text-start">
                                    <h6 className="mb-0 fw-bold text-truncate">{entry.nickname}</h6>
                                    <div className="badge bg-success fs-6">{entry.score} điểm</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {pendingQuestion && (
                      <div className="mt-5">
                        <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} />
                        <p className="mt-3 fs-4 fw-bold">Chuẩn bị câu hỏi tiếp theo...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlayPage;