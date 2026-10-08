import React from "react";
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container className="text-center">
        <p className="mb-1">&copy; {new Date().getFullYear()} INFINIA STORE. All rights reserved.</p>
        <p className="mb-0 text-secondary small">
          FER202 ReactJS Assignment
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
