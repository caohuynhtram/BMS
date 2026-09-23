import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="container text-center py-5">
      <h1>Hello World</h1>
      <button className="btn btn-danger mt-3" onClick={() => navigate('/login')}>
        Đăng Xuất
      </button>
    </div>
  );
}
