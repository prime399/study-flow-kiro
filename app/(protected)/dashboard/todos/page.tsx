import { TodoBoard } from "./_components/todo-board"
import { FloatingParticles } from "@/components/floating-particles"
import { SpookyGhost } from "@/components/spooky-ghost"

export default function TodosPage() {
  return (
    <>
      {/* Halloween Effects Layer */}
      <FloatingParticles className="fixed inset-0 z-0" />
      <SpookyGhost className="fixed bottom-4 right-4 w-20 h-20 z-10" />

      <div className="relative z-10 space-y-6">
        <TodoBoard halloweenGlow={true} />
      </div>
    </>
  )
}

