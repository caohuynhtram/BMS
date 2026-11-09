import PropTypes from "prop-types";
import { Row, Col } from "react-bootstrap";
import BookCard from "./BookCard";

const BookGrid = ({ books = [], reviewCounts = {} }) => {
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <h5>No books found</h5>
        <p>Try searching with different keywords or adjust your filters.</p>
      </div>
    );
  }

  return (
    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
      {(books || []).map((book) => (
        <Col key={book.id}>
          <BookCard
            book={book}
            reviewCount={reviewCounts ? reviewCounts[String(book.id)] : undefined}
          />
        </Col>
      ))}
    </Row>
  );
};

BookGrid.propTypes = {
  books: PropTypes.arrayOf(PropTypes.object).isRequired,
  reviewCounts: PropTypes.object,
};

export default BookGrid;
