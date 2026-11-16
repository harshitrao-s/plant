import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, signToken } from "./auth.js";
import { connectDB } from "./db.js";
import { Project, Task, User, publicProject, publicTask, publicUser } from "./models.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

/* --------------------------------------------------------------- validation */

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(1, "Password is required."),
});

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  description: z.string().trim().max(2000, "Description is too long.").optional().default(""),
});

const taskStatus = z.enum(["todo", "in-progress", "done"]);

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160, "Title is too long."),
  description: z.string().trim().max(2000, "Description is too long.").optional().default(""),
  status: taskStatus.optional().default("todo"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD.")
    .nullable()
    .optional(),
});

const sortFields = ["dueDate", "title", "status", "createdAt"];
const statusRank = { todo: 0, "in-progress": 1, done: 2 };

function fail(error) {
  return error.issues[0]?.message || "Invalid input.";
}

function isId(id) {
  return mongoose.isValidObjectId(id);
}

/* ------------------------------------------------------------------- health */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* --------------------------------------------------------------------- auth */

app.post("/api/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({ name: parsed.data.name, email, password });
  const token = signToken(user._id.toString());
  res.status(201).json({ user: publicUser(user), token });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = signToken(user._id.toString());
  res.json({ user: publicUser(user), token });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(401).json({ message: "Account not found." });
    return;
  }
  res.json({ user: publicUser(user) });
});

/* ----------------------------------------------------------------- projects */

app.get("/api/projects", requireAuth, async (req, res) => {
  const userId = req.userId;                               // gave project by id 
  const projects = await Project.find({ user: userId }).sort({ updatedAt: -1 }).lean();
  const counts = await Task.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$project", count: { $sum: 1 } } },
  ]);
  const countByProject = new Map(counts.map((row) => [row._id.toString(), row.count]));
  res.json({
    projects: projects.map((project) =>
      publicProject(project, countByProject.get(project._id.toString()) ?? 0),
    ),
  });
});

app.post("/api/projects", requireAuth, async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const project = await Project.create({ ...parsed.data, user: req.userId });
  res.status(201).json({ project: publicProject(project.toObject(), 0) });
});

app.get("/api/projects/:id", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }
  const project = await Project.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }
  const taskCount = await Task.countDocuments({ project: project._id });
  res.json({ project: publicProject(project, taskCount) });
});

app.patch("/api/projects/:id", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    parsed.data,
    { new: true },
  ).lean();
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }
  const taskCount = await Task.countDocuments({ project: project._id });
  res.json({ project: publicProject(project, taskCount) });
});

app.delete("/api/projects/:id", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }
  const userId = req.userId;
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: userId });
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }
  await Task.deleteMany({ project: project._id, user: userId });
  res.json({ ok: true });
});

/* -------------------------------------------------------------------- tasks */

app.get("/api/projects/:id/tasks", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }

  const project = await Project.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  const status = typeof req.query.status === "string" ? req.query.status : "";
  if (status && !taskStatus.safeParse(status).success) {
    res.status(400).json({ message: "Status must be todo, in-progress, or done." });
    return;
  }

  const sort = sortFields.includes(req.query.sort) ? req.query.sort : "dueDate";

  const filter = { project: project._id.toString(), user: req.userId };
  if (status) filter.status = status;

  const tasks = await Task.find(filter).lean();
  tasks.sort((a, b) => compareTasks(a, b, sort));
  res.json({ tasks: tasks.map((task) => publicTask(task)) });
});

app.post("/api/projects/:id/tasks", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid project id." });
    return;
  }
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const userId = req.userId;
  const project = await Project.findOne({ _id: req.params.id, user: userId });
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return;
  }

  const task = await Task.create({
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    project: project._id,
    user: userId,
  });
  await Project.updateOne({ _id: project._id }, { $currentDate: { updatedAt: true } });
  res.status(201).json({ task: publicTask(task.toObject()) });
});

app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid task id." });
    return;
  }
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: fail(parsed.error) });
    return;
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
    { new: true },
  ).lean();
  if (!task) {
    res.status(404).json({ message: "Task not found." });
    return;
  }
  res.json({ task: publicTask(task) });
});

app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  if (!isId(req.params.id)) {
    res.status(400).json({ message: "Invalid task id." });
    return;
  }
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) {
    res.status(404).json({ message: "Task not found." });
    return;
  }
  res.json({ ok: true });
});

function compareTasks(a, b, sort) {
  if (sort === "title") return a.title.localeCompare(b.title);
  if (sort === "status") return statusRank[a.status] - statusRank[b.status];
  if (sort === "createdAt") return a.createdAt.getTime() - b.createdAt.getTime();

  const ad = a.dueDate ? a.dueDate.getTime() : null;
  const bd = b.dueDate ? b.dueDate.getTime() : null;
  if (ad === null && bd === null) return 0;
  if (ad === null) return 1;
  if (bd === null) return -1;
  return ad - bd;
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error." });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
