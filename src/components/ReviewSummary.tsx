import { GOOGLE_BUSINESS_URL } from "@/lib/seo";
import { STAR_PATH, initialsOf } from "@/lib/reviews";

interface Props {
  /** Every Google review on record: with or without text, good or bad. */
  reviews: { display_name: string | null; rating: number | null }[];
  isEN: boolean;
}

function StarRow({ fill }: { fill: string }) {
  return (
    <span className="flex gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill={fill} aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * The score above the carousel: a few faces, the stars, and the count, all one
 * link to the Business Profile where every number can be checked.
 *
 * The average is rounded down, never up. A 4.96 shown as 5,0 is a small lie in
 * the one place a visitor is deciding whether to trust the rest of the page.
 */
export default function ReviewSummary({ reviews, isEN }: Props) {
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);
  if (rated.length === 0) return null;

  const average = Math.floor((rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length) * 10) / 10;
  const score = average.toLocaleString(isEN ? "en-GB" : "pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const count = rated.length;
  const label = isEN
    ? `${count} ${count === 1 ? "review" : "reviews"} on Google`
    : `${count} ${count === 1 ? "avaliação" : "avaliações"} no Google`;

  const faces = rated.slice(0, 4);
  const rest = count - faces.length;

  return (
    <a
      href={GOOGLE_BUSINESS_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${score} ${isEN ? "out of 5" : "em 5"}, ${label}`}
      className="group mx-auto flex w-fit items-center gap-3.5 rounded-full py-2 pl-2 pr-5 border border-white/[0.08] hover:border-brand-gold/30 transition-colors duration-300"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <span className="flex -space-x-2" aria-hidden="true">
        {faces.map((r, i) => (
          <span
            key={i}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-gold ring-2 ring-black"
            style={{ background: "linear-gradient(145deg, #232327 0%, #0c0c0e 100%)" }}
          >
            {/* One letter: the overlap covers the right third of each face,
                which clipped a second initial into a different letter. */}
            {initialsOf(r.display_name).charAt(0)}
          </span>
        ))}
        {rest > 0 && (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black ring-2 ring-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            +{rest}
          </span>
        )}
      </span>

      <span className="flex flex-col items-start leading-tight" aria-hidden="true">
        <span className="flex items-center gap-2">
          {/* Grey row underneath, gold row clipped to the score on top, so a
              4,6 shows four and a bit stars rather than a rounded five. */}
          <span className="relative inline-flex">
            <StarRow fill="#27272a" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(average / 5) * 100}%` }}>
              <StarRow fill="#C9A84C" />
            </span>
          </span>
          <span className="text-white text-sm font-bold tabular-nums">{score}</span>
        </span>
        <span className="text-zinc-500 text-xs mt-1 group-hover:text-zinc-300 transition-colors">{label} ↗</span>
      </span>
    </a>
  );
}
