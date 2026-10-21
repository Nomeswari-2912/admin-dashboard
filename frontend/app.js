const draftKey = "springboardCourseDraft";
const coursesKey = "springboardCourses";
const courseAdminPath = "/course-admin";
const stepPaths = [courseAdminPath, "/details", "/settings"];

const form = document.querySelector("[data-course-form]");
const toast = document.querySelector("[data-toast]");
const dashboardView = document.querySelector("[data-dashboard-view]");
const createView = document.querySelector("[data-create-view]");
const coursesView = document.querySelector("[data-courses-view]");
const searchInput = document.querySelector("[data-course-search]");
const courseRows = document.querySelector("[data-course-rows]");
const shouldInitializeDashboard = Boolean(form || dashboardView || createView || coursesView || searchInput || courseRows || toast);
let currentStep = 1;
let currentView = new URLSearchParams(window.location.search).get("view") || "dashboard";
let activeCourseId = null;
let filterStatus = "all";
let toastTimeout;
let courses = [];
let draft = {};

if (shouldInitializeDashboard) {
  courses = readStoredArray(coursesKey);
  draft = readStoredObject(draftKey);
}

if (currentStep < 0) currentStep = 0;
if (!["dashboard", "create", "courses"].includes(currentView)) currentView = "dashboard";

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) throw new TypeError("Saved course data must be a list.");
    return value;
  } catch (error) {
    showToast(`Could not read saved courses: ${error.message}`, true);
    return [];
  }
}

function readStoredObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new TypeError("Saved draft data must be an object.");
    }
    return value;
  } catch (error) {
    showToast(`Could not read your saved draft: ${error.message}`, true);
    return {};
  }
}

function formValues() {
  return Object.fromEntries(new FormData(form).entries());
}

function persistDraft() {
  draft = formValues();
  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
    document.querySelector("[data-autosave-status]").innerHTML = '<span class="status-dot"></span> Changes saved';
  } catch (error) {
    showToast(`Could not save your changes: ${error.message}`, true);
  }
}

function persistCourses() {
  try {
    localStorage.setItem(coursesKey, JSON.stringify(courses));
    renderStats();
    renderCourses();
  } catch (error) {
    showToast(`Could not save courses: ${error.message}`, true);
    return false;
  }
  return true;
}

function restoreForm(values) {
  if (values.price === undefined && values.cost !== undefined) values = { ...values, price: values.cost };
  for (const field of form.elements) {
    if (field.name && Object.hasOwn(values, field.name)) field.value = values[field.name];
  }
  if (!form.elements.courseId.value) form.elements.courseId.value = nextCourseId();
  updatePreview();
}

function nextCourseId() {
  const highest = courses.reduce((max, course) => {
    const match = String(course.courseId || "").match(/^SB-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  return `SB-${highest + 1}`;
}

function currency(value) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

function updatePreview() {
  const values = formValues();
  document.querySelector("[data-preview-title]").textContent = values.title || "Your course title";
  document.querySelector("[data-preview-category]").textContent = values.category || "YOUR CATEGORY";
  document.querySelector("[data-preview-id]").textContent = values.courseId || "COURSE ID";
  document.querySelector("[data-preview-description]").textContent = values.description || "Your course description will appear here. Share what learners will discover.";
  document.querySelector("[data-preview-price]").textContent = currency(values.price);
  document.querySelector("[data-preview-creator]").textContent = values.creator || "Springboard instructor";
  document.querySelector("[data-preview-initials]").textContent = values.creator
    ? values.creator.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : "SB";
  const descriptionCount = document.querySelector('[data-count-for="description"]');
  if (descriptionCount) descriptionCount.textContent = `${(values.description || "").length} / 500`;
  updateReview(values);
}

function updateReview(values) {
  const review = document.querySelector("[data-review-list]");
  if (!review) return;
  review.replaceChildren();
  const details = [
    ["Course", values.title || "Add a course title"],
    ["Category", values.category || "Choose a category"],
    ["Cost", currency(values.price)],
    ["Lessons", values.contents ? values.contents.split(/\r?\n/).filter(Boolean).length : 0],
  ];
  for (const [label, value] of details) {
    const item = document.createElement("div");
    item.className = "review-item";
    const name = document.createElement("span");
    name.textContent = label;
    const content = document.createElement("strong");
    content.textContent = value;
    item.append(name, content);
    review.append(item);
  }
}

function renderStats() {
  const published = courses.filter((course) => course.status === "published");
  const drafts = courses.filter((course) => course.status === "draft");
  document.querySelector("[data-total-count]").textContent = courses.length;
  document.querySelector("[data-published-count]").textContent = published.length;
  document.querySelector("[data-draft-count]").textContent = drafts.length;
  document.querySelector("[data-enrollment-count]").textContent = courses.reduce((sum, course) => sum + (Number(course.enrolled) || 0), 0);
}

function courseMatches(course, query) {
  const searchable = `${course.title || ""} ${course.courseId || ""} ${course.category || ""}`.toLowerCase();
  return searchable.includes(query.toLowerCase());
}

function renderCourses() {
  if (!courseRows) return;
  const query = searchInput.value.trim();
  const visibleCourses = courses.filter((course) => {
    const matchesStatus = filterStatus === "all" || course.status === filterStatus;
    return matchesStatus && courseMatches(course, query);
  });
  courseRows.replaceChildren();
  for (const course of visibleCourses) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const courseName = document.createElement("div");
    courseName.className = "table-course-name";
    const colorBlock = document.createElement("span");
    colorBlock.className = `table-course-art ${categoryClass(course.category)}`;
    colorBlock.textContent = (course.category || "C").slice(0, 1).toUpperCase();
    const title = document.createElement("strong");
    title.textContent = course.title || "Untitled course";
    const category = document.createElement("small");
    category.textContent = course.category || "Uncategorized";
    courseName.append(colorBlock, createTextStack(title, category));
    nameCell.append(courseName);

    const idCell = cell(course.courseId || "—");
    const priceCell = cell(currency(course.price));
    const enrollmentCell = cell(String(Number(course.enrolled) || 0));
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${course.status === "published" ? "badge-published" : "badge-draft"}`;
    badge.textContent = course.status === "published" ? "Published" : "Draft";
    statusCell.append(badge);

    const actions = document.createElement("td");
    actions.className = "table-actions";
    const edit = actionButton("Edit", "edit", course.id);
    const toggle = actionButton(course.status === "published" ? "Unpublish" : "Publish", "toggle", course.id);
    const remove = actionButton("Delete", "delete", course.id);
    actions.append(edit, toggle, remove);
    row.append(nameCell, idCell, priceCell, enrollmentCell, statusCell, actions);
    courseRows.append(row);
  }
  document.querySelector("[data-course-total]").textContent = `${courses.length} ${courses.length === 1 ? "course" : "courses"} in your catalog`;
  document.querySelector("[data-empty-state]").classList.toggle("hidden", courses.length > 0);
  document.querySelector("[data-no-results]").classList.toggle("hidden", courses.length === 0 || visibleCourses.length > 0);
}

function createTextStack(first, second) {
  const stack = document.createElement("span");
  stack.className = "table-text-stack";
  stack.append(first, second);
  return stack;
}

function cell(text) {
  const element = document.createElement("td");
  element.textContent = text;
  return element;
}

function actionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `row-action row-action-${action}`;
  button.dataset.courseAction = action;
  button.dataset.courseId = id;
  button.textContent = label;
  return button;
}

function categoryClass(category) {
  return `category-${String(category || "").toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

function setView(view, updateHistory = true) {
  currentView = view;
  dashboardView.classList.toggle("hidden", view !== "dashboard");
  createView.classList.toggle("hidden", view !== "create");
  coursesView.classList.toggle("hidden", view !== "courses");
  document.querySelectorAll("[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
  document.querySelector("[data-page-crumb]").textContent = view === "courses" ? "Manage courses" : view === "create" ? "Create course" : "Dashboard";
  document.querySelector("[data-course-search]").placeholder = view === "courses" ? "Search your catalog..." : "Search courses...";
  if (updateHistory) {
    const suffix = view === "dashboard" ? "" : `?view=${view}`;
    window.history.pushState({ view, step: currentStep }, "", `${courseAdminPath}${suffix}`);
  }
  renderCourses();
}

function setStep(step, updateHistory = true) {
  currentStep = Math.min(3, Math.max(1, step));
  document.querySelectorAll("[data-step-panel]").forEach((panel) => {
    const active = Number(panel.dataset.stepPanel) === currentStep;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  document.querySelectorAll("[data-step-link]").forEach((button) => {
    const number = Number(button.dataset.stepLink);
    button.classList.toggle("current", number === currentStep);
    button.classList.toggle("complete", number < currentStep);
    if (number === currentStep) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  document.querySelector("[data-step-progress]").style.width = `${((currentStep - 1) / 2) * 100}%`;
  document.querySelector("[data-step-count]").innerHTML = `STEP 0${currentStep} <span>OF 03</span>`;
  const headings = [
    ["Let's start with the basics", "A few details help learners find the right course."],
    ["Tell us about your course", "Share the details that make your course worth taking."],
    ["Ready for the world?", "Review your course and publish it for learners."],
  ];
  document.querySelector("[data-step-heading]").textContent = headings[currentStep - 1][0];
  document.querySelector("[data-step-description]").textContent = headings[currentStep - 1][1];
  if (updateHistory) {
    const path = currentStep === 1 ? `${courseAdminPath}?view=create&step=1` : stepPaths[currentStep - 1];
    window.history.pushState({ view: "create", step: currentStep }, "", path);
    setView("create", false);
  }
}

function validateStep(step) {
  const panel = document.querySelector(`[data-step-panel="${step}"]`);
  const fields = [...panel.querySelectorAll("[required]")];
  let firstInvalid = null;
  for (const field of fields) {
    const valid = field.checkValidity();
    const error = document.querySelector(`[data-error-for="${field.name}"]`);
    if (error) error.textContent = valid ? "" : field.validationMessage;
    field.classList.toggle("invalid", !valid);
    if (!valid && !firstInvalid) firstInvalid = field;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function buildCourse(status) {
  return {
    ...formValues(),
    price: Number(form.elements.price.value),
    id: activeCourseId || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `course-${Date.now()}`),
    status,
    createdAt: new Date().toISOString(),
    enrolled: Number(form.elements.enrolled?.value || 0),
  };
}

function upsertCourse(course) {
  const index = courses.findIndex((item) => item.id === course.id);
  if (index < 0) courses.unshift(course);
  else courses[index] = { ...courses[index], ...course };
  return persistCourses();
}

function saveAsDraft() {
  const course = buildCourse("draft");
  if (!upsertCourse(course)) return;
  activeCourseId = course.id;
  draft = formValues();
  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
    showToast("Draft saved. You can come back to it anytime.");
    document.querySelector("[data-notification-copy]").textContent = `Your draft “${course.title || "Untitled course"}” was saved.`;
  } catch (error) {
    showToast(`Course saved, but the working draft could not be stored: ${error.message}`, true);
  }
}

function publishCourse() {
  if (!validateStep(3)) return;
  const course = buildCourse("published");
  if (!upsertCourse(course)) return;
  activeCourseId = null;
  draft = {};
  try {
    localStorage.removeItem(draftKey);
  } catch (error) {
    showToast(`Course published, but the saved draft could not be cleared: ${error.message}`, true);
  }
  document.querySelector("[data-success-course]").textContent = course.title || "Your course";
  document.querySelector("[data-success-modal]").classList.remove("hidden");
  document.querySelector("[data-notification-copy]").textContent = `“${course.title || "Your course"}” is now published.`;
}

function editCourse(id) {
  const course = courses.find((item) => item.id === id);
  if (!course) return showToast("That course could not be found.", true);
  activeCourseId = course.id;
  restoreForm({ ...course, price: course.price ?? course.cost ?? "" });
  setView("create");
  setStep(1);
  showToast(`Editing “${course.title || "Untitled course"}”.`);
}

function navigateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const pathStep = stepPaths.indexOf(window.location.pathname);
  currentStep = pathStep > 0 ? pathStep + 1 : Number(params.get("step")) || 1;
  currentView = params.get("view") || (pathStep > 0 ? "create" : "dashboard");
  if (!["dashboard", "create", "courses"].includes(currentView)) currentView = "dashboard";
  setStep(currentStep, false);
  setView(currentView, false);
}

if (shouldInitializeDashboard) {
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", (event) => {
    event.target.classList.remove("invalid");
    const error = document.querySelector(`[data-error-for="${event.target.name}"]`);
    if (error) error.textContent = "";
    updatePreview();
    persistDraft();
  });
  form.addEventListener("change", () => {
    updatePreview();
    persistDraft();
  });

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateStep(currentStep)) return;
      persistDraft();
      setStep(currentStep + 1);
    });
  });
  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => setStep(currentStep - 1)));
  document.querySelectorAll("[data-save-draft]").forEach((button) => button.addEventListener("click", saveAsDraft));
  document.querySelector("[data-publish]")?.addEventListener("click", publishCourse);

  document.querySelectorAll("[data-step-link]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetStep = Number(button.dataset.stepLink);
      if (targetStep > currentStep && !validateStep(currentStep)) return;
      setStep(targetStep);
    });
  });

  document.querySelectorAll("[data-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (link.dataset.view === "create") {
        setView("create");
        setStep(1);
      } else {
        setView(link.dataset.view);
      }
    });
  });
  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".popover").forEach((popover) => popover.classList.add("hidden"));
      setView(button.dataset.viewLink);
      if (button.dataset.viewLink === "create") setStep(1);
    });
  });

  document.querySelectorAll("[data-stat-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      filterStatus = ["published", "draft"].includes(button.dataset.statFilter) ? button.dataset.statFilter : "all";
      setView("courses");
      document.querySelectorAll("[data-course-filter]").forEach((tab) => tab.classList.toggle("active", tab.dataset.courseFilter === filterStatus));
      if (button.dataset.statFilter === "enrollments") showToast("Enrollment totals are shown for each course in your catalog.");
    });
  });
  document.querySelectorAll("[data-course-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      filterStatus = button.dataset.courseFilter;
      document.querySelectorAll("[data-course-filter]").forEach((tab) => tab.classList.toggle("active", tab === button));
      renderCourses();
    });
  });
  searchInput.addEventListener("input", renderCourses);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setView("courses");
  });

  courseRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-action]");
    if (!button) return;
    const course = courses.find((item) => item.id === button.dataset.courseId);
    if (!course) return showToast("That course could not be found.", true);
    if (button.dataset.courseAction === "edit") return editCourse(course.id);
    if (button.dataset.courseAction === "delete") {
      if (!window.confirm(`Delete “${course.title || "Untitled course"}” permanently?`)) return;
      courses = courses.filter((item) => item.id !== course.id);
      if (persistCourses()) showToast("Course deleted.");
      return;
    }
    course.status = course.status === "published" ? "draft" : "published";
    if (persistCourses()) showToast(course.status === "published" ? "Course published." : "Course moved to drafts.");
  });

  function togglePopover(toggle, popover) {
    const opening = popover.classList.contains("hidden");
    document.querySelectorAll(".popover").forEach((item) => item.classList.add("hidden"));
    document.querySelectorAll("[aria-expanded]").forEach((item) => item.setAttribute("aria-expanded", "false"));
    popover.classList.toggle("hidden", !opening);
    toggle.setAttribute("aria-expanded", String(opening));
  }

  const notificationToggle = document.querySelector("[data-notification-toggle]");
  notificationToggle?.addEventListener("click", () => togglePopover(notificationToggle, document.querySelector("[data-notification-menu]")));
  const profileToggle = document.querySelector("[data-profile-toggle]");
  profileToggle?.addEventListener("click", () => togglePopover(profileToggle, document.querySelector("[data-profile-menu]")));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-wrap")) {
      document.querySelectorAll(".popover").forEach((item) => item.classList.add("hidden"));
      document.querySelectorAll("[aria-expanded]").forEach((item) => item.setAttribute("aria-expanded", "false"));
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape") {
      document.querySelector("[data-success-modal]")?.classList.add("hidden");
      document.querySelectorAll(".popover").forEach((item) => item.classList.add("hidden"));
    }
  });
  document.querySelectorAll("[data-close-success]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("[data-success-modal]")?.classList.add("hidden");
  }));
  document.querySelector("[data-success-modal]")?.addEventListener("click", (event) => {
    if (event.target.matches("[data-success-modal]")) event.currentTarget.classList.add("hidden");
  });
  window.addEventListener("popstate", navigateFromLocation);

  restoreForm(draft);
  renderStats();
  renderCourses();
  navigateFromLocation();
}
