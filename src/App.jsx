
import { useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "protask-hub-tasks";

const initialTasks = [
  {
    id: 1,
    title: "Finalize homepage design",
    project: "Website Redesign",
    category: "Development",
    priority: "High",
    dueDate: "",
    notes: "Review the layout and responsive design.",
    completed: false,
    status: "todo",
  },
  {
    id: 2,
    title: "Review project documentation",
    project: "ProTask Hub",
    category: "Work",
    priority: "Medium",
    dueDate: "",
    notes: "Check the README and installation steps.",
    completed: false,
    status: "todo",
  },
  {
    id: 3,
    title: "Practice React components",
    project: "Learning",
    category: "Study",
    priority: "Low",
    dueDate: "",
    notes: "Practice props, state, and reusable components.",
    completed: true,
    status: "completed",
  },
];

const categories = [
  "General",
  "Development",
  "Study",
  "Work",
  "Personal",
];

const boardColumns = [
  { id: "todo", title: "To Do", description: "Tasks waiting to start" },
  {
    id: "in-progress",
    title: "In Progress",
    description: "Tasks currently being worked on",
  },
  {
    id: "completed",
    title: "Completed",
    description: "Finished tasks",
  },
];

function normalizeTask(task) {
  const completed = Boolean(task.completed);

  let status = task.status;

  if (completed) {
    status = "completed";
  } else if (!["todo", "in-progress"].includes(status)) {
    status = "todo";
  }

  return {
    ...task,
    category: task.category || "General",
    notes: task.notes || "",
    dueDate: task.dueDate || "",
    completed,
    status,
  };
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return initialTasks;

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed.map(normalizeTask)
      : initialTasks;
  } catch {
    return initialTasks;
  }
}

function getLocalDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);

  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");

  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  const [backupMessage, setBackupMessage] = useState("");

  function saveTasks(updatedTasks) {
    setTasks(updatedTasks);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedTasks)
      );
    } catch {
      setBackupMessage(
        "Could not save to browser storage. Export a backup to protect your tasks."
      );
    }
  }

  function resetForm() {
    setTitle("");
    setProject("");
    setCategory("General");
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
              category,
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
        category,
        priority,
        dueDate,
        notes: notes.trim(),
        completed: false,
        status: "todo",
      };

      saveTasks([newTask, ...tasks]);
    }

    resetForm();
  }

  function editTask(task) {
    setTitle(task.title);
    setProject(task.project);
    setCategory(task.category || "General");
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setNotes(task.notes || "");
    setEditingTaskId(task.id);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(id) {
    saveTasks(
      tasks.map((task) => {
        if (task.id !== id) return task;

        const completed = !task.completed;

        return {
          ...task,
          completed,
          status: completed ? "completed" : "todo",
        };
      })
    );
  }

  function moveTask(taskId, newStatus) {
    saveTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completed: newStatus === "completed",
            }
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
    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    if (completed === 0) return;

    if (window.confirm(`Delete all ${completed} completed tasks?`)) {
      saveTasks(tasks.filter((task) => !task.completed));
    }
  }

  function exportTasks() {
    try {
      const fileContent = JSON.stringify(tasks, null, 2);
      const blob = new Blob([fileContent], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "protask-hub-backup.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
      setBackupMessage("Your tasks were exported successfully!");
    } catch {
      setBackupMessage("Export failed. Please try again.");
    }
  }

  function importTasks(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);

        const validPriorities = ["Low", "Medium", "High"];

        const isValidBackup =
          Array.isArray(imported) &&
          imported.every(
            (task) =>
              task &&
              typeof task.title === "string" &&
              typeof task.project === "string" &&
              typeof task.completed === "boolean" &&
              validPriorities.includes(task.priority)
          );

        if (!isValidBackup) {
          throw new Error("Invalid backup");
        }

        const restoredTasks = imported.map((task) =>
          normalizeTask({
            ...task,
            id: task.id ?? Date.now() + Math.random(),
          })
        );

        if (
          window.confirm(
            "Import this backup? Your current task list will be replaced."
          )
        ) {
          saveTasks(restoredTasks);
          resetForm();
          setBackupMessage("Your tasks were restored successfully!");
        }
      } catch {
        setBackupMessage(
          "Import failed. Please select a valid ProTask Hub JSON backup."
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setBackupMessage("Could not read this file. Please try again.");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  const today = new Date();
  const todayString = getLocalDateString(today);

  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const upcomingLimitString = getLocalDateString(upcomingLimit);

  function isOverdue(task) {
    return (
      !task.completed &&
      Boolean(task.dueDate) &&
      task.dueDate < todayString
    );
  }

  function isUpcoming(task) {
    return (
      !task.completed &&
      Boolean(task.dueDate) &&
      task.dueDate >= todayString &&
      task.dueDate <= upcomingLimitString
    );
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const activeCount = tasks.length - completedCount;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in-progress" && !task.completed
  ).length;

  const overdueCount = tasks.filter(isOverdue).length;

  const upcomingCount = tasks.filter(isUpcoming).length;

  const highPriorityCount = tasks.filter(
    (task) => task.priority === "High" && !task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase();

    const result = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        (task.notes || "").toLowerCase().includes(query) ||
        (task.category || "General").toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !task.completed) ||
        (filter === "Completed" && task.completed) ||
        (filter === "High Priority" &&
          task.priority === "High" &&
          !task.completed) ||
        (filter === "Overdue" && isOverdue(task)) ||
        (filter === "Upcoming" && isUpcoming(task));

      const matchesCategory =
        categoryFilter === "All Categories" ||
        (task.category || "General") === categoryFilter;

      return matchesSearch && matchesFilter && matchesCategory;
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
  }, [tasks, search, filter, categoryFilter, sortBy, todayString]);

  function formatDate(date) {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  }

  function confirmDeleteTask(task) {
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
    }
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

        <button
          className={`nav-item ${filter === "Upcoming" ? "active" : ""}`}
          onClick={() => setFilter("Upcoming")}
        >
          <span>📅</span> Upcoming
          {upcomingCount > 0 && (
            <span className="overdue-count">{upcomingCount}</span>
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
            <h3>{inProgressCount}</h3>
            <span className="stat-note">Tasks being worked on</span>
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

          <article className="stat-card">
            <span className="stat-icon blue">📅</span>
            <p>Upcoming Deadlines</p>
            <h3>{upcomingCount}</h3>
            <span className="stat-note">Due within seven days</span>
          </article>
        </section>

        <section className="backup-section">
          <div className="section-heading">
            <div>
              <h2>Task Backup</h2>
              <p>Export your tasks or restore a saved backup.</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="theme-toggle"
                onClick={exportTasks}
              >
                Export JSON
              </button>

              <label className="primary-button">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importTasks}
                  hidden
                />
              </label>
            </div>
          </div>

          {backupMessage && (
            <p className="backup-message" role="status" aria-live="polite">
              {backupMessage}
            </p>
          )}
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
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
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

          <div className="view-switch">
            <button
              type="button"
              className={
                viewMode === "list"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={() => setViewMode("list")}
            >
              ☰ List View
            </button>

            <button
              type="button"
              className={
                viewMode === "board"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={() => setViewMode("board")}
            >
              ▦ Kanban Board
            </button>
          </div>

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
              <option>Upcoming</option>
            </select>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option>All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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

          {viewMode === "board" && (
            <div className="kanban-board">
              {boardColumns.map((column) => {
                const columnTasks = filteredTasks.filter((task) => {
                  const status = task.completed
                    ? "completed"
                    : task.status || "todo";

                  return status === column.id;
                });

                return (
                  <section className="kanban-column" key={column.id}>
                    <div className="kanban-heading">
                      <div>
                        <h3>{column.title}</h3>
                        <p>{column.description}</p>
                      </div>
                      <span className="kanban-count">
                        {columnTasks.length}
                      </span>
                    </div>

                    {columnTasks.length === 0 ? (
                      <div className="kanban-empty">
                        <span>▦</span>
                        <p>No tasks here yet</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <article className="kanban-card" key={task.id}>
                          <div className="kanban-card-top">
                            <span
                              className={`priority ${task.priority.toLowerCase()}`}
                            >
                              {task.priority}
                            </span>

                            {isOverdue(task) && (
                              <span className="overdue-label">
                                Overdue
                              </span>
                            )}
                          </div>

                          <h4 className={task.completed ? "task-done" : ""}>
                            {task.title}
                          </h4>

                          <p className="kanban-project">
                            {task.project} · {task.category || "General"}
                          </p>

                          {task.dueDate && (
                            <p className="kanban-date">
                              📅 Due {formatDate(task.dueDate)}
                            </p>
                          )}

                          {task.notes && (
                            <p className="kanban-notes">{task.notes}</p>
                          )}

                          <label className="kanban-status-label">
                            Move task
                            <select
                              value={column.id}
                              onChange={(event) =>
                                moveTask(task.id, event.target.value)
                              }
                              aria-label={`Move ${task.title}`}
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </label>

                          <div className="kanban-actions">
                            <button
                              type="button"
                              className="task-action-button"
                              onClick={() => editTask(task)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => confirmDeleteTask(task)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {viewMode === "list" && (
            <div className="task-list">
              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <span>✓</span>
                  <h3>No tasks found</h3>
                  <p>Add a new task or change your search or filters.</p>
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
                        {" · "}
                        {task.category || "General"}
                        {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                      </p>

                      {task.notes && (
                        <p className="task-notes">{task.notes}</p>
                      )}

                      {isOverdue(task) && (
                        <span className="overdue-label">Overdue</span>
                      )}

                      {isUpcoming(task) && (
                        <span className="upcoming-label">
                          {task.dueDate === todayString
                            ? "Due today"
                            : "Due soon"}
                        </span>
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
                      {task.completed
                        ? "Completed"
                        : task.status === "in-progress"
                          ? "In Progress"
                          : "To Do"}
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
                      onClick={() => confirmDeleteTask(task)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </article>
                ))
              )}
            </div>
          )}

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
