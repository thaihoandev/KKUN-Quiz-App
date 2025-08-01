import {useEffect} from "react";
import {useLocation} from "react-router-dom";

const ScrollToTop = () => {
    const {pathname} = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]); // Khi pathname thay đổi, cuộn lên đầu trang

    return null; // Không cần render gì cả
};

export default ScrollToTop;
