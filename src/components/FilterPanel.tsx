import { CATEGORIES } from "../data/products.ts";
import type { Category, SortOption } from "../data/products.ts";

interface Props {
  category: Category | null;
  maxPrice: number;
  minRating: number | null;
  inStockOnly: boolean;
  sort: SortOption | null;
  onCategoryChange: (v: Category | null) => void;
  onMaxPriceChange: (v: number) => void;
  onMinRatingChange: (v: number | null) => void;
  onInStockOnlyChange: (v: boolean) => void;
  onSortChange: (v: SortOption | null) => void;
  onClear: () => void;
}

export function FilterPanel(props: Props) {
  return (
    <aside className="sidebar">
      <h2>Filters</h2>

      <label className="field-label">
        Category
        <select
          value={props.category ?? ""}
          onChange={(e) =>
            props.onCategoryChange(e.target.value ? (e.target.value as Category) : null)
          }
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Max Price ($)
        <input
          type="number"
          min={0}
          max={500}
          value={props.maxPrice}
          onChange={(e) => props.onMaxPriceChange(Number(e.target.value))}
        />
      </label>

      <label className="field-label">
        Minimum Rating
        <select
          value={props.minRating ?? ""}
          onChange={(e) =>
            props.onMinRatingChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Any</option>
          <option value="3">3.0+</option>
          <option value="3.5">3.5+</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
        </select>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={props.inStockOnly}
          onChange={(e) => props.onInStockOnlyChange(e.target.checked)}
        />
        In stock only
      </label>

      <button className="clear-btn" onClick={props.onClear}>Clear Filters</button>

      <hr />

      <label className="field-label">
        Sort
        <select
          value={props.sort ?? ""}
          onChange={(e) =>
            props.onSortChange(e.target.value ? (e.target.value as SortOption) : null)
          }
        >
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Rating: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </label>
    </aside>
  );
}
