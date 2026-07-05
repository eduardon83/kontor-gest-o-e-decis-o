export function Livre({ inicial, size = 40 }: { inicial: string; size?: number }) {
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-sm border font-serif"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--navy)",
        color: "var(--gold)",
        borderColor: "var(--gold)",
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {inicial}
    </div>
  );
}
