import NotedFull from "@/public/icons/noted-full.svg";

export default function NotedLogo({ height }: { height: number }) {
  return (
    <span className="flex items-center">
      <NotedFull height={height} className={`fill-foreground`} />
    </span>
  );
}
