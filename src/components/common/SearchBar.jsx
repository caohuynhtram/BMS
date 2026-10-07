import React, { useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
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
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
        />
        <Button variant="outline-primary" type="submit">
          <FaSearch />
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
