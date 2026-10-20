
import { useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "protask-hub-tasks";

const initialTasks = [
  {
    id: 1,
    title: "Finalize homepage design",
    project: "Website Redesign",
    priority: "High",
    dueDate: "",
    notes: "Review the layout and responsive design.",
    completed: false,
  },
  {
    id: 2,
    title: "Review project documentation",
    project: "ProTask Hub",
    priority: "Medium",
    dueDate: "",
    notes: "Check the README and installation steps.",
    completed: false,
  },
  {
    id: 3,
    title: "Practice React components",
    project: "Learning",
    priority: "Low",
    dueDate: "",
    notes: "Practice props, state, and reusable components.",
    completed: true,
  },
];

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialTasks;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.map((task) => ({
          ...task,
          notes: task.notes || "",
          dueDate: task.dueDate || "",
        }))
      : initialTasks;
  } catch {
    return initialTasks;
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  function saveTasks(updatedTasks) {
    setTasks(updatedTasks);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch {
      // The app continues working if browser storage is unavailable.
    }
  }

  function resetForm() {
    setTitle("");
    setProject("");
    setPriority("Medium");
    setDueDate("");
    setNotes("");
    setEditingTaskId(null);
    setShowForm(false);
  }

  function addTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    if (editingTaskId !== null) {
      const updatedTasks = tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: title.trim(),
              project: project.trim() || "General",
              priority,
              dueDate,
              notes: notes.trim(),
            }
          : task
      );

      saveTasks(updatedTasks);
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        project: project.trim() || "General",
        priority,
        dueDate,
        notes: notes.trim(),
        completed: false,
      };

      saveTasks([newTask, ...tasks]);
    }

    resetForm();
  }

  function editTask(task) {
    setTitle(task.title);
    setProject(task.project);
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setNotes(task.notes || "");
    setEditingTaskId(task.id);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(id) {
    saveTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id) {
    saveTasks(tasks.filter((task) => task.id !== id));

    if (editingTaskId === id) {
      resetForm();
    }
  }

  function clearCompleted() {
    const completed = tasks.filter((task) => task.completed).length;

    if (completed === 0) return;

    if (window.confirm(`Delete all ${completed} completed tasks?`)) {
      saveTasks(tasks.filter((task) => !task.completed));
    }
  }

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function isOverdue(task) {
    return (
      !task.completed &&
      Boolean(task.dueDate) &&
      task.dueDate < todayString
    );
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const overdueCount = tasks.filter(isOverdue).length;
  const highPriorityCount = tasks.filter(
    (task) => task.priority === "High" && !task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const query = search.toLowerCase();

      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        (task.notes || "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !task.completed) ||
        (filter === "Completed" && task.completed) ||
        (filter === "High Priority" &&
          task.priority === "High" &&
          !task.completed) ||
        (filter === "Overdue" && isOverdue(task));

      return matchesSearch && matchesFilter;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "priority") {
        const rank = { High: 3, Medium: 2, Low: 1 };
        return rank[b.priority] - rank[a.priority];
      }

      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }

      if (sortBy === "oldest") {
        return a.id - b.id;
      }

      return b.id - a.id;
    });
  }, [tasks, search, filter, sortBy, todayString]);

  function formatDate(date) {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  }

  return (
    <main className={`app ${darkMode ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✓</span>
          <span>
            ProTask<span className="brand-accent"> Hub</span>
          </span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <button
          className={`nav-item ${filter === "All" ? "active" : ""}`}
          onClick={() => setFilter("All")}
        >
          <span>▦</span> Overview
        </button>

        <button
          className={`nav-item ${filter === "Active" ? "active" : ""}`}
          onClick={() => setFilter("Active")}
        >
          <span>◷</span> My Tasks
        </button>

        <button
          className={`nav-item ${filter === "Completed" ? "active" : ""}`}
          onClick={() => setFilter("Completed")}
        >
          <span>✓</span> Completed
        </button>

        <button
          className={`nav-item ${
            filter === "High Priority" ? "active" : ""
          }`}
          onClick={() => setFilter("High Priority")}
        >
          <span>⚑</span> High Priority
        </button>

        <button
          className={`nav-item ${filter === "Overdue" ? "active" : ""}`}
          onClick={() => setFilter("Overdue")}
        >
          <span>!</span> Overdue
          {overdueCount > 0 && (
            <span className="overdue-count">{overdueCount}</span>
          )}
        </button>

        <div className="sidebar-bottom">
          <div className="profile-avatar">Y</div>
          <div className="profile-info">
            <strong>My Workspace</strong>
            <span>Personal account</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h1>Task Overview</h1>
          </div>

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle color theme"
          >
            {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </header>

        <section className="welcome">
          <div>
            <span className="welcome-tag">✦ STAY FOCUSED</span>
            <h2>Make today productive.</h2>
            <p>
              Organize your work, track your progress, and get things done.
            </p>
          </div>
          <div className="welcome-symbol">✓</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon purple">▦</span>
            <p>Total Tasks</p>
            <h3>{tasks.length}</h3>
            <span className="stat-note">All your tasks</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon blue">◷</span>
            <p>In Progress</p>
            <h3>{activeCount}</h3>
            <span className="stat-note">Tasks to complete</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Completed</p>
            <h3>{completedCount}</h3>
            <span className="stat-note">Tasks finished</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon orange">↗</span>
            <p>Progress</p>
            <h3>{progress}%</h3>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Task completion progress"
            >
              <div style={{ width: `${progress}%` }} />
            </div>
          </article>
        </section>

        <section className="stats-grid extra-stats">
          <article className="stat-card">
            <span className="stat-icon orange">!</span>
            <p>Overdue Tasks</p>
            <h3>{overdueCount}</h3>
            <span className="stat-note">Past their due date</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon purple">⚑</span>
            <p>High Priority</p>
            <h3>{highPriorityCount}</h3>
            <span className="stat-note">Important unfinished tasks</span>
          </article>
        </section>

        <section className="tasks-section">
          <div className="section-heading">
            <div>
              <h2>My Tasks</h2>
              <p>Manage your daily priorities.</p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  resetForm();
                  setShowForm(true);
                }
              }}
            >
              {showForm ? "Cancel" : "+ New Task"}
            </button>
          </div>

          {showForm && (
            <form className="task-form" onSubmit={addTask}>
              <label>
                Task title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </label>

              <label>
                Project
                <input
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                  placeholder="e.g. Website redesign"
                />
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>

              <label className="notes-field">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add extra details about this task..."
                  rows={3}
                />
              </label>

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingTaskId !== null ? "Save Changes" : "Create Task"}
                </button>

                <button
                  className="theme-toggle"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="task-controls">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="⌕ Search tasks, projects, or notes..."
              aria-label="Search tasks"
            />

            <select
              className="filter-select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter tasks"
            >
              <option>All</option>
              <option>Active</option>
              <option>Completed</option>
              <option>High Priority</option>
              <option>Overdue</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort tasks"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <span>✓</span>
                <h3>No tasks found</h3>
                <p>Add a new task or change your search or filter.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <button
                    className={`task-check ${
                      task.completed ? "checked" : ""
                    }`}
                    onClick={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? "Mark task incomplete"
                        : "Mark task complete"
                    }
                    title={
                      task.completed
                        ? "Mark incomplete"
                        : "Mark completed"
                    }
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-details">
                    <h3 className={task.completed ? "task-done" : ""}>
                      {task.title}
                    </h3>

                    <p>
                      {task.project}
                      {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                    </p>

                    {task.notes && (
                      <p className="task-notes">{task.notes}</p>
                    )}

                    {isOverdue(task) && (
                      <span className="overdue-label">Overdue</span>
                    )}
                  </div>

                  <span
                    className={`priority ${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>

                  <span
                    className={`status ${
                      task.completed ? "status-done" : ""
                    }`}
                  >
                    {task.completed ? "Completed" : "In progress"}
                  </span>

                  <button
                    className="task-action-button"
                    onClick={() => editTask(task)}
                    aria-label={`Edit ${task.title}`}
                    title="Edit task"
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => {
                      if (window.confirm("Delete this task?")) {
                        deleteTask(task.id);
                      }
                    }}
                    aria-label={`Delete ${task.title}`}
                    title="Delete task"
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>

          <footer className="task-footer">
            Showing {filteredTasks.length} of {tasks.length} tasks

            {completedCount > 0 && (
              <button
                className="clear-completed-button"
                onClick={clearCompleted}
              >
                Clear completed ({completedCount})
              </button>
            )}
          </footer>
        </section>

        <footer className="app-footer">
          ProTask Hub · Small steps, big progress.
        </footer>
      </section>
    </main>
  );
}

export default App;
