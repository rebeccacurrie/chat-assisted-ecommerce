import { useState, useMemo } from "react";
import { products } from "./data/products.ts";
import type { Category, SortOption } from "./data/products.ts";
import { filterProducts, sortProducts, DEFAULT_FILTERS } from "./utils/filterSort.ts";
import type { Command, ChatMessage } from "./utils/types.ts";
import { sendCommand } from "./utils/api.ts";
import { addLog } from "./utils/logging.ts";
import { FilterPanel } from "./components/FilterPanel.tsx";
import { ProductGrid } from "./components/ProductGrid.tsx";
import { ChatPanel } from "./components/ChatPanel.tsx";
import { MetamorphicPanel } from "./components/MetamorphicPanel.tsx";

export default function App() {
  // Filter + sort state
  const [category, setCategory] = useState<Category | null>(null);
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastCommand, setLastCommand] = useState<Command | null>(null);
  const [loading, setLoading] = useState(false);

  const displayed = useMemo(() => {
    const filtered = filterProducts(products, { category, maxPrice, minRating, inStockOnly });
    return sortProducts(filtered, sort);
  }, [category, maxPrice, minRating, inStockOnly, sort]);

  const clearFilters = () => {
    setCategory(DEFAULT_FILTERS.category);
    setMaxPrice(DEFAULT_FILTERS.maxPrice);
    setMinRating(DEFAULT_FILTERS.minRating);
    setInStockOnly(DEFAULT_FILTERS.inStockOnly);
    setSort(null);
  };

  const handleChatSend = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const cmd = await sendCommand(text);
      setLastCommand(cmd);

      // Apply returned command to existing UI state
      if (cmd.filters.category !== undefined) {
        setCategory(cmd.filters.category);
      }
      if (cmd.filters.maxPrice !== undefined && cmd.filters.maxPrice !== null) {
        setMaxPrice(cmd.filters.maxPrice);
      } else if (cmd.filters.maxPrice === null) {
        setMaxPrice(DEFAULT_FILTERS.maxPrice);
      }
      if (cmd.filters.minRating !== undefined) {
        setMinRating(cmd.filters.minRating);
      }
      if (cmd.filters.inStockOnly !== undefined && cmd.filters.inStockOnly !== null) {
        setInStockOnly(cmd.filters.inStockOnly);
      } else if (cmd.filters.inStockOnly === null) {
        setInStockOnly(DEFAULT_FILTERS.inStockOnly);
      }
      if (cmd.sort !== undefined) {
        setSort(cmd.sort);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: cmd.explanation }]);

      addLog({
        timestamp: new Date().toISOString(),
        basePrompt: text,
        relationName: "CHAT",
        variantPrompt: text,
        returnedCommand: cmd,
        uiSnapshot: null,
        verdict: "COMMAND",
        reason: cmd.explanation,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Chat-Assisted Ecommerce Case Study</h1>
      </header>

      <div className="layout">
        <FilterPanel
          category={category}
          maxPrice={maxPrice}
          minRating={minRating}
          inStockOnly={inStockOnly}
          sort={sort}
          onCategoryChange={setCategory}
          onMaxPriceChange={setMaxPrice}
          onMinRatingChange={setMinRating}
          onInStockOnlyChange={setInStockOnly}
          onSortChange={setSort}
          onClear={clearFilters}
        />

        <main className="main">
          <p className="count-line">
            Showing {displayed.length} of {products.length} products
          </p>
          <ProductGrid products={displayed} />
        </main>

        <ChatPanel
          messages={messages}
          lastCommand={lastCommand}
          loading={loading}
          onSend={handleChatSend}
        />
      </div>

      <MetamorphicPanel />
    </div>
  );
}
