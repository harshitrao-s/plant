"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { createProject, deleteProject, fetchProjects, updateProject } from "@/store/projectsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const projects = useAppSelector((state) => state.projects);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (auth.status === "ready" && !auth.user) {
      router.replace("/login");
      return;
    }
    if (auth.status === "ready" && auth.user) {
      dispatch(fetchProjects());
    }
  }, [auth.status, auth.user, dispatch, router]);

  async function onCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const action = await dispatch(
      createProject({
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
      }),
    );
    if (createProject.fulfilled.match(action)) {
      form.reset();
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <div className="page-intro">
          <p className="eyebrow">Your workspace</p>
          <h1>Projects</h1>
          <p className="muted">
            Each project is private to your account. Open one to manage its tasks.
          </p>
        </div>

        <form className="panel stack" onSubmit={onCreate}>
          <h2>New project</h2>
          <label>
            Title
            <input name="title" required maxLength={120} placeholder="Website redesign" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              placeholder="What is this project for?"
            />
          </label>
          <button className="btn primary" type="submit">
            Create project
          </button>
        </form>

        {projects.error && <p className="form-error">{projects.error}</p>}
        {projects.status === "loading" && <p className="muted">Loading projects…</p>}

        {projects.status === "ready" && projects.items.length === 0 && (
          <div className="empty">
            <h2>No projects yet</h2>
            <p>Create the first one above. Tasks live inside a project.</p>
          </div>
        )}

        <div className="project-grid">
          {projects.items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              editing={editing === project.id}
              onEdit={() => setEditing(project.id)}
              onCancel={() => setEditing(null)}
              onSave={async (title, description) => {
                const action = await dispatch(
                  updateProject({ id: project.id, title, description }),
                );
                if (updateProject.fulfilled.match(action)) setEditing(null);
              }}
              onDelete={() => {
                if (confirm(`Delete “${project.title}” and all of its tasks?`)) {
                  dispatch(deleteProject(project.id));
                }
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project, editing, onEdit, onCancel, onSave, onDelete }) {
  if (editing) {
    return (
      <article className="project-card">
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSave(String(data.get("title") || ""), String(data.get("description") || ""));
          }}
        >
          <label>
            Title
            <input name="title" required defaultValue={project.title} />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} defaultValue={project.description} />
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
      </article>
    );
  }

  return (
    <article className="project-card">
      <p className="task-count">
        {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
      </p>
      <h2>
        <Link href={`/projects/${project.id}`}>{project.title}</Link>
      </h2>
      <p className="muted">{project.description || "No description yet."}</p>
      <div className="row">
        <Link className="btn primary" href={`/projects/${project.id}`}>
          Open
        </Link>
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
