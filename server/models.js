import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },
    dueDate: { type: Date, default: null },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export const TASK_STATUSES = ["todo", "in-progress", "done"];

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export function publicProject(project, taskCount = 0) {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    taskCount,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function publicTask(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    projectId: task.project.toString(),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
