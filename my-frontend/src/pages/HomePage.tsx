import {useEffect} from "react";

const HomePage = () => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "@/assets/js/app-academy-course.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script); // Cleanup khi unmount
        };
    }, []);
    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="app-academy">
                <div className="card p-0 mb-6">
                    <div className="card-body d-flex flex-column flex-md-row justify-content-between p-0 pt-6">
                        <div className="app-academy-md-25 card-body py-0 pt-6 ps-12">
                            <img
                                src="../../assets/img/illustrations/bulb-light.png"
                                className="img-fluid app-academy-img-height scaleX-n1-rtl"
                                alt="Bulb in hand"
                                data-app-light-img="illustrations/bulb-light.png"
                                data-app-dark-img="illustrations/bulb-dark.png"
                                height="90"
                            />
                        </div>
                        <div className="app-academy-md-50 card-body d-flex align-items-md-center flex-column text-md-center mb-6 py-6">
                            <span className="card-title mb-4 px-md-12 h4">
                                Education, talents, and career
                                <br />
                                opportunities.{" "}
                                <span className="text-primary text-nowrap">
                                    All in one place
                                </span>
                                .
                            </span>
                            <p className="mb-4">
                                Grow your skill with the most reliable online
                                courses and certifications in
                                <br />
                                marketing, information technology, programming,
                                and data science.
                            </p>
                            <div className="d-flex align-items-center justify-content-between app-academy-md-80">
                                <input
                                    type="search"
                                    placeholder="Find your course"
                                    className="form-control me-4"
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-icon"
                                >
                                    <i className="icon-base bx bx-search icon-md"></i>
                                </button>
                            </div>
                        </div>
                        <div className="app-academy-md-25 d-flex align-items-end justify-content-end">
                            <img
                                src="../../assets/img/illustrations/pencil-rocket.png"
                                alt="pencil rocket"
                                height="180"
                                className="scaleX-n1-rtl"
                            />
                        </div>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-header d-flex flex-wrap justify-content-between gap-4">
                        <div className="card-title mb-0 me-1">
                            <h5 className="mb-0">My Courses</h5>
                            <p className="mb-0">
                                Total 6 course you have purchased
                            </p>
                        </div>
                        <div className="d-flex justify-content-md-end align-items-sm-center align-items-start column-gap-6 flex-sm-row flex-column row-gap-4">
                            <select className="form-select">
                                <option value="">All Courses</option>
                                <option value="ui/ux">UI/UX</option>
                                <option value="seo">SEO</option>
                                <option value="web">Web</option>
                                <option value="music">Music</option>
                                <option value="painting">Painting</option>
                            </select>

                            <div className="form-check form-switch my-2 ms-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="CourseSwitch"
                                />
                                <label
                                    className="form-check-label text-nowrap mb-0"
                                    htmlFor="CourseSwitch"
                                >
                                    Hide completed
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row gy-6 mb-6">
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-1.png"
                                                alt="tutor image 1"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="badge bg-label-primary">
                                                Web
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center fw-medium gap-1 mb-0">
                                                4.4{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    (1.23k)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            href="app-academy-course-details.html"
                                            className="h5"
                                        >
                                            Basics of Angular
                                        </a>
                                        <p className="mt-1">
                                            Introductory course for Angular and
                                            framework basics in web development.
                                        </p>
                                        <p className="d-flex align-items-center mb-1">
                                            <i className="icon-base bx bx-time-five me-1"></i>
                                            30 minutes
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                                            <a
                                                className="w-100 btn btn-label-secondary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <i className="icon-base bx bx-rotate-right icon-sm align-middle scaleX-n1-rtl me-2"></i>
                                                <span>Start Over</span>{" "}
                                            </a>
                                            <a
                                                className="w-100 btn btn-label-primary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <span className="me-2">
                                                    Continue
                                                </span>
                                                <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>{" "}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-2.png"
                                                alt="tutor image 2"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4 pe-xl-4 pe-xxl-0">
                                            <span className="badge bg-label-danger">
                                                UI/UX
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center fw-medium gap-1 mb-0">
                                                4.2{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    {" "}
                                                    (424)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            className="h5"
                                            href="app-academy-course-details.html"
                                        >
                                            Figma & More
                                        </a>
                                        <p className="mt-1">
                                            Introductory course for design and
                                            framework basics in web development.
                                        </p>
                                        <p className="d-flex align-items-center mb-1">
                                            <i className="icon-base bx bx-time-five me-1"></i>
                                            16 hours
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                                            <a
                                                className="w-100 btn btn-label-secondary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <i className="icon-base bx bx-rotate-right icon-sm align-middle me-2"></i>
                                                <span>Start Over</span>{" "}
                                            </a>
                                            <a
                                                className="w-100 btn btn-label-primary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <span className="me-2">
                                                    Continue
                                                </span>
                                                <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>{" "}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-3.png"
                                                alt="tutor image 3"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="badge bg-label-success">
                                                SEO
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center fw-medium gap-1 mb-0">
                                                5{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    {" "}
                                                    (12)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            className="h5"
                                            href="app-academy-course-details.html"
                                        >
                                            Keyword Research
                                        </a>
                                        <p className="mt-1">
                                            Keyword suggestion tool provides
                                            comprehensive details & keyword
                                            suggestions.
                                        </p>
                                        <p className="d-flex align-items-center mb-1">
                                            <i className="icon-base bx bx-time-five me-1"></i>
                                            7 hours
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                                            <a
                                                className="w-100 btn btn-label-secondary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <i className="icon-base bx bx-rotate-right icon-sm align-middle me-2"></i>
                                                <span>Start Over</span>{" "}
                                            </a>
                                            <a
                                                className="w-100 btn btn-label-primary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <span className="me-2">
                                                    Continue
                                                </span>
                                                <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>{" "}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-4.png"
                                                alt="tutor image 4"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="badge bg-label-info">
                                                Music
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center gap-1 mb-0">
                                                3.8{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    {" "}
                                                    (634)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            className="h5"
                                            href="app-academy-course-details.html"
                                        >
                                            Basics to Advanced
                                        </a>
                                        <p className="mt-1">
                                            20 more lessons like this about
                                            music production, writing, mixing,
                                            mastering
                                        </p>
                                        <p className="d-flex align-items-center mb-1">
                                            <i className="icon-base bx bx-time-five me-1"></i>
                                            30 minutes
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                                            <a
                                                className="w-100 btn btn-label-secondary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <i className="icon-base bx bx-rotate-right icon-sm align-middle me-2"></i>
                                                <span>Start Over</span>{" "}
                                            </a>
                                            <a
                                                className="w-100 btn btn-label-primary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <span className="me-2">
                                                    Continue
                                                </span>
                                                <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>{" "}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-5.png"
                                                alt="tutor image 5"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="badge bg-label-warning">
                                                Painting
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center gap-1 mb-0">
                                                4.7{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    {" "}
                                                    (34)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            className="h5"
                                            href="app-academy-course-details.html"
                                        >
                                            Art & Drawing
                                        </a>
                                        <p className="mt-1">
                                            Easy-to-follow video & guides show
                                            you how to draw animals, people &
                                            more.
                                        </p>
                                        <p className="d-flex align-items-center text-success mb-1">
                                            <i className="icon-base bx bx-check me-1"></i>
                                            Completed
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <a
                                            className="w-100 btn btn-label-primary"
                                            href="app-academy-course-details.html"
                                        >
                                            <i className="icon-base bx bx-rotate-right icon-sm me-1_5"></i>
                                            Start Over
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-4">
                                <div className="card p-2 h-100 shadow-none border">
                                    <div className="rounded-2 text-center mb-4">
                                        <a href="app-academy-course-details.html">
                                            <img
                                                className="img-fluid"
                                                src="../../assets/img/pages/app-academy-tutor-6.png"
                                                alt="tutor image 6"
                                            />
                                        </a>
                                    </div>
                                    <div className="card-body p-4 pt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="badge bg-label-danger">
                                                UI/UX
                                            </span>
                                            <p className="d-flex align-items-center justify-content-center gap-1 mb-0">
                                                3.6{" "}
                                                <span className="text-warning">
                                                    <i className="icon-base bx bxs-star me-1 mb-1_5"></i>
                                                </span>
                                                <span className="fw-normal">
                                                    {" "}
                                                    (2.5k)
                                                </span>
                                            </p>
                                        </div>
                                        <a
                                            className="h5"
                                            href="app-academy-course-details.html"
                                        >
                                            Basics Fundamentals
                                        </a>
                                        <p className="mt-1">
                                            This guide will help you develop a
                                            systematic approach user interface.
                                        </p>
                                        <p className="d-flex align-items-center mb-1">
                                            <i className="icon-base bx bx-time-five me-1"></i>
                                            16 hours
                                        </p>
                                        <div
                                            className="progress mb-4"
                                            style={{height: "8px"}}
                                        >
                                            <div
                                                className="progress-bar w-25"
                                                role="progressbar"
                                                aria-valuenow={25} // ✅ Chuyển thành số (number)
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-4 text-nowrap flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                                            <a
                                                className="w-100 btn btn-label-secondary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <i className="icon-base bx bx-rotate-right icon-sm align-middle me-2"></i>
                                                <span>Start Over</span>{" "}
                                            </a>
                                            <a
                                                className="w-100 btn btn-label-primary d-flex align-items-center"
                                                href="app-academy-course-details.html"
                                            >
                                                {" "}
                                                <span className="me-2">
                                                    Continue
                                                </span>
                                                <i className="icon-base bx bx-chevron-right icon-sm lh-1 scaleX-n1-rtl"></i>{" "}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav
                            aria-label="Page navigation"
                            className="d-flex align-items-center justify-content-center"
                        >
                            <ul className="pagination mb-0 pagination-rounded">
                                <li className="page-item first disabled">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        <i className="icon-base bx bx-chevrons-left icon-sm scaleX-n1-rtl"></i>
                                    </a>
                                </li>
                                <li className="page-item prev disabled">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        <i className="icon-base bx bx-chevron-left icon-sm scaleX-n1-rtl"></i>
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        1
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        2
                                    </a>
                                </li>
                                <li className="page-item active">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        3
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        4
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        5
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        6
                                    </a>
                                </li>
                                <li className="page-item next">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        <i className="icon-base bx bx-chevron-right icon-sm scaleX-n1-rtl"></i>
                                    </a>
                                </li>
                                <li className="page-item last">
                                    <a
                                        className="page-link"
                                        href="javascript:void(0);"
                                    >
                                        <i className="icon-base bx bx-chevrons-right icon-sm scaleX-n1-rtl"></i>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="row gy-6 mb-6">
                    <div className="col-lg-6">
                        <div className="card shadow-none bg-label-primary h-100">
                            <div className="card-body d-flex justify-content-between flex-wrap-reverse">
                                <div className="mb-0 w-100 app-academy-sm-60 d-flex flex-column justify-content-between text-center text-sm-start">
                                    <div className="card-title">
                                        <h5 className="text-primary mb-2">
                                            Earn a Certificate
                                        </h5>
                                        <p className="text-body w-sm-80 app-academy-xl-100">
                                            Get the right professional
                                            certificate program for you.
                                        </p>
                                    </div>
                                    <div className="mb-0">
                                        <button className="btn btn-sm btn-primary">
                                            View Programs
                                        </button>
                                    </div>
                                </div>
                                <div className="w-100 app-academy-sm-40 d-flex justify-content-center justify-content-sm-end h-px-150 mb-4 mb-sm-0">
                                    <img
                                        className="img-fluid scaleX-n1-rtl"
                                        src="../../assets/img/illustrations/boy-app-academy.png"
                                        alt="boy illustration"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card shadow-none bg-label-danger h-100">
                            <div className="card-body d-flex justify-content-between flex-wrap-reverse">
                                <div className="mb-0 w-100 app-academy-sm-60 d-flex flex-column justify-content-between text-center text-sm-start">
                                    <div className="card-title">
                                        <h5 className="text-danger mb-2">
                                            Best Rated Courses
                                        </h5>
                                        <p className="text-body app-academy-sm-60 app-academy-xl-100">
                                            Enroll now in the most popular and
                                            best rated courses.
                                        </p>
                                    </div>
                                    <div className="mb-0">
                                        <button className="btn btn-sm btn-danger">
                                            View Courses
                                        </button>
                                    </div>
                                </div>
                                <div className="w-100 app-academy-sm-40 d-flex justify-content-center justify-content-sm-end h-px-150 mb-4 mb-sm-0">
                                    <img
                                        className="img-fluid scaleX-n1-rtl"
                                        src="../../assets/img/illustrations/girl-app-academy.png"
                                        alt="girl illustration"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
            </div>
        </div>
    );
};

export default HomePage;
