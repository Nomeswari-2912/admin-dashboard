const usersKey = "springboardAdminUsers";
const draftKey = "springboardAdminUserDraft";
const coursesKey = "springboardAdminCourseList";
const sampleUsers = Array.from({ length: 9 }, (_, index) => ({
  id: `sample-${index + 1}`,
  firstName: "Prasitha",
  lastName: "Venkatesan",
  email: "prasithatesting@gmail.com",
  category: "Women in Technology",
  emailVerified: true,
  approvalStatus: "Approved",
  registerAs: "Student",
  courseCompleted: "",
  coursesInProgress: "",
  gender: "",
  hoursSpent: "",
  goal: "",
  profileUrl: "",
  skills: "",
}));

const screens = {
  "/": "home",
  "/users": "user-actions",
  "/courses": "course-actions",
  "/courses/new": "course-create",
  "/courses/list": "course-list",
  "/users/new": "create-basic",
  "/users/new/profile": "create-learning",
  "/users/new/preferences": "create-profile",
  "/users/list": "user-list",
  "/users/edit": "edit-user",
};

const currentScreen = screens[window.location.pathname];
document.querySelector(`[data-screen="${currentScreen || "home"}"]`)?.removeAttribute("hidden");

const toast = document.querySelector("[data-global-toast]");
let toastTimer;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
}

function readUsers() {
  try {
    const raw = localStorage.getItem(usersKey);
    if (raw === null) {
      localStorage.setItem(usersKey, JSON.stringify(sampleUsers));
      return sampleUsers;
    }
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) throw new TypeError("Saved user data must be a list.");
    return users;
  } catch (error) {
    showToast(`Could not read saved users: ${error.message}`, true);
    return [];
  }
}

function readDraft() {
  try {
    const raw = localStorage.getItem(draftKey);
    if (raw === null) return {};
    const draft = JSON.parse(raw);
    if (!draft || Array.isArray(draft) || typeof draft !== "object") {
      throw new TypeError("Saved user draft must be an object.");
    }
    return draft;
  } catch (error) {
    showToast(`Could not read your saved user draft: ${error.message}`, true);
    return {};
  }
}

function readCourses() {
  try {
    const raw = localStorage.getItem(coursesKey);
    if (raw === null) return [];
    const courses = JSON.parse(raw);
    if (!Array.isArray(courses)) throw new TypeError("Saved course data must be a list.");
    return courses;
  } catch (error) {
    showToast(`Could not read saved courses: ${error.message}`, true);
    return [];
  }
}

let users = readUsers();
let draft = readDraft();
let courses = readCourses();

function saveUsers() {
  try {
    localStorage.setItem(usersKey, JSON.stringify(users));
    return true;
  } catch (error) {
    showToast(`Could not save users: ${error.message}`, true);
    return false;
  }
}

function saveCourses() {
  try {
    localStorage.setItem(coursesKey, JSON.stringify(courses));
    return true;
  } catch (error) {
    showToast(`Could not save courses: ${error.message}`, true);
    return false;
  }
}

function saveDraft(form) {
  for (const [name, value] of new FormData(form)) {
    if (name !== "password") draft[name] = value;
  }
  const checkbox = form.elements.emailVerified;
  if (checkbox) draft.emailVerified = checkbox.checked;
  const selectedRole = form.querySelector('input[name="registerAs"]:checked');
  if (selectedRole) draft.registerAs = selectedRole.value;
  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch (error) {
    showToast(`Could not save your user draft: ${error.message}`, true);
  }
}

function applyValues(form, values) {
  for (const [name, value] of Object.entries(values)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;
    if (field instanceof RadioNodeList) {
      const selected = form.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`);
      if (selected) selected.checked = true;
    } else if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else if (name !== "password") {
      field.value = value ?? "";
    }
  }
}

function uniqueEmail(email, exceptId) {
  return !users.some((user) => user.id !== exceptId && String(user.email).toLowerCase() === email.toLowerCase());
}

function renderUsers() {
  const rows = document.querySelector("[data-user-rows]");
  if (!rows) return;
  const query = document.querySelector("[data-user-search]").value.trim().toLowerCase();
  const matches = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query));
  rows.replaceChildren();
  for (const user of matches) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    name.textContent = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "New user";
    const email = document.createElement("td");
    email.textContent = user.email || "—";
    const category = document.createElement("td");
    category.textContent = user.category || "—";
    const verified = document.createElement("td");
    verified.className = "verified-label";
    verified.textContent = user.emailVerified ? "Yes" : "No";
    const status = document.createElement("td");
    const approval = document.createElement("span");
    approval.className = "approval";
    approval.textContent = user.approvalStatus || "Approved";
    status.append(approval);
    const actions = document.createElement("td");
    const actionButtons = document.createElement("div");
    actionButtons.className = "row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.dataset.userAction = "edit";
    edit.dataset.userId = user.id;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.dataset.userAction = "delete";
    remove.dataset.userId = user.id;
    actionButtons.append(edit, remove);
    actions.append(actionButtons);
    row.append(name, email, category, verified, status, actions);
    rows.append(row);
  }
  document.querySelector("[data-empty-state]").hidden = matches.length > 0;
}

function renderCourses() {
  const rows = document.querySelector("[data-course-rows]");
  if (!rows) return;
  const query = document.querySelector("[data-course-search]").value.trim().toLowerCase();
  const matches = courses.filter((course) => `${course.courseId} ${course.title} ${course.category}`.toLowerCase().includes(query));
  rows.replaceChildren();
  for (const course of matches) {
    const row = document.createElement("tr");
    const values = [
      course.courseId || "—",
      course.title || "Untitled course",
      course.category || "—",
      course.creatorId || "—",
      course.cost === "" || course.cost == null ? "—" : `$${Number(course.cost).toFixed(2)}`,
      course.completed ? "Yes" : "No",
      course.enrolled ?? "0",
      course.rating ?? "0",
      course.publishedOn || "—",
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    }
    rows.append(row);
  }
  const emptyState = document.querySelector("[data-course-empty-state]");
  emptyState.hidden = matches.length > 0;
  emptyState.textContent = courses.length && query ? "No courses match your search." : "No courses yet. Create a course to see it listed here.";
}

document.querySelector("[data-logout]")?.addEventListener("click", (event) => {
  event.preventDefault();
  showToast("You are logged out.");
});

document.querySelectorAll("[data-user-form]").forEach((form) => {
  applyValues(form, draft);
  form.addEventListener("input", (event) => {
    if (event.target.name === "email") event.target.setCustomValidity("");
    saveDraft(form);
  });
  form.addEventListener("change", () => saveDraft(form));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const path = window.location.pathname;
    if (path === "/users/new") {
      const email = form.elements.email;
      email.setCustomValidity(uniqueEmail(email.value) ? "" : "A user with this email address already exists.");
    }
    if (!form.reportValidity()) return;
    saveDraft(form);
    if (path === "/users/new") {
      window.location.assign("/users/new/profile");
      return;
    }
    if (path === "/users/new/profile") {
      window.location.assign("/users/new/preferences");
      return;
    }
    const newUser = {
      ...draft,
      ...Object.fromEntries(new FormData(form)),
      emailVerified: Boolean(draft.emailVerified),
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `user-${Date.now()}`,
      approvalStatus: "Approved",
    };
    if (!uniqueEmail(newUser.email)) {
      showToast("A user with this email address already exists.", true);
      return;
    }
    users.unshift(newUser);
    if (!saveUsers()) return;
    try {
      localStorage.removeItem(draftKey);
      window.location.assign("/users/list");
    } catch (error) {
      showToast(`User created, but the saved draft could not be cleared: ${error.message}`, true);
      window.setTimeout(() => window.location.assign("/users/list"), 1800);
    }
  });
});

document.querySelector("[data-user-search]")?.addEventListener("input", renderUsers);

document.querySelector("[data-user-rows]")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-user-action]");
  if (!button) return;
  const user = users.find((item) => item.id === button.dataset.userId);
  if (!user) {
    showToast("That user could not be found.", true);
    return;
  }
  if (button.dataset.userAction === "edit") {
    window.location.assign(`/users/edit?id=${encodeURIComponent(user.id)}`);
    return;
  }
  if (!window.confirm(`Delete ${user.firstName || "this user"} ${user.lastName || ""}?`)) return;
  users = users.filter((item) => item.id !== user.id);
  if (saveUsers()) {
    renderUsers();
    showToast("User deleted.");
  }
});

document.querySelector("[data-course-search]")?.addEventListener("input", renderCourses);

const courseEntryForm = document.querySelector("[data-course-entry-form]");
if (courseEntryForm) {
  const courseSteps = [...courseEntryForm.querySelectorAll("[data-course-step]")];
  const stepStatus = courseEntryForm.querySelector("[data-course-step-status]");
  const previousButton = courseEntryForm.querySelector("[data-course-previous]");
  const nextButton = courseEntryForm.querySelector("[data-course-next]");
  const createButton = courseEntryForm.querySelector("[data-course-submit]");
  let activeCourseStep = 0;

  function showCourseStep(index, focusFirstField = true) {
    activeCourseStep = index;
    courseSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== index; });
    stepStatus.textContent = `Step ${index + 1} of ${courseSteps.length}`;
    previousButton.hidden = index === 0;
    nextButton.hidden = index === courseSteps.length - 1;
    createButton.hidden = index !== courseSteps.length - 1;
    if (focusFirstField) {
      courseSteps[index].querySelector('input:not([type="checkbox"]), textarea')?.focus();
    }
  }

  function validateCurrentCourseStep() {
    const controls = courseSteps[activeCourseStep].querySelectorAll("input, textarea, select");
    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function validateCourseId() {
    const courseId = courseEntryForm.elements.courseId;
    const duplicate = courses.some((course) => String(course.courseId).toLowerCase() === courseId.value.trim().toLowerCase());
    courseId.setCustomValidity(duplicate ? "A course with this ID already exists." : "");
    if (duplicate) {
      showCourseStep(0);
      courseId.reportValidity();
      return false;
    }
    return true;
  }

  previousButton.addEventListener("click", () => showCourseStep(activeCourseStep - 1));
  nextButton.addEventListener("click", () => {
    if (!validateCurrentCourseStep()) return;
    if (activeCourseStep === 0 && !validateCourseId()) return;
    showCourseStep(activeCourseStep + 1);
  });

  courseEntryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateCurrentCourseStep()) return;
    if (activeCourseStep < courseSteps.length - 1) {
      if (activeCourseStep === 0 && !validateCourseId()) return;
      showCourseStep(activeCourseStep + 1);
      return;
    }
    if (!validateCourseId()) return;

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    values.courseId = values.courseId.trim();
    values.completed = form.elements.completed.checked;
    values.cost = values.cost === "" ? "" : Number(values.cost);
    values.enrolled = Number(values.enrolled || 0);
    values.rating = Number(values.rating || 0);
    courses.unshift(values);
    if (!saveCourses()) {
      courses.shift();
      return;
    }
    window.location.assign("/courses/list");
  });

  courseEntryForm.elements.courseId.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
  });
}

const editForm = document.querySelector("[data-edit-form]");
if (editForm) {
  const userId = new URLSearchParams(window.location.search).get("id");
  const user = users.find((item) => item.id === userId);
  const formError = document.querySelector("[data-form-error]");
  if (!user) {
    formError.textContent = "The requested user could not be found.";
    formError.hidden = false;
    editForm.querySelectorAll("input, button").forEach((field) => { field.disabled = true; });
  } else {
    applyValues(editForm, user);
    editForm.elements.password.value = "";
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(editForm));
      values.emailVerified = editForm.elements.emailVerified.checked;
      if (!uniqueEmail(values.email, user.id)) {
        formError.textContent = "A user with this email address already exists.";
        formError.hidden = false;
        editForm.elements.email.focus();
        return;
      }
      Object.assign(user, values);
      if (values.password) delete user.password;
      user.approvalStatus = user.approvalStatus || "Approved";
      if (saveUsers()) window.location.assign("/users/list");
    });
  }
}

renderUsers();
renderCourses();
