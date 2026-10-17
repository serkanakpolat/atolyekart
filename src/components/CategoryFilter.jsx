// Seçili kategori App'te tutulur; null = "Tümü".
export default function CategoryFilter({ categories, selected, onSelect }) {
  const options = [{ value: null, label: 'Tümü' }, ...categories.map((c) => ({ value: c, label: c }))]

  return (
    <nav className="category-filter" aria-label="Kategoriye göre filtrele">
      {options.map(({ value, label }) => (
        <button
          key={label}
          type="button"
          className={`btn ${selected === value ? 'btn--primary' : 'btn--secondary'}`}
          aria-pressed={selected === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
