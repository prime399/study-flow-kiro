export default function Logo({
  variant = "default",
}: {
  variant?: "default" | "small" | "large"
}) {
  if (variant === "small") {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
        <span className="text-lg font-bold">
          <span className="text-primary">S</span>
          <span className="text-primary">F</span>
        </span>
      </div>
    )
  }

  if (variant === "large") {
    return (
      <h1 className="text-3xl font-bold tracking-tight">
        Study<span className="text-primary">Flow</span>
      </h1>
    )
  }

  return (
    <h1 className="text-2xl font-bold tracking-tight">
      Study<span className="text-primary">Flow</span>
    </h1>
  )
}
