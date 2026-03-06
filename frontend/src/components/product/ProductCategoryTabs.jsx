import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

function ProductCategoryTabs({ activeCategory, onSelect, categories, products, getCategoryIcon }) {
  return (
    <Tabs
      activeKey={activeCategory}
      onSelect={onSelect}
      className="mb-4"
      role="tablist"
      aria-label="Product categories"
    >
      {categories.map((category) => {
        const categoryCount = products.filter(p =>
          p.category_id && p.category_id.toString() === category.id.toString()
        ).length;
        return (
          <Tab
            key={category.id}
            eventKey={category.id}
            title={
              <>
                {getCategoryIcon(category.name)}
                <span className="ms-2">{category.name} ({categoryCount})</span>
              </>
            }
          />
        );
      })}
    </Tabs>
  );
}

export default ProductCategoryTabs;
