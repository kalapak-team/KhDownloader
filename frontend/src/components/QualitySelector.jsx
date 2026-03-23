export default function QualitySelector({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            "rounded-full border border-borderColor bg-bgSurface px-3 py-2 text-sm text-textSecondary transition hover:border-[rgba(255,59,48,0.5)]",
            value === opt.value ? "border-transparent bg-accentGradient text-textPrimary" : "",
          ].join(" ")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
