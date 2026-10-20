import { useMemo, useState } from "react";
import "./App.css";

const initialTasks = [
  {
    id: 1,
    title: "Finalize homepage design",
    project: "Website Redesign",
    priority: "High",
    dueDate: "",
    completed: false,
  },
  {
    id: 2,
    title: "Review project documentation",
    project: "ProTask Hub",
    priority: "Medium",
    dueDate: "",
    completed: false,
  },
  {
    id: 3,
    title: "Practice React components",
    project: "Learning",
    priority: "Low",
    dueDate: "",
    completed: true,
  },
];

function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("protask-hub-tasks");
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  function saveTasks(updatedTasks) {
    setTasks(updatedTasks);
    try {
      localStorage.setItem(
        "protask-hub-tasks",
        JSON.stringify(updatedTasks)
      );
    } catch {
      // The app still works if browser storage is unavailable.
    }
  }

  function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: Date.now(),
      title: title.trim(),
      project: project.trim() || "General",
      priority,
      dueDate,
      completed: false,
    };

    saveTasks([newTask, ...tasks]);
    setTitle("");
    setProject("");
    setPriority("Medium");
    setDueDate("");
    setShowForm(false);
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
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.project.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !task.completed) ||
        (filter === "Completed" && task.completed) ||
        (filter === "High Priority" &&
          task.priority === "High" &&
          !task.completed);

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  return (
    <main className={`app ${darkMode ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✓</span>
          <span>ProTask<span className="brand-accent"> Hub</span></span>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <button className="nav-item active" onClick={() => setFilter("All")}>
          <span>▦</span> Overview
        </button>
        <button className="nav-item" onClick={() => setFilter("Active")}>
          <span>◷</span> My Tasks
        </button>
        <button className="nav-item" onClick={() => setFilter("Completed")}>
          <span>✓</span> Completed
        </button>
        <button
          className="nav-item"
          onClick={() => setFilter("High Priority")}
        >
          <span>⚑</span> High Priority
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
            <p>Organize your work, track your progress, and get things done.</p>
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
            <div className="progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>
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
              onClick={() => setShowForm(!showForm)}
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

              <button className="primary-button" type="submit">
                Create Task
              </button>
            </form>
          )}

          <div className="task-controls">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="⌕  Search tasks or projects..."
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
                    className={`task-check ${task.completed ? "checked" : ""}`}
                    onClick={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? "Mark task incomplete"
                        : "Mark task complete"
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
                      {task.dueDate &&
                        ` · Due ${new Date(
                          `${task.dueDate}T00:00:00`
                        ).toLocaleDateString()}`}
                    </p>
                  </div>

                  <span className={`priority ${task.priority.toLowerCase()}`}>
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