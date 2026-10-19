import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import bookApi from "../../api/bookApi";
import axiosClient from "../../api/axiosClient";
import BookGrid from "../../components/BookGrid";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import { filterBooks, BOOK_STATUS } from "../../utils/helpers";

const ITEMS_PER_PAGE = 8;

// Tránh tính toán lại danh sách khi các state khác (không liên quan) thay đổi.
const BookListPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [booksRes, catRes, reviewsRes] = await Promise.all([
          bookApi.getAll(),
          bookApi.getCategories(),
          axiosClient.get("/reviews"),
        ]);

        if (!isMounted) return;

        const activeCategories = (catRes.data || []).filter(
          (c) => !c.isDeleted && c.status !== "Inactive"
        );
        const activeCategoryIds = new Set(activeCategories.map((c) => String(c.id)));
        const activeBooks = (booksRes.data || [])
          .filter((b) => !b.isDeleted && b.status !== BOOK_STATUS.INACTIVE)
          .map((b) => ({
            ...b,
            categoryId:
              !b.categoryId || !activeCategoryIds.has(String(b.categoryId))
                ? "uncategorized"
                : String(b.categoryId),
          }));

        setBooks(activeBooks);
        setCategories(activeCategories);

        const counts = {};
        (reviewsRes.data || []).forEach((r) => {
          const key = String(r.bookId);
          counts[key] = (counts[key] || 0) + 1;
        });
        setReviewCounts(counts);
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

  const filtered = useMemo(() => {
    return filterBooks(books, {
      category: selectedCategory,
      search: searchQuery,
      sort: sortBy,
    });
  }, [books, selectedCategory, searchQuery, sortBy]);

  const totalPages = useMemo(() => {
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  }, [filtered.length]);

  const paginatedBooks = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4 text-dark">Tủ sách Infinia</h2>
      <Row className="mb-4 g-3">
        <Col md={4}>
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="shadow-sm border"
            style={{ borderRadius: "0.5rem" }}
          >
            <option value="">Tất cả danh mục</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option value="uncategorized">Chưa phân loại</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="shadow-sm border"
            style={{ borderRadius: "0.5rem" }}
          >
            <option value="">Sắp xếp theo</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
          </Form.Select>
        </Col>
      </Row>

      <p className="text-muted mb-3">
        Hiển thị {paginatedBooks.length} trên tổng số {filtered.length} cuốn sách
      </p>

      <BookGrid books={paginatedBooks} reviewCounts={reviewCounts} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default BookListPage;
