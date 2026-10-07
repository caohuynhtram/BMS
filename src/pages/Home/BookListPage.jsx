import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import bookApi from "../../api/bookApi";
import axiosClient from "../../api/axiosClient";
import BookGrid from "../../components/book/BookGrid";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ITEMS_PER_PAGE = 8;

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
    const fetchData = async () => {
      try {
        const [booksRes, catRes, reviewsRes] = await Promise.all([
          bookApi.getAll(),
          bookApi.getCategories(),
          axiosClient.get("/reviews"),
        ]);
        setBooks(booksRes.data);
        setCategories(catRes.data);
        // Count reviews per book
        const counts = {};
        reviewsRes.data.forEach((r) => {
          const key = String(r.bookId);
          counts[key] = (counts[key] || 0) + 1;
        });
        setReviewCounts(counts);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter & Sort
  let filtered = [...books];

  if (searchQuery) {
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedCategory) {
    filtered = filtered.filter(
      (book) => String(book.categoryId) === String(selectedCategory)
    );
  }

  if (sortBy === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBooks = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">Book Catalog</h2>
      <Row className="mb-4 g-3">
        <Col md={4}>
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search by title or author..."
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rating</option>
          </Form.Select>
        </Col>
      </Row>

      <p className="text-muted mb-3">
        Showing {paginatedBooks.length} of {filtered.length} books
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
