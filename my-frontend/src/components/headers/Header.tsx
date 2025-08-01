import { useEffect, useState, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/logo192.png";
import { joinGame, fetchGameData } from "@/services/gameService";

// Định nghĩa interface cho profile
interface Profile {
  userId?: string;
}

// Định nghĩa interface cho PlayerRequestDTO
interface PlayerRequestDTO {
  playerSession: string | null;
  nickname: string;
  isAnonymous: boolean;
  score: number;
}

// Định nghĩa interface cho PlayerResponseDTO
interface PlayerResponseDTO {
  playerId: string;
  gameId: string;
  userId?: string | null;
  nickname: string;
  score: number;
  isAnonymous: boolean;
  isInGame: boolean;
}

// Định nghĩa interface cho GameResponseDTO
interface GameResponseDTO {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  startTime: string;
  endTime: string | null;
}

// Định nghĩa interface cho GameDetailsResponseDTO
interface GameDetailsResponseDTO {
  game: GameResponseDTO;
  players: PlayerResponseDTO[];
}

interface HeaderProps {
  profile?: Profile;
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("");
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(false);
  const [tempRoomCode, setTempRoomCode] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy playerSession từ localStorage
  const playerSession = localStorage.getItem("playerSession");
  const savedGameId = localStorage.getItem("gameId"); // Giả định gameId được lưu khi join

  useEffect(() => {
    if (menuCollapsed && !isHovered) {
      document.body.classList.add("layout-menu-collapsed");
    } else {
      document.body.classList.remove("layout-menu-collapsed");
    }
  }, [menuCollapsed, isHovered]);

  useEffect(() => {
    const currentPath = location.pathname;
    if (activeMenuItem !== currentPath) {
      setActiveMenuItem(currentPath);
    }
  }, [location.pathname]);

  // Kiểm tra và vào phòng trực tiếp nếu có playerSession
  useEffect(() => {
    if (playerSession && savedGameId) {
      const joinExistingRoom = async () => {
        setIsLoading(true);
        try {
          const gameData = await fetchGameData(savedGameId);
          if (gameData.game.status === "WAITING") {
            navigate(`/game-session/${savedGameId}`, { state: { gameData: gameData.game, quizTitle: "Quiz Game" } });
          } else {
            setError("The room is no longer in WAITING status.");
          }
        } catch (error) {
          setError("Failed to rejoin room: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
          setIsLoading(false);
        }
      };
      joinExistingRoom();
    }
  }, [playerSession, savedGameId, navigate]);

  const handleMenuItemClick = (path: string) => {
    setActiveMenuItem(path);
  };

  const toggleSubmenu = (e: MouseEvent<HTMLAnchorElement>, submenuId: string) => {
    e.preventDefault();
    if (openSubmenus.includes(submenuId)) {
      setOpenSubmenus(openSubmenus.filter((id) => id !== submenuId));
    } else {
      setOpenSubmenus([...openSubmenus, submenuId]);
    }
  };

  const toggleSidebar = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMenuCollapsed(!menuCollapsed);
  };

  const handleMouseEnter = () => {
    if (menuCollapsed) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (menuCollapsed) {
      setIsHovered(false);
    }
  };

  const isActive = (path: string): boolean => {
    return activeMenuItem === path;
  };

  const isSubmenuOpen = (submenuId: string): boolean => {
    return openSubmenus.includes(submenuId);
  };

  const getChevronIcon = (): string => {
    return menuCollapsed ? "bx-chevron-right" : "bx-chevron-left";
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const player = await joinGame(tempRoomCode, nickname.trim());
      const gameData = await fetchGameData(player.gameId);
      const quizTitle = "Quiz Game"; // Giả định, thay bằng API nếu có
      localStorage.setItem("nickname", nickname.trim());
      if (player.playerId) {
        localStorage.setItem("playerSession", player.playerId);
        localStorage.setItem("gameId", player.gameId); // Lưu gameId
      }
      setShowNicknameModal(false);
      navigate(`/game-session/${player.gameId}`, { state: { gameData: gameData.game, quizTitle, player } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to join room";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      id="layout-menu"
      className={`layout-menu menu-vertical menu ${menuCollapsed && !isHovered ? "collapsed" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="app-brand demo">
        <a href="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img
              src={logo}
              style={{ width: "40px", height: "40px" }}
              alt="Logo"
              className="h-10 w-auto"
            />
          </span>
          <span className="app-brand-text demo menu-text fw-bold ms-2">
            KKUN
          </span>
        </a>
        <a
          href="#"
          onClick={toggleSidebar}
          className="layout-menu-toggle menu-link text-large ms-auto"
        >
          <i className={`icon-base bx ${getChevronIcon()}`}></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <div className="px-4 py-3">
        <div className="form-group">
          <label htmlFor="roomCode" className="form-label">
            Room Code
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              id="roomCode"
              placeholder="Enter room code"
            />
            <button
              className="btn btn-primary"
              type="button"
              disabled={isLoading || !!playerSession} // Vô hiệu hóa nếu đã có playerSession
              onClick={() => {
                const roomCode = (document.getElementById("roomCode") as HTMLInputElement).value;
                if (roomCode) {
                  setTempRoomCode(roomCode);
                  setShowNicknameModal(true);
                } else {
                  setError("Please enter a room code");
                }
              }}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                "Join"
              )}
            </button>
          </div>
        </div>
      </div>

      {showNicknameModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter Your Nickname</h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={isLoading}
                  onClick={() => setShowNicknameModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nickname" className="form-label">
                    Nickname
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nickname"
                    placeholder="Enter your nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={isLoading}
                  />
                  {error && <div className="text-danger mt-2">{error}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isLoading}
                  onClick={() => setShowNicknameModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isLoading}
                  onClick={handleJoinRoom}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    "Join Room"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ul className="menu-inner py-1">
        <li className={`menu-item ${isActive("/") ? "active" : ""}`}>
          <Link
            to="/"
            className="menu-link"
            onClick={() => handleMenuItemClick("/")}
          >
            <i className="menu-icon icon-base bx bx-home-smile"></i>
            <div data-i18n="Home">Home</div>
            <div className="badge text-bg-danger rounded-pill ms-auto">5</div>
          </Link>
        </li>

        {profile ? (
          <>
            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="Charts & Maps">
                Lesson
              </span>
            </li>

            <li
              className={`menu-item ${
                isActive("/courses") || isActive("/classes") || isActive("/quizzes")
                  ? "active"
                  : ""
              } ${isSubmenuOpen("my-category") ? "open" : ""}`}
            >
              <a
                href="#"
                className="menu-link menu-toggle"
                onClick={(e) => toggleSubmenu(e, "my-category")}
              >
                <i className="menu-icon icon-base bx bx-chart"></i>
                <div data-i18n="My Category">My Category</div>
              </a>
              <ul className="menu-sub">
                <li className={`menu-item ${isActive("/courses") ? "active" : ""}`}>
                  <Link
                    to="/courses"
                    className="menu-link"
                    onClick={() => handleMenuItemClick("/courses")}
                  >
                    <div data-i18n="Courses">Courses</div>
                  </Link>
                </li>
                <li className={`menu-item ${isActive("/classes") ? "active" : ""}`}>
                  <Link
                    to="/classes"
                    className="menu-link"
                    onClick={() => handleMenuItemClick("/classes")}
                  >
                    <div data-i18n="Classes">Classes</div>
                  </Link>
                </li>
                <li className={`menu-item ${isActive("/quizzes") ? "active" : ""}`}>
                  <Link
                    to="/quizzes"
                    className="menu-link"
                    onClick={() => handleMenuItemClick("/quizzes")}
                  >
                    <div data-i18n="Quizzes">Quizzes</div>
                  </Link>
                </li>
              </ul>
            </li>

            <li className={`menu-item ${isActive("/achievements") ? "active" : ""}`}>
              <Link
                to="/achievements"
                className="menu-link"
                onClick={() => handleMenuItemClick("/achievements")}
              >
                <i className="menu-icon icon-base bx bx-map-alt"></i>
                <div data-i18n="Achievements">Achievements</div>
              </Link>
            </li>
          </>
        ) : (
          <>
            <li className="menu-header small">
              <span className="menu-header-text" data-i18n="More information">
                More information
              </span>
            </li>
            <div className="d-flex justify-content-center align-items-center p-3 w-100">
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary w-100"
              >
                Login
              </button>
            </div>
          </>
        )}
      </ul>
    </aside>
  );
};

export default Header;