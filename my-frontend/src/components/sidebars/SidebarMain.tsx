import { useEffect, useState, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo/logo192.png";
import { joinGame, fetchGameData } from "@/services/gameService";

interface Profile {
  userId?: string;
}

interface PlayerRequestDTO {
  playerSession: string | null;
  nickname: string;
  isAnonymous: boolean;
  score: number;
}

interface PlayerResponseDTO {
  playerId: string;
  gameId: string;
  userId?: string | null;
  nickname: string;
  score: number;
  isAnonymous: boolean;
  isInGame: boolean;
}

interface GameResponseDTO {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  startTime: string;
  endTime: string | null;
}

interface GameDetailsResponseDTO {
  game: GameResponseDTO;
  players: PlayerResponseDTO[];
}

interface HeaderProps {
  profile?: Profile;
}

const SidebarMain: React.FC<HeaderProps> = ({ profile }) => {
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

  const playerSession = localStorage.getItem("playerSession");
  const savedGameId = localStorage.getItem("gameId");

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
    setOpenSubmenus((prev) =>
      prev.includes(submenuId) ? prev.filter((id) => id !== submenuId) : [...prev, submenuId]
    );
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
      const quizTitle = "Quiz Game";
      localStorage.setItem("nickname", nickname.trim());
      if (player.playerId) {
        localStorage.setItem("playerSession", player.playerId);
        localStorage.setItem("gameId", player.gameId);
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

  const isCollapsedAndNotHovered = menuCollapsed && !isHovered;
  const isSettingsOpen =
    isSubmenuOpen("settings") ||
    location.pathname.includes("/settings") ||
    location.pathname.includes("/change-password");

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
            <img src={logo} style={{ width: "40px", height: "40px" }} alt="Logo" className="h-10 w-auto" />
          </span>
          <span className="app-brand-text demo menu-text fw-bold ms-2">KKUN</span>
        </a>
        <a href="#" onClick={toggleSidebar} className="layout-menu-toggle menu-link text-large ms-auto">
          <i className={`icon-base bx ${getChevronIcon()}`}></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      {!isCollapsedAndNotHovered && (
        <div className="px-4 py-3">
          <div className="form-group">
            <label htmlFor="roomCode" className="form-label small text-muted">Room Code</label>
            <div className="input-group">
              <input type="text" className="form-control form-control-sm" id="roomCode" placeholder="Enter code" />
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={isLoading || !!playerSession}
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
                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCollapsedAndNotHovered && (
        <div className="px-2 py-3 text-center">
          <button
            className="btn btn-primary btn-sm rounded-circle"
            type="button"
            disabled={isLoading || !!playerSession}
            title="Join Room"
            onClick={() => setMenuCollapsed(false)}
          >
            <i className="bx bx-plus"></i>
          </button>
        </div>
      )}

      {error && !isCollapsedAndNotHovered && (
        <div className="px-4 pb-2">
          <div className="alert alert-danger alert-sm py-2" role="alert">
            <small>{error}</small>
          </div>
        </div>
      )}

      {showNicknameModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter Your Nickname</h5>
                <button type="button" className="btn-close" disabled={isLoading} onClick={() => setShowNicknameModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nickname" className="form-label">Nickname</label>
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
                <button type="button" className="btn btn-secondary" disabled={isLoading} onClick={() => setShowNicknameModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" disabled={isLoading} onClick={handleJoinRoom}>
                  {isLoading ? <span className="spinner-border spinner-border-sm"></span> : "Join Room"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ul className="menu-inner py-1">
        <li className={`menu-item ${isActive("/") ? "active" : ""}`}>
          <Link to="/" className="menu-link" onClick={() => handleMenuItemClick("/")}>
            <i className="menu-icon icon-base bx bx-home-smile"></i>
            <div data-i18n="Home">Home</div>
          </Link>
        </li>
        <li className={`menu-item ${isActive("/posts") ? "active" : ""}`}>
          <Link to="/posts" className="menu-link" onClick={() => handleMenuItemClick("/posts")}>
            <i className="menu-icon icon-base bx bx-news"></i>
            <div data-i18n="Posts">Posts</div>
          </Link>
        </li>

        {profile ? (
          <>
            <li className="menu-header small"><span className="menu-header-text" data-i18n="Dashboard">Dashboard</span></li>
            <li className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}>
              <Link to="/dashboard" className="menu-link" onClick={() => handleMenuItemClick("/dashboard")}>
                <i className="menu-icon icon-base bx bx-tachometer"></i>
                <div data-i18n="Dashboard">My Profile</div>
              </Link>
            </li>
            <li className={`menu-item ${isActive("/achievements") ? "active" : ""}`}>
              <Link to="/achievements" className="menu-link" onClick={() => handleMenuItemClick("/achievements")}>
                <i className="menu-icon icon-base bx bx-trophy"></i>
                <div data-i18n="Achievements">Achievements</div>
                <div className="badge text-bg-warning rounded-pill ms-auto">3</div>
              </Link>
            </li>
            <li className="menu-header small"><span className="menu-header-text" data-i18n="Settings">Settings</span></li>
            <li className={`menu-item ${isSettingsOpen ? "open" : ""}`}>
              <a href="#" className="menu-link menu-toggle" onClick={(e) => toggleSubmenu(e, "settings")}>
                <i className="menu-icon icon-base bx bx-cog"></i>
                <div data-i18n="Settings">Settings</div>
              </a>
              <ul className={`menu-sub ${isSettingsOpen ? "open" : ""}`}>
                <li className={`menu-item ${isActive("/settings") ? "active" : ""}`}>
                  <Link to="/settings" className="menu-link" onClick={() => handleMenuItemClick("/settings")}>
                    <div data-i18n="Profile Settings">Profile Settings</div>
                  </Link>
                </li>
                <li className={`menu-item ${isActive("/change-password") ? "active" : ""}`}>
                  <Link to="/change-password" className="menu-link" onClick={() => handleMenuItemClick("/change-password")}>
                    <div data-i18n="Change Password">Change Password</div>
                  </Link>
                </li>
              </ul>
            </li>
          </>
        ) : (
          <>
            <li className="menu-header small"><span className="menu-header-text" data-i18n="Get Started">Get Started</span></li>
            <li className="menu-item">
              <a href="#" className="menu-link" onClick={(e) => {
                e.preventDefault();
                const roomCodeInput = document.getElementById("roomCode") as HTMLInputElement;
                if (roomCodeInput) roomCodeInput.focus();
              }}>
                <i className="menu-icon icon-base bx bx-door-open"></i>
                <div data-i18n="Quick Join">Quick Join Game</div>
              </a>
            </li>
            <li className="menu-header small"><span className="menu-header-text" data-i18n="Account">Account</span></li>
            <li className="menu-item">
              <div className="px-3 py-2">
                <button onClick={() => navigate("/login")} className="btn btn-primary w-100 mb-2">
                  <i className="bx bx-log-in me-2"></i>Login
                </button>
                <button onClick={() => navigate("/register")} className="btn btn-outline-primary w-100">
                  <i className="bx bx-user-plus me-2"></i>Register
                </button>
              </div>
            </li>
            <li className="menu-header small"><span className="menu-header-text" data-i18n="About">About KKUN</span></li>
            <li className="menu-item">
              <a href="#" className="menu-link" onClick={(e) => e.preventDefault()}>
                <i className="menu-icon icon-base bx bx-info-circle"></i>
                <div data-i18n="How to Play">How to Play</div>
              </a>
            </li>
            <li className="menu-item">
              <a href="#" className="menu-link" onClick={(e) => e.preventDefault()}>
                <i className="menu-icon icon-base bx bx-star"></i>
                <div data-i18n="Features">Features</div>
              </a>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
};

export default SidebarMain;
