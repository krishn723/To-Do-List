class TodoApp {
  constructor() {
    this.tasks = this.loadFromStorage() || [];
    this.currentFilter = "all";
    this.currentPriorityFilter = "all";
    this.editingTaskId = null;

    this.initializeElements();
    this.attachEventListeners();
    this.render();
    this.updateStats();
  }

  initializeElements() {
    this.taskInput = document.getElementById("taskInput");
    this.prioritySelect = document.getElementById("prioritySelect");
    this.addBtn = document.getElementById("addBtn");
    this.taskList = document.getElementById("taskList");
    this.emptyState = document.getElementById("emptyState");
    this.filterBtns = document.querySelectorAll(".filter-btn");
    this.priorityFilters = document.querySelectorAll(".priority-filter");
    this.clearCompletedBtn = document.getElementById("clearCompleted");
    this.clearAllBtn = document.getElementById("clearAll");
    this.toast = document.getElementById("toast");

    // Stats elements
    this.totalTasksSpan = document.getElementById("totalTasks");
    this.activeTasksSpan = document.getElementById("activeTasks");
    this.completedTasksSpan = document.getElementById("completedTasks");
  }

  attachEventListeners() {
    // Add task
    this.addBtn.addEventListener("click", () => this.handleAddTask());
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleAddTask();
    });

    // Filter buttons
    this.filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setActiveFilter(e.target);
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });

    // Priority filters
    this.priorityFilters.forEach((filter) => {
      filter.addEventListener("click", (e) => {
        this.setActivePriorityFilter(e.target);
        this.currentPriorityFilter = e.target.dataset.priority;
        this.render();
      });
    });

    // Clear buttons
    this.clearCompletedBtn.addEventListener("click", () =>
      this.clearCompleted()
    );
    this.clearAllBtn.addEventListener("click", () => this.clearAll());
  }

  handleAddTask() {
    const text = this.taskInput.value.trim();
    const priority = this.prioritySelect.value;

    if (!text) {
      this.showToast("Please enter a task!", "error");
      return;
    }

    if (this.editingTaskId) {
      this.updateTask(this.editingTaskId, text, priority);
      this.editingTaskId = null;
      this.addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    } else {
      this.addTask(text, priority);
    }

    this.taskInput.value = "";
    this.prioritySelect.value = "medium";
    this.taskInput.focus();
  }

  addTask(text, priority) {
    const task = {
      id: Date.now().toString(),
      text: text,
      priority: priority,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.tasks.unshift(task);
    this.saveToStorage();
    this.render();
    this.updateStats();
    this.showToast("Task added successfully!", "success");
  }

  updateTask(id, text, priority) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.text = text;
      task.priority = priority;
      this.saveToStorage();
      this.render();
      this.showToast("Task updated successfully!", "success");
    }
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      this.saveToStorage();
      this.render();
      this.updateStats();

      const status = task.completed ? "completed" : "marked as active";
      this.showToast(`Task ${status}!`, "success");
    }
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      this.taskInput.value = task.text;
      this.prioritySelect.value = task.priority;
      this.editingTaskId = id;
      this.addBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
      this.taskInput.focus();
      this.taskInput.select();
    }
  }

  deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add("removing");
      setTimeout(() => {
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.saveToStorage();
        this.render();
        this.updateStats();
        this.showToast("Task deleted!", "warning");
      }, 300);
    }
  }

  clearCompleted() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
      this.showToast("No completed tasks to clear!", "warning");
      return;
    }

    this.tasks = this.tasks.filter((t) => !t.completed);
    this.saveToStorage();
    this.render();
    this.updateStats();
    this.showToast(`${completedCount} completed task(s) cleared!`, "success");
  }

  clearAll() {
    if (this.tasks.length === 0) {
      this.showToast("No tasks to clear!", "warning");
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete all tasks? This action cannot be undone."
      )
    ) {
      const taskCount = this.tasks.length;
      this.tasks = [];
      this.saveToStorage();
      this.render();
      this.updateStats();
      this.showToast(`All ${taskCount} task(s) cleared!`, "success");
    }
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];

    // Apply status filter
    switch (this.currentFilter) {
      case "active":
        filtered = filtered.filter((t) => !t.completed);
        break;
      case "completed":
        filtered = filtered.filter((t) => t.completed);
        break;
    }

    // Apply priority filter
    if (this.currentPriorityFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.priority === this.currentPriorityFilter
      );
    }

    return filtered;
  }

  render() {
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      this.taskList.style.display = "none";
      this.emptyState.style.display = "block";
    } else {
      this.taskList.style.display = "block";
      this.emptyState.style.display = "none";
    }

    this.taskList.innerHTML = filteredTasks
      .map((task) => this.createTaskHTML(task))
      .join("");
  }

  createTaskHTML(task) {
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    const createdTime = new Date(task.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
            <li class="task-item ${task.completed ? "completed" : ""} ${
      task.priority
    }-priority" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${
                  task.completed ? "checked" : ""
                } 
                       onchange="todoApp.toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-text ${
                      task.completed ? "completed" : ""
                    }">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority-badge priority-${
                          task.priority
                        }">${task.priority} priority</span>
                        <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                        <span><i class="fas fa-clock"></i> ${createdTime}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="todoApp.editTask('${
                      task.id
                    }')" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="todoApp.deleteTask('${
                      task.id
                    }')" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
  }

  setActiveFilter(activeBtn) {
    this.filterBtns.forEach((btn) => btn.classList.remove("active"));
    activeBtn.classList.add("active");
  }

  setActivePriorityFilter(activeFilter) {
    this.priorityFilters.forEach((filter) => filter.classList.remove("active"));
    activeFilter.classList.add("active");
  }

  updateStats() {
    const total = this.tasks.length;
    const active = this.tasks.filter((t) => !t.completed).length;
    const completed = this.tasks.filter((t) => t.completed).length;

    this.totalTasksSpan.textContent = total;
    this.activeTasksSpan.textContent = active;
    this.completedTasksSpan.textContent = completed;
  }

  showToast(message, type = "success") {
    this.toast.className = `toast ${type}`;
    this.toast.innerHTML = `<i class="fas fa-${this.getToastIcon(
      type
    )}"></i> ${message}`;
    this.toast.classList.add("show");

    setTimeout(() => {
      this.toast.classList.remove("show");
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
    };
    return icons[type] || "info-circle";
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  saveToStorage() {
    // Note: Using in-memory storage since localStorage is not available in Claude.ai
    // In a real environment, you would use:
    // localStorage.setItem('todoAppTasks', JSON.stringify(this.tasks));
    this.storageData = this.tasks;
  }

  loadFromStorage() {
    // Note: Using in-memory storage since localStorage is not available in Claude.ai
    // In a real environment, you would use:
    // return JSON.parse(localStorage.getItem('todoAppTasks') || '[]');
    return this.storageData || [];
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp();
});
