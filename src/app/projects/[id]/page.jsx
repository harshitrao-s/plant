import { Suspense } from "react";
import { TaskBoard } from "./task-board";

export const metadata = {
  title: "Tasks · Mini Project Manager",
};

export default function ProjectTasksPage() {
  return (
    <Suspense fallback={<main className="page">Loading tasks…</main>}>
      <TaskBoard />
    </Suspense>
  );
}
