const Footer = () => {
    return (
        <footer className="content-footer footer bg-footer-theme mt-auto">
            <div className="container-xxl">
                <div className="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
                    <div className="mb-2 mb-md-0">
                        ©
                        <script>
                            document.write(new Date().getFullYear());
                        </script>
                        , made by {" "}
                        <a
                            href="https://themeselection.com"
                            target="_blank"
                            className="footer-link"
                            rel="noreferrer"
                        >
                            Thái Hoàn
                        </a>
                    </div>
                    <div className="d-none d-lg-inline-block">
                        <a
                            href="https://themeselection.com/license/"
                            className="footer-link me-4"
                            target="_blank"
                            rel="noreferrer"
                        >
                            License
                        </a>
                        <a
                            href="https://themeselection.com/"
                            target="_blank"
                            className="footer-link me-4"
                            rel="noreferrer"
                        >
                            More Themes
                        </a>

                        <a
                            href="https://demos.themeselection.com/sneat-bootstrap-html-admin-template/documentation/"
                            target="_blank"
                            className="footer-link me-4"
                            rel="noreferrer"
                        >
                            Documentation
                        </a>

                        <a
                            href="https://themeselection.com/support/"
                            target="_blank"
                            className="footer-link d-none d-sm-inline-block"
                            rel="noreferrer"
                        >
                            Support
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
