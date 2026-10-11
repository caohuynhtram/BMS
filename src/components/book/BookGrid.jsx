import React from "react";
import { Row, Col } from "react-bootstrap";
import BookCard from "./BookCard";

const BookGrid = ({ books, reviewCounts }) => {
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <h5>No books found</h5>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
      {books.map((book) => (
        <Col key={book.id}>
          <BookCard
            book={book}
            reviewCount={reviewCounts ? (reviewCounts[String(book.id)] || 0) : undefined}
          />
        </Col>
      ))}
    </Row>
  );
};

export default BookGrid;
