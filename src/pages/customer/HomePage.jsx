import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Button, Carousel } from "react-bootstrap";
import { Link } from "react-router-dom";
import bookApi from "../../api/bookApi";
import axiosClient from "../../api/axiosClient";
import BookGrid from "../../components/BookGrid";
import SearchBar from "../../components/SearchBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import { matchesSearch, BOOK_STATUS } from "../../utils/helpers";
import {
  FaArrowRight,
  FaShippingFast,
  FaShieldAlt,
  FaUndoAlt,
  FaHeadset,
} from "react-icons/fa";

const FEATURED_ITEMS_PER_PAGE = 4;

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({});
  const [bookSales, setBookSales] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredPage, setFeaturedPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [booksRes, catRes, reviewsRes, orderItemsRes] = await Promise.all([
          bookApi.getAll(),
          bookApi.getCategories(),
          axiosClient.get("/reviews"),
          axiosClient.get("/orderItems"),
        ]);

        if (!isMounted) return;

        const activeCategories = (catRes.data || []).filter(
          (c) => !c.isDeleted && c.status !== "Inactive"
        );
        const activeBooks = (booksRes.data || []).filter(
          (b) => !b.isDeleted && b.status !== BOOK_STATUS.INACTIVE
        );

        setBooks(activeBooks);
        setCategories(activeCategories);

        const counts = {};
        (reviewsRes.data || []).forEach((r) => {
          const key = String(r.bookId);
          counts[key] = (counts[key] || 0) + 1;
        });
        setReviewCounts(counts);

        const sales = {};
        (orderItemsRes.data || []).forEach((item) => {
          const bId = String(item.bookId);
          sales[bId] = (sales[bId] || 0) + (Number(item.quantity) || 0);
        });
        setBookSales(sales);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
      if (isMounted) setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    return books.filter((book) =>
      matchesSearch(book.title, searchQuery) ||
      matchesSearch(book.author, searchQuery)
    );
  }, [books, searchQuery]);

  const allFeaturedBooks = useMemo(() => {
    return books
      .filter((b) => !b.isDeleted && b.status === BOOK_STATUS.ACTIVE && Number(b.stock) > 0)
      .sort((a, b) => {
        const soldA = bookSales[String(a.id)] || 0;
        const soldB = bookSales[String(b.id)] || 0;
        if (soldB !== soldA) return soldB - soldA;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
  }, [books, bookSales]);

  const totalFeaturedPages = Math.ceil(allFeaturedBooks.length / FEATURED_ITEMS_PER_PAGE);

  const paginatedFeaturedBooks = useMemo(() => {
    return allFeaturedBooks.slice(
      (featuredPage - 1) * FEATURED_ITEMS_PER_PAGE,
      featuredPage * FEATURED_ITEMS_PER_PAGE
    );
  }, [allFeaturedBooks, featuredPage]);

  const totalSearchPages = Math.ceil(filteredBooks.length / FEATURED_ITEMS_PER_PAGE);

  const paginatedSearchBooks = useMemo(() => {
    return filteredBooks.slice(
      (searchPage - 1) * FEATURED_ITEMS_PER_PAGE,
      searchPage * FEATURED_ITEMS_PER_PAGE
    );
  }, [filteredBooks, searchPage]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Hero Carousel Section */}
      <Carousel
        interval={4500}
        pause="hover"
        className="hero-carousel shadow-sm"
        indicators
      >
        {/* Slide 1: General Curated Collection */}
        <Carousel.Item className="hero-slide-1">
          <Container className="h-100 d-flex align-items-center">
            <Row className="align-items-center g-4 w-100">
              <Col lg={7} md={6}>
                <span className="badge bg-light text-dark px-3 py-2 fw-medium mb-3 rounded-1">
                  Bộ sưu tập chọn lọc 2026
                </span>
                <h1 className="display-5 fw-bold text-white mb-3 lh-sm">
                  Những cuốn sách gối đầu giường cho Lập trình viên & Nhà quản lý
                </h1>
                <p className="lead text-white-50 mb-4" style={{ maxWidth: "560px" }}>
                  Tuyển chọn các tựa sách kinh điển về kỹ nghệ phần mềm, kiến trúc hệ thống và phát triển bản thân với ấn bản chuẩn mực.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Button
                    as={Link}
                    to="/books"
                    variant="light"
                    className="btn-clean px-4 py-2 text-dark fw-semibold"
                  >
                    Khám phá tất cả sách <FaArrowRight className="ms-2" />
                  </Button>
                  <Button
                    as={Link}
                    to="/books?category=1"
                    variant="outline-light"
                    className="btn-clean px-4 py-2"
                  >
                    Sách kỹ thuật & Lập trình
                  </Button>
                </div>
              </Col>
              <Col lg={5} md={6} className="text-center d-none d-md-block">
                <div className="position-relative d-inline-block py-3">
                  <img
                    src="https://m.media-amazon.com/images/I/41xShlnTZTL.jpg"
                    alt="Clean Code"
                    className="rounded-2 hero-book-shadow"
                    style={{
                      width: "180px",
                      height: "250px",
                      objectFit: "cover",
                      transform: "rotate(-6deg)",
                    }}
                  />
                  <img
                    src="https://m.media-amazon.com/images/I/513Y5o-DYtL.jpg"
                    alt="Atomic Habits"
                    className="rounded-2 hero-book-shadow position-absolute"
                    style={{
                      width: "180px",
                      height: "250px",
                      objectFit: "cover",
                      top: "20px",
                      left: "100px",
                      transform: "rotate(4deg)",
                    }}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </Carousel.Item>

        {/* Slide 2: Developer & Tech Classics */}
        <Carousel.Item className="hero-slide-2">
          <Container className="h-100 d-flex align-items-center">
            <Row className="align-items-center g-4 w-100">
              <Col lg={7} md={6}>
                <span className="badge bg-light text-dark px-3 py-2 fw-medium mb-3 rounded-1">
                  Kiến trúc & Công nghệ
                </span>
                <h1 className="display-5 fw-bold text-white mb-3 lh-sm">
                  Xây dựng hệ thống Clean, Bền vững & Mở rộng
                </h1>
                <p className="lead text-white-50 mb-4" style={{ maxWidth: "560px" }}>
                  Các đầu sách kinh điển về tư duy lập trình thực chiến, tối ưu mã nguồn và thiết kế kiến trúc từ các tác giả uy tín thế giới.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Button
                    as={Link}
                    to="/books?category=1"
                    variant="light"
                    className="btn-clean px-4 py-2 text-dark fw-semibold"
                  >
                    Xem sách lập trình <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Col>
              <Col lg={5} md={6} className="d-none d-md-block">
                <div className="d-flex justify-content-center align-items-stretch gap-3">
                  <div
                    className="bg-white p-2 rounded-2 hero-book-shadow text-center d-flex flex-column justify-content-between"
                    style={{ width: "170px", height: "265px" }}
                  >
                    <img
                      src="https://image.slidesharecdn.com/0135957052-thepragmaticprogrammerbydavidthomas-190920211554/95/2019-the-pragmatic-programmer-pdf-your-journey-to-mastery-20th-anniversary-edition-2nd-edition-by-david-thomas-addisonwesley-professional-1-638.jpg?cb=1569014320"
                      alt="The Pragmatic Programmer"
                      className="rounded-1 mb-2 w-100"
                      style={{ height: "185px", objectFit: "cover" }}
                    />
                    <div>
                      <div className="small fw-semibold text-dark text-truncate" title="The Pragmatic Programmer">
                        Pragmatic Prog.
                      </div>
                      <div className="text-secondary small fw-medium">$30.00</div>
                    </div>
                  </div>
                  <div
                    className="bg-white p-2 rounded-2 hero-book-shadow text-center d-flex flex-column justify-content-between"
                    style={{ width: "170px", height: "265px" }}
                  >
                    <img
                      src="https://m.media-amazon.com/images/I/41xShlnTZTL.jpg"
                      alt="Clean Code"
                      className="rounded-1 mb-2 w-100"
                      style={{ height: "185px", objectFit: "cover" }}
                    />
                    <div>
                      <div className="small fw-semibold text-dark text-truncate" title="Clean Code">
                        Clean Code
                      </div>
                      <div className="text-secondary small fw-medium">$25.00</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </Carousel.Item>

        {/* Slide 3: Vouchers & Special Offers */}
        <Carousel.Item className="hero-slide-3">
          <Container className="h-100 d-flex align-items-center">
            <Row className="align-items-center g-4 w-100">
              <Col lg={7} md={6}>
                <span className="badge bg-light text-dark px-3 py-2 fw-medium mb-3 rounded-1">
                  Mã ưu đãi đang áp dụng
                </span>
                <h1 className="display-5 fw-bold text-white mb-3 lh-sm">
                  Nhận ngay ưu đãi khi mua sắm tại Infinia
                </h1>
                <p className="lead text-white-50 mb-4" style={{ maxWidth: "560px" }}>
                  Nhập mã <code className="bg-white text-dark fw-bold px-2 py-1 rounded">SALE10</code> để được giảm 10% cho đơn từ $50, hoặc <code className="bg-white text-dark fw-bold px-2 py-1 rounded">NEWUSER5</code> giảm $5 cho đơn hàng đầu tiên.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Button
                    as={Link}
                    to="/books"
                    variant="light"
                    className="btn-clean px-4 py-2 text-dark fw-semibold"
                  >
                    Mua sắm ngay <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Col>
              <Col lg={5} md={6} className="d-none d-md-block">
                <div className="d-flex flex-column align-items-center gap-3">
                  <div
                    className="bg-white text-dark p-3 rounded-2 shadow-sm w-100"
                    style={{ maxWidth: "320px", border: "1px solid #e2e8f0" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-dark">GIẢM 10%</span>
                      <span className="fw-bold text-dark fs-5">SALE10</span>
                    </div>
                    <div className="text-secondary small">Đơn từ $50.00 • Toàn bộ danh mục</div>
                  </div>
                  <div
                    className="bg-white text-dark p-3 rounded-2 shadow-sm w-100"
                    style={{ maxWidth: "320px", border: "1px solid #e2e8f0" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-secondary">GIẢM $5</span>
                      <span className="fw-bold text-dark fs-5">NEWUSER5</span>
                    </div>
                    <div className="text-secondary small">Đơn từ $20.00 • Khách hàng mới</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </Carousel.Item>
      </Carousel>

      {/* Value Proposition Bar */}
      <Container className="mt-4">
        <Row className="g-3">
          <Col lg={3} sm={6}>
            <div className="border rounded-2 p-3 bg-white h-100 d-flex align-items-center gap-3">
              <FaShippingFast className="text-secondary fs-4 flex-shrink-0" />
              <div>
                <div className="fw-semibold text-dark small">Giao hàng nhanh chóng</div>
                <div className="text-secondary small">Đóng gói cẩn thận, toàn quốc</div>
              </div>
            </div>
          </Col>
          <Col lg={3} sm={6}>
            <div className="border rounded-2 p-3 bg-white h-100 d-flex align-items-center gap-3">
              <FaShieldAlt className="text-secondary fs-4 flex-shrink-0" />
              <div>
                <div className="fw-semibold text-dark small">100% Sách chính hãng</div>
                <div className="text-secondary small">Bản quyền từ NXB uy tín</div>
              </div>
            </div>
          </Col>
          <Col lg={3} sm={6}>
            <div className="border rounded-2 p-3 bg-white h-100 d-flex align-items-center gap-3">
              <FaUndoAlt className="text-secondary fs-4 flex-shrink-0" />
              <div>
                <div className="fw-semibold text-dark small">Đổi trả trong 7 ngày</div>
                <div className="text-secondary small">Hỗ trợ nếu sách có lỗi in ấn</div>
              </div>
            </div>
          </Col>
          <Col lg={3} sm={6}>
            <div className="border rounded-2 p-3 bg-white h-100 d-flex align-items-center gap-3">
              <FaHeadset className="text-secondary fs-4 flex-shrink-0" />
              <div>
                <div className="fw-semibold text-dark small">Hỗ trợ tận tâm</div>
                <div className="text-secondary small">Sẵn sàng giải đáp 24/7</div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Container className="py-5">
        {/* Search */}
        <Row className="mb-4">
          <Col md={6} className="mx-auto">
            <SearchBar
              onSearch={(query) => {
                setSearchQuery(query);
                setSearchPage(1);
              }}
              placeholder="Tìm kiếm sách theo tên hoặc tác giả..."
            />
          </Col>
        </Row>

        {/* Categories */}
        <div className="mb-5">
          <h3 className="fw-bold mb-3 text-dark">Danh mục nổi bật</h3>
          <div className="d-flex flex-wrap gap-2">
            {(categories || []).map((cat) => (
              <Link key={cat.id} to={`/books?category=${cat.id}`} className="text-decoration-none">
                <span className="category-tag">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Books or Search Results */}
        {searchQuery.trim() ? (
          <>
            <h3 className="fw-bold mb-3 text-dark">
              Kết quả tìm kiếm cho "{searchQuery.trim()}"
            </h3>
            <BookGrid books={paginatedSearchBooks} reviewCounts={reviewCounts} />
            <Pagination
              currentPage={searchPage}
              totalPages={totalSearchPages}
              onPageChange={setSearchPage}
            />
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold mb-0 text-dark">Sách đọc nhiều & Nổi bật</h3>
              <Link to="/books" className="text-decoration-none fw-semibold">
                Xem tất cả <FaArrowRight />
              </Link>
            </div>
            <BookGrid books={paginatedFeaturedBooks} reviewCounts={reviewCounts} />
            <Pagination
              currentPage={featuredPage}
              totalPages={totalFeaturedPages}
              onPageChange={setFeaturedPage}
            />
          </>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
