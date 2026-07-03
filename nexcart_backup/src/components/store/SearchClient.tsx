'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { Search, SlidersHorizontal, Star, Plus, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchClientProps {
  initialParams: {
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  };
  categories: any[];
  brands: any[];
}

export default function SearchClient({ initialParams, categories, brands }: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { addToCart } = useCart();

  // Filters State
  const [search, setSearch] = useState(initialParams.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialParams.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category || '');
  const [selectedBrand, setSelectedBrand] = useState(initialParams.brand || '');
  const [minPrice, setMinPrice] = useState(initialParams.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice || '');
  const [rating, setRating] = useState(initialParams.rating || '');
  const [inStock, setInStock] = useState(initialParams.inStock === 'true');
  const [sort, setSort] = useState(initialParams.sort || 'newest');
  const [page, setPage] = useState(parseInt(initialParams.page || '1'));

  // Products Data State
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Build query string and fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.set('search', debouncedSearch);
      if (selectedCategory) queryParams.set('category', selectedCategory);
      if (selectedBrand) queryParams.set('brand', selectedBrand);
      if (minPrice) queryParams.set('minPrice', minPrice);
      if (maxPrice) queryParams.set('maxPrice', maxPrice);
      if (rating) queryParams.set('rating', rating);
      if (inStock) queryParams.set('inStock', 'true');
      if (sort) queryParams.set('sort', sort);
      queryParams.set('page', page.toString());
      queryParams.set('limit', '8');

      // Update URL parameters without pushing to navigation history stacks
      const newUrl = `${pathname}?${queryParams.toString()}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedBrand, minPrice, maxPrice, rating, inStock, sort, page, pathname]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setInStock(false);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">NexCart Catalog</span>
          <h1 className="text-2xl font-bold mt-1 font-display">Collections Grid</h1>
        </div>
        
        {/* Search Input and sorting dropdown */}
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections..."
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-accent"
            />
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-medium text-foreground cursor-pointer"
          >
            <option value="newest">Newest Releases</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Top Rated</option>
          </select>
          
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden rounded-full border border-border bg-card p-2 hover:bg-secondary text-foreground"
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex gap-8 items-start">
        
        {/* SIDEBAR FILTERS (DESKTOP) */}
        <aside className="hidden md:flex flex-col w-64 bg-card border border-border rounded-xl p-6 space-y-6 shrink-0 sticky top-20">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
              Catalog Filters
            </h2>
            <button onClick={resetFilters} className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground">Categories</h3>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                className={`text-left py-1 hover:text-accent font-medium ${selectedCategory === '' ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`text-left py-1 hover:text-accent font-medium ${selectedCategory === cat.slug ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground">Brands</h3>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => { setSelectedBrand(''); setPage(1); }}
                className={`text-left py-1 hover:text-accent font-medium ${selectedBrand === '' ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
              >
                All Brands
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => { setSelectedBrand(brand.slug); setPage(1); }}
                  className={`text-left py-1 hover:text-accent font-medium ${selectedBrand === brand.slug ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="Min"
                className="w-full rounded border border-border bg-background py-1.5 text-center text-xs"
              />
              <span className="text-muted-foreground text-xs">&mdash;</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="Max"
                className="w-full rounded border border-border bg-background py-1.5 text-center text-xs"
              />
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground">Minimum Rating</h3>
            <div className="flex flex-col gap-2">
              {[5, 4, 3].map((stars) => (
                <button
                  key={stars}
                  onClick={() => { setRating(rating === stars.toString() ? '' : stars.toString()); setPage(1); }}
                  className={`flex items-center gap-1.5 text-xs ${rating === stars.toString() ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex text-amber-500">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span>&amp; Up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock availability */}
          <label className="flex items-center gap-2 cursor-pointer py-1 text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Show In Stock Only
          </label>
        </aside>

        {/* PRODUCTS LIST GRID */}
        <div className="flex-1 space-y-8">
          
          {loading ? (
            /* Pulsing skeleton grids */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border bg-card rounded-xl overflow-hidden p-4 space-y-4 animate-pulse">
                  <div className="h-56 w-full rounded-lg bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3.5 w-full bg-muted rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            /* Active products layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div key={prod.id} className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <Link href={`/products/${prod.slug}`} className="relative h-60 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  </Link>

                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">{prod.category?.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-none" />
                          <span className="text-xs font-semibold">{prod.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-xs font-bold tracking-tight mt-1 hover:text-accent font-display line-clamp-1">
                        <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{prod.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/50">
                      <span className="text-xs font-bold">${prod.discountPrice || prod.price}</span>
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground p-1.5 text-foreground transition-all"
                        aria-label="Add to cart"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Zero products condition */
            <div className="text-center py-20 border border-border bg-card rounded-2xl p-6">
              <RotateCcw className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-bold text-foreground font-display">No products found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">We couldn't find matches for your search filters. Try widening your price ranges or changing queries.</p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-full bg-foreground text-background px-6 py-2 text-xs font-bold hover:bg-foreground/90 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/60">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-full border border-border p-2 bg-card text-foreground disabled:opacity-50 hover:bg-secondary cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: pages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-full text-xs font-bold ${page === pageNum ? 'bg-accent text-accent-foreground' : 'border border-border bg-card text-foreground hover:bg-secondary'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(prev => Math.min(pages, prev + 1))}
                disabled={page === pages}
                className="rounded-full border border-border p-2 bg-card text-foreground disabled:opacity-50 hover:bg-secondary cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="ml-auto w-full max-w-xs bg-background p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Filter Options
                </h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-xs font-bold hover:text-accent">
                  Close
                </button>
              </div>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground">Categories</h3>
                <div className="flex flex-col gap-1.5 text-xs">
                  <button
                    onClick={() => { setSelectedCategory(''); setPage(1); }}
                    className={`text-left py-1 hover:text-accent font-medium ${selectedCategory === '' ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                      className={`text-left py-1 hover:text-accent font-medium ${selectedCategory === cat.slug ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Brands */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground">Brands</h3>
                <div className="flex flex-col gap-1.5 text-xs">
                  <button
                    onClick={() => { setSelectedBrand(''); setPage(1); }}
                    className={`text-left py-1 hover:text-accent font-medium ${selectedBrand === '' ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => { setSelectedBrand(brand.slug); setPage(1); }}
                      className={`text-left py-1 hover:text-accent font-medium ${selectedBrand === brand.slug ? 'text-accent font-semibold' : 'text-muted-foreground'}`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground">Price</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    placeholder="Min"
                    className="w-full rounded border border-border bg-card py-1.5 text-center text-xs"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    placeholder="Max"
                    className="w-full rounded border border-border bg-card py-1.5 text-center text-xs"
                  />
                </div>
              </div>

              {/* Mobile Rating */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground">Min Rating</h3>
                <div className="flex flex-col gap-2">
                  {[5, 4, 3].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => { setRating(rating === stars.toString() ? '' : stars.toString()); setPage(1); }}
                      className={`flex items-center gap-1.5 text-xs ${rating === stars.toString() ? 'text-accent font-bold' : 'text-muted-foreground'}`}
                    >
                      <div className="flex text-amber-500">
                        {Array.from({ length: stars }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <span>&amp; Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Stock */}
              <label className="flex items-center gap-2 cursor-pointer py-1 text-xs font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                Show In Stock Only
              </label>
            </div>

            <div className="pt-6 border-t border-border mt-6 flex gap-2">
              <button
                onClick={resetFilters}
                className="w-full rounded-md border border-border py-2 text-xs font-bold hover:bg-secondary"
              >
                Clear
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-md bg-accent text-accent-foreground py-2 text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
