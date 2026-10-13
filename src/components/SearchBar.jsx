import { useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Form, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ onSearch, placeholder = "Tìm kiếm..." }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSearch(query.trim());
    },
    [onSearch, query]
  );

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value.trim());
    },
    [onSearch]
  );

  return (
    <Form onSubmit={handleSubmit} noValidate className="w-100">
      <div className="position-relative d-flex align-items-center">
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="pe-5 shadow-sm border"
          style={{ borderRadius: "0.5rem" }}
        />
        <Button
          type="submit"
          variant="link"
          className="position-absolute end-0 top-50 translate-middle-y text-primary border-0 p-2 me-1 d-flex align-items-center"
          style={{ zIndex: 5, background: "transparent" }}
          title="Tìm kiếm"
          onClick={() => inputRef.current?.focus()}
        >
          <FaSearch />
        </Button>
      </div>
    </Form>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchBar;
