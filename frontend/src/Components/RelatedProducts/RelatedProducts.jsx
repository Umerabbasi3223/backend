import React from "react";

import "./RelatedProducts.css";
import Item from "../Item/Item";

const RelatedProducts = ({ products = [] }) => {
  if (!products || products.length === 0) {
    return (
      <div className="relatedproducts">
        <h1>Related Products</h1>
        <p className="no-related">No related products found.</p>
      </div>
    );
  }

  return (
    <div className="relatedproducts">
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {products.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
            category={item.category}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;