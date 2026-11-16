"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { STATUS_COLUMNS } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/store/tasksSlice";

export function TaskBoard() {
  const params = useParams();
  const projectId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const tasks = useAppSelector((state) => state.tasks);
  const [projectTitle, setProjectTitle] = useState("Project");
  const [projectDescription, setProjectDescription] = useState("");
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(null);

  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "dueDate";

  useEffect(() => {
    if (auth.status === "ready" && !auth.user) {
      router.replace("/login");
      return;
    }
    if (auth.status !== "ready" || !auth.user) return;
    let cancelled = false;

    api(`/api/projects/${projectId}`)
      .then((data) => {
        if (cancelled) return;
        setProjectTitle(data.project.title);
        setProjectDescription(data.project.description);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });

    dispatch(fetchTasks({ projectId, status, sort }));
    return () => {
      cancelled = true;
    };
  }, [auth.status, auth.user, dispatch, projectId, router, status, sort]);

  function setFilter(next) {
    const query = new URLSearchParams(searchParams.toString());
    const values = { status, sort, ...next };
    if (values.status) query.set("status", values.status);
    else query.delete("status");
    query.set("sort", values.sort);
    router.replace(`/projects/${projectId}?${query.toString()}`);
  }

  async function onCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const due = String(data.get("dueDate") || "");
    const action = await dispatch(
      createTask({
        projectId,
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        status: String(data.get("status") || "todo"),
        dueDate: due || null,
      }),
    );
    if (createTask.fulfilled.match(action)) {
      form.reset();
      // Refetch so the new task lands in the right place under the active sort.
      dispatch(fetchTasks({ projectId, status, sort }));
    }
  }

  const visible = status ? tasks.items.filter((task) => task.status === status) : tasks.items;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link className="back-link" href="/projects">
          ← All projects
        </Link>
        {missing ? (
          <div className="empty">
            <h1>Project not found</h1>
            <p>This project is missing, or it belongs to another account.</p>
          </div>
        ) : (
          <>
            <div className="page-intro">
              <p className="eyebrow">Tasks</p>
              <h1>{projectTitle}</h1>
              <p className="muted">{projectDescription || "No description yet."}</p>
            </div>

            <form className="filters" onSubmit={(event) => event.preventDefault()}>
              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => setFilter({ status: event.target.value })}
                >
                  <option value="">All</option>
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Sort by
                <select value={sort} onChange={(event) => setFilter({ sort: event.target.value })}>
                  <option value="dueDate">Due date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                  <option value="createdAt">Created</option>
                </select>
              </label>
            </form>

            <form className="panel stack" onSubmit={onCreate}>
              <h2>New task</h2>
              <div className="form-grid">
                <label>
                  Title
                  <input name="title" required placeholder="Write the brief" />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue="todo">
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <label>
                  Due date
                  <input name="dueDate" type="date" />
                </label>
              </div>
              <label>
                Description
                <textarea name="description" rows={2} placeholder="Optional details" />
              </label>
              <button className="btn primary" type="submit">
                Add task
              </button>
            </form>

            {tasks.error && <p className="form-error">{tasks.error}</p>}
            {tasks.status === "loading" && <p className="muted">Loading tasks…</p>}
            {tasks.status === "ready" && visible.length === 0 && (
              <div className="empty">
                <h2>No tasks in this view</h2>
                <p>Add a task, or clear the status filter.</p>
              </div>
            )}

            <div className="board">
              {STATUS_COLUMNS.filter((column) => !status || column.status === status).map(
                (column) => {
                  const columnTasks = visible.filter((task) => task.status === column.status);
                  return (
                    <section key={column.status} className={`column column-${column.status}`}>
                      <header>
                        <h2>{column.label}</h2>
                        <span>{columnTasks.length}</span>
                      </header>
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          editing={editing === task.id}
                          onEdit={() => setEditing(task.id)}
                          onCancel={() => setEditing(null)}
                          onSave={async (input) => {
                            const action = await dispatch(updateTask({ id: task.id, ...input }));
                            if (updateTask.fulfilled.match(action)) {
                              setEditing(null);
                              dispatch(fetchTasks({ projectId, status, sort }));
                            }
                          }}
                          onDelete={() => {
                            if (confirm(`Delete “${task.title}”?`)) {
                              dispatch(deleteTask(task.id));
                            }
                          }}
                        />
                      ))}
                    </section>
                  );
                },
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TaskCard({ task, editing, onEdit, onCancel, onSave, onDelete }) {
  if (editing) {
    return (
      <form
        className="task-card stack"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const due = String(data.get("dueDate") || "");
          onSave({
            title: String(data.get("title") || ""),
            description: String(data.get("description") || ""),
            status: String(data.get("status") || "todo"),
            dueDate: due || null,
          });
        }}
      >
        <label>
          Title
          <input name="title" required defaultValue={task.title} />
        </label>
        <label>
          Description
          <textarea name="description" rows={2} defaultValue={task.description} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={task.status}>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Due date
          <input name="dueDate" type="date" defaultValue={task.dueDate ?? ""} />
        </label>
        <div className="row">
          <button className="btn primary" type="submit">
            Save
          </button>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="task-card">
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <p className="due">{task.dueDate ? `Due ${task.dueDate}` : "No due date"}</p>
      <div className="row">
        <button className="btn ghost" type="button" onClick={onEdit}>
          Edit
        </button>
        <button className="btn danger" type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}
