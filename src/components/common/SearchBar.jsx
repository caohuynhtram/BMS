import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value === "") {
      onSearch("");
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="w-100">
      <div className="position-relative d-flex align-items-center">
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="pe-5 shadow-sm"
          style={{ borderRadius: "0.5rem" }}
        />
        <Button
          type="submit"
          variant="link"
          className="position-absolute end-0 top-50 translate-middle-y text-primary border-0 p-2 me-1 d-flex align-items-center"
          style={{ zIndex: 5, background: "transparent" }}
          title="Search"
        >
          <FaSearch />
        </Button>
      </div>
    </Form>
  );
};

export default SearchBar;
