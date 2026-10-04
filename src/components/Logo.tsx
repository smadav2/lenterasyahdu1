import { cx } from "@/lib/format";

const LEFT = "M60 2C48 18 14 54 14 92C14 118 35 138 60 138L60 122C43 122 30 110 30 92C30 68 52 44 60 32Z";
const RIGHT = "M60 2C72 18 106 54 106 92C106 118 85 138 60 138L60 122C77 122 90 110 90 92C90 68 68 44 60 32Z";

/** Simbol lentera (tetes cahaya) emas–hijau Lentera Syahdu */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <path d={LEFT} fill="#F5B000" />
      <path d={RIGHT} fill="#2F8F22" />
      <path d="M46 80h14v44H46z" fill="#F5B000" />
      <path d="M60 30h14v50H60z" fill="#2F8F22" />
      <path d="M60 2C66 10 76 22 84 33L74 46C70 40 65 35 60 32Z" fill="#000" opacity=".14" />
      <path d="M46 80h14v6H46z" fill="#000" opacity=".1" />
    </svg>
  );
}

/** Lencana bulat ungu berisi simbol */
export function LogoBadge({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span
      className={cx(
        "bg-brand-radial grid shrink-0 place-items-center rounded-full shadow-md ring-2 ring-white/70",
        className ?? "h-11 w-11",
      )}
    >
      <LogoMark className={markClassName ?? "h-7 w-7"} />
    </span>
  );
}

export function Logo({
  dark = false,
  className,
  compact = false,
}: {
  dark?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoBadge className={compact ? "h-9 w-9" : "h-11 w-11"} markClassName={compact ? "h-6 w-6" : "h-7 w-7"} />
      <span className="flex flex-col leading-none">
        <span className="-mb-0.5 self-end pr-0.5 text-[11px] font-bold italic text-sky-500">Syahdu</span>
        <span
          className={cx(
            "font-extrabold tracking-[0.16em]",
            compact ? "text-base" : "text-[19px]",
            dark ? "text-white" : "text-brand-900",
          )}
        >
          LENTERA
        </span>
      </span>
    </span>
  );
}
