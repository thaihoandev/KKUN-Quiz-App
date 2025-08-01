import unknownAvatar from "@/assets/img/avatars/unknown.jpg"; // Default avatar image

const HeaderProfile = ({ profile }: { profile: any }) => {
    return (
        <div className="row">
            <div className="col-12">
                <div className="card mb-6 mt-3">
                    <div className="user-profile-header-banner"></div>
                    <div className="user-profile-header d-flex flex-column flex-lg-row text-sm-start text-center mb-8">
                        <div className="flex-shrink-0 mt-1 mx-sm-0 mx-auto">
                            <img
                                src={
                                    profile?.avatar &&
                                    profile.avatar.trim() !== ""
                                        ? profile.avatar
                                        : unknownAvatar
                                }
                                alt="user image"
                                className="d-block h-auto ms-0 ms-sm-6 rounded-3 user-profile-img"
                            />
                        </div>
                        <div className="flex-grow-1 mt-3 mt-lg-5">
                            <div className="d-flex align-items-md-end align-items-sm-start align-items-center justify-content-md-between justify-content-start mx-5 flex-md-row flex-column gap-4">
                                <div className="user-profile-info">
                                    <h4 className="mb-2 mt-lg-7">
                                        {profile?.name || "Không có tên"}
                                    </h4>
                                    <ul className="list-inline mb-0 d-flex align-items-center flex-wrap justify-content-sm-start justify-content-center gap-4 mt-4">
                                        <li className="list-inline-item text-danger">
                                            <i className="icon-base bx bx-user me-2 align-top"></i>
                                            <span className="">
                                                {profile?.role || "USER"}
                                            </span>
                                        </li>
                                        <li className="list-inline-item">
                                            <i className="icon-base fa fa-school me-2 align-top"></i>
                                            <span className="fw-medium">
                                                School:{" "}
                                                {profile?.school || "Không rõ"}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <a href="#" className="btn btn-primary mb-1">
                                    <i className="icon-base bx bx-user-check icon-sm me-2"></i>
                                    Connected
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaderProfile;
