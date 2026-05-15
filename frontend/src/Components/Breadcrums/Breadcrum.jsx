import React from 'react';
import './Breadcrum.css';
import arrowIcon from '../Assets/back_arrow.png'; // Fixed import

const Breadcrum = (props) => {
  const { product } = props;
  
  return (
    <div className="breadcrum">
      HOME <img src={arrowIcon} alt="arrow" /> SHOP{" "}
      <img src={arrowIcon} alt="arrow" /> {product.category}{" "}
      <img src={arrowIcon} alt="arrow" /> {product.name}
    </div>
  );
};

export default Breadcrum;