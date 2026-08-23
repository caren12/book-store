export default function SearchFilterBar({ filters, genres, onChange, onReset }) {
  const handle = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <div className="bg-parchment border border-ink/15 rounded-sm p-4 mb-6 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
      <div className="col-span-2 md:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Search</label>
        <input
          type="text"
          value={filters.q}
          onChange={handle("q")}
          placeholder="Title, author, genre…"
          className="w-full border border-ink/30 rounded-sm px-2 py-1.5 bg-paper text-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Genre</label>
        <select value={filters.genre} onChange={handle("genre")} className="w-full border border-ink/30 rounded-sm px-2 py-1.5 bg-paper text-sm">
          <option value="">All</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Section</label>
        <select value={filters.section} onChange={handle("section")} className="w-full border border-ink/30 rounded-sm px-2 py-1.5 bg-paper text-sm">
          <option value="">Both</option>
          <option value="store">Shop</option>
          <option value="library">Library</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Min $</label>
        <input type="number" min="0" value={filters.min_price} onChange={handle("min_price")} className="w-full border border-ink/30 rounded-sm px-2 py-1.5 bg-paper text-sm" />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">Sort</label>
        <select value={filters.sort} onChange={handle("sort")} className="w-full border border-ink/30 rounded-sm px-2 py-1.5 bg-paper text-sm">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="col-span-2 md:col-span-6 text-right">
        <button onClick={onReset} className="text-xs text-ink/60 underline hover:text-brass">
          Reset filters
        </button>
      </div>
    </div>
  );
}
