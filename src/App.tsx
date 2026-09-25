import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">DS-Engine</h1>
      <p className="max-w-prose text-muted-foreground">
        Concept UI for human supervision of AI agent work. Work in progress.
      </p>
      <Button asChild>
        <a href="./storybook/">Open Storybook</a>
      </Button>
    </main>
  )
}
