import Link from "next/link";

export default function Home() {
  return (
    <div className="landing">
      <header className="topbar landing-bar">
        <span className="wordmark">Mini Project Manager</span>
        <div className="row">
          <Link className="btn ghost" href="/login">
            Log in
          </Link>
          <Link className="btn primary" href="/signup">
            Sign up
          </Link>
        </div>
      </header>
      <main className="hero">
        <p className="eyebrow">Projects, tasks, and a login that stays yours</p>
        <h1>Keep each project in its own notebook.</h1>
        <p className="lede">
          Sign up with email and password, then create projects and the tasks inside them.
          Status, due dates, filters, and sorting stay on the server, and every record is
          tied to your account.
        </p>
        <div className="row">
          <Link className="btn primary" href="/signup">
            Start a workspace
          </Link>
          <Link className="btn ghost" href="/login">
            I already have an account
          </Link>
        </div>
        <section className="feature-grid">
          <article>
            <h2>Authentication</h2>
            <p>Signup and login issue a JWT. API routes reject requests that do not carry it.</p>
          </article>
          <article>
            <h2>Projects</h2>
            <p>A project has a title and a description. You only see the ones you created.</p>
          </article>
          <article>
            <h2>Tasks</h2>
            <p>Create, edit, and delete tasks. Filter by status and sort by due date.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
