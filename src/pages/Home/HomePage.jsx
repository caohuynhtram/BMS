import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import bookApi from "../../api/bookApi";
import axiosClient from "../../api/axiosClient";
import BookGrid from "../../components/book/BookGrid";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaArrowRight } from "react-icons/fa";

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredBooks = [...books]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="display-4 fw-bold">Welcome to INFINIA STORE</h1>
              <p className="lead">
                Discover your next favorite book from our curated collection.
              </p>
              <Link to="/books">
                <Button variant="light" size="lg" className="fw-bold">
                  Browse All Books <FaArrowRight className="ms-2" />
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        {/* Search */}
        <Row className="mb-4">
          <Col md={6} className="mx-auto">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search books by title..."
            />
          </Col>
        </Row>

        {/* Categories */}
        <div className="mb-5">
          <h3 className="fw-bold mb-3">Categories</h3>
          <div className="d-flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/books?category=${cat.id}`}>
                <Badge bg="secondary" className="px-3 py-2 fs-6">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Books or Search Results */}
        {searchQuery ? (
          <>
            <h3 className="fw-bold mb-3">
              Search Results for "{searchQuery}"
            </h3>
            <BookGrid books={filteredBooks} reviewCounts={reviewCounts} />
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold mb-0">Featured Books</h3>
              <Link to="/books" className="text-decoration-none">
                View All <FaArrowRight />
              </Link>
            </div>
            <BookGrid books={featuredBooks} reviewCounts={reviewCounts} />
          </>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
