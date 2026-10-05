import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Tự động cuộn cửa sổ trình duyệt lên đầu trang mỗi khi đường dẫn URL (pathname) thay đổi.
 * Khắc phục hiện tượng giữ nguyên vị trí cuộn khi chuyển giữa các trang trong ứng dụng SPA.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

