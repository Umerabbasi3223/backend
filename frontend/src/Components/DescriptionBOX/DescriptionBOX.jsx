import React from "react";
import "./DescriptionBOX.css";

const DescriptionBOX = ({ description, category, date }) => {
  return (
    <div className="descriptionbox">
      <div className="descriptionbox-navigator">
        <div className="descriptionbox-nav-box">Description</div>
        <div className="descriptionbox-nav-box fade">Reviews (122)</div>
      </div>
      <div className="descriptionbox-description">
        <p>
          {description || `A premium ${category || 'product'} crafted with care and attention to detail.`}
        </p>
        <p>
          This product offers excellent value for money with high-quality materials and construction.
          Perfect for everyday use or special occasions.
        </p>
        {date && (
          <p className="product-date">
            <small>Added on: {new Date(date).toLocaleDateString()}</small>
          </p>
        )}
      </div>
    </div>
  );
};

export default DescriptionBOX;