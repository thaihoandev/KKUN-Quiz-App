import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";

const QuizDropdown: React.FC<{quizId: string}> = ({quizId}) => {
    const navigate = useNavigate();

    return (
        <div className="dropdown">
            <button
                className="btn btn-primary btn-icon show"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i className="bx bx-dots-vertical-rounded"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
                <li>
                    <button
                        className="dropdown-item"
                        onClick={() => navigate(`/quizzes/${quizId}`)}
                    >
                        View Details
                    </button>
                </li>
                <li>
                    <button
                        className="dropdown-item"
                        onClick={() => navigate(`/quizzes/share/${quizId}`)}
                    >
                        Share Quiz
                    </button>
                </li>
                <li>
                    <hr className="dropdown-divider" />
                </li>
                <li>
                    <button
                        className="dropdown-item text-danger"
                        onClick={() => navigate(`/quizzes/delete/${quizId}`)}
                    >
                        Delete Quiz
                    </button>
                </li>
            </ul>
        </div>
    );
};
QuizDropdown.propTypes = {
    quizId: PropTypes.string.isRequired,
};
export default QuizDropdown;
