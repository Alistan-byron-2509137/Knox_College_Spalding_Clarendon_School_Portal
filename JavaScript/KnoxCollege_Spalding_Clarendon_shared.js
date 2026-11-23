/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_shared.js
  PURPOSE: Code shared by every page. It handles
    1. the "database" (localStorage) and the sample data,
    2. the simulated login session (sessionStorage),
    3. small helper functions for the DOM, forms and tables,
    4. the money (tuition) and grade calculations.
  Every other script file loads AFTER this one.
*/

// ---------------------------------------------------------------
// 1. SETTINGS AND STORAGE KEYS
// ---------------------------------------------------------------

// Each list of records is saved under its own key in localStorage.
const KEYS = {
  students: "knox_students",
  teachers: "knox_teachers",
  subjects: "knox_subjects",
  classes: "knox_classes",
  grades: "knox_grades",
  payments: "knox_payments",
  announcements: "knox_announcements",
  messages: "knox_messages",
  users: "knox_users",
  ready: "knox_data_ready", // tells us the sample data was already added
  session: "knox_session"   // stored in sessionStorage (cleared when the tab closes)
};

const SEMESTERS = ["Semester 1 (2026/2027)", "Semester 2 (2026/2027)"];
const CURRENT_SEMESTER = SEMESTERS[0];
const PAYMENT_METHODS = ["Cash", "Bank Deposit", "Online Transfer", "Cheque"];

// ---------------------------------------------------------------
// 2. READING AND WRITING THE "DATABASE"
// ---------------------------------------------------------------

// Read a list (array) from localStorage. If nothing is saved yet, or the
// saved text is damaged, return an empty list so the page does not crash.
function loadList(key) {
  const text = localStorage.getItem(key);
  if (text === null) {
    return [];
  }
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Save a list (array) into localStorage as text.
function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

// ---------------------------------------------------------------
// 3. SAMPLE DATA (added the first time any page is opened)
// ---------------------------------------------------------------
// NOTE: The student, payment and grade records below are FICTIONAL sample
// data made only for this assignment. Real student data is never used.

function makeSampleUsers() {
  return [
    { username: "admin", password: "Admin@123", role: "admin", name: "System Administrator", teacherId: "" },
    { username: "teacher", password: "Teacher@123", role: "teacher", name: "Demo Teacher", teacherId: "T000" },
    { username: "mr.brown", password: "Teacher@123", role: "teacher", name: "Mr. Brown", teacherId: "T001" },
    { username: "miss.black", password: "Teacher@123", role: "teacher", name: "Miss Black", teacherId: "T002" },
    { username: "miss.williams", password: "Teacher@123", role: "teacher", name: "Miss Williams", teacherId: "T003" },
    { username: "miss.gray", password: "Teacher@123", role: "teacher", name: "Miss Gray", teacherId: "T004" },
    { username: "viewer", password: "Viewer@123", role: "viewer", name: "Office Viewer", teacherId: "" }
  ];
}

function makeSampleTeachers() {
  return [
    { id: "T000", name: "Demo Teacher", showInDirectory: false },
    { id: "T001", name: "Mr. Brown", showInDirectory: true },
    { id: "T002", name: "Miss Black", showInDirectory: true },
    { id: "T003", name: "Miss Williams", showInDirectory: true },
    { id: "T004", name: "Miss Gray", showInDirectory: true }
  ];
}

function makeSampleSubjects() {
  return [
    { id: "S001", name: "Mathematics", code: "MATH", teacherId: "T001" },
    { id: "S002", name: "English Language", code: "ENGL", teacherId: "T002" },
    { id: "S003", name: "English Literature", code: "LIT", teacherId: "T003" },
    { id: "S004", name: "Information Technology", code: "IT", teacherId: "T004" },
    { id: "S005", name: "Spanish", code: "SPAN", teacherId: "T000" },
    { id: "S006", name: "French", code: "FREN", teacherId: "T000" },
    { id: "S007", name: "Electrical Technology", code: "ELEC", teacherId: "T000" }
  ];
}

function makeSampleClasses() {
  return [
    { id: "C9A", name: "Grade 9A" },
    { id: "C10A", name: "Grade 10A" },
    { id: "C11A", name: "Grade 11A" }
  ];
}

function makeSampleStudents() {
  // Each row: id, first name, last name, date of birth, gender, residence, class, guardian, guardian phone
  const rows = [
    ["KC26001", "Andre", "Campbell", "2012-03-14", "Male", "Day Student", "C9A", "Sample Guardian One", "876-555-0101"],
    ["KC26002", "Shanice", "Reid", "2012-07-22", "Female", "Boarder", "C9A", "Sample Guardian Two", "876-555-0102"],
    ["KC26003", "Tyrone", "Palmer", "2012-01-09", "Male", "Day Student", "C9A", "Sample Guardian Three", "876-555-0103"],
    ["KC26004", "Keisha", "Morgan", "2011-11-30", "Female", "Boarder", "C9A", "Sample Guardian Four", "876-555-0104"],
    ["KC26005", "Jordan", "Henry", "2011-05-18", "Male", "Day Student", "C10A", "Sample Guardian Five", "876-555-0105"],
    ["KC26006", "Camille", "Francis", "2011-09-02", "Female", "Boarder", "C10A", "Sample Guardian Six", "876-555-0106"],
    ["KC26007", "Devon", "Walker", "2010-12-25", "Male", "Day Student", "C10A", "Sample Guardian Seven", "876-555-0107"],
    ["KC26008", "Tiana", "Mitchell", "2011-02-11", "Female", "Boarder", "C10A", "Sample Guardian Eight", "876-555-0108"],
    ["KC26009", "Marcus", "Powell", "2010-04-06", "Male", "Boarder", "C11A", "Sample Guardian Nine", "876-555-0109"],
    ["KC26010", "Alicia", "Grant", "2010-08-19", "Female", "Day Student", "C11A", "Sample Guardian Ten", "876-555-0110"],
    ["KC26011", "Ricardo", "Bailey", "2009-10-27", "Male", "Boarder", "C11A", "Sample Guardian Eleven", "876-555-0111"],
    ["KC26012", "Nadine", "Clarke", "2010-06-15", "Female", "Day Student", "C11A", "Sample Guardian Twelve", "876-555-0112"]
  ];

  // Due dates: the first 5 students are due on a date that has already passed,
  // the rest are due in the future. This lets the demo show every status.
  const students = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isBoarder = row[5] === "Boarder";
    students.push({
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      dob: row[3],
      gender: row[4],
      residence: row[5],
      classId: row[6],
      semester: CURRENT_SEMESTER,
      guardianName: row[7],
      guardianPhone: row[8],
      email: "",
      address: "Sample address, Clarendon",
      tuitionDue: isBoarder ? 165000 : 90000, // sample amounts only
      dueDate: i < 5 ? "2026-10-15" : "2027-01-15"
    });
  }
  return students;
}

function makeSamplePayments() {
  return [
    { id: "P001", studentId: "KC26001", date: "2026-09-05", amount: 90000, method: "Bank Deposit", note: "Full payment" },
    { id: "P002", studentId: "KC26002", date: "2026-09-12", amount: 60000, method: "Cash", note: "First instalment" },
    { id: "P003", studentId: "KC26003", date: "2026-11-02", amount: 40000, method: "Online Transfer", note: "Part payment" },
    { id: "P004", studentId: "KC26006", date: "2026-09-20", amount: 165000, method: "Bank Deposit", note: "Full payment" },
    { id: "P005", studentId: "KC26008", date: "2026-11-10", amount: 80000, method: "Cash", note: "Part payment" },
    { id: "P006", studentId: "KC26010", date: "2026-11-15", amount: 90000, method: "Cheque", note: "Full payment" },
    { id: "P007", studentId: "KC26011", date: "2026-11-18", amount: 100000, method: "Online Transfer", note: "Part payment" }
  ];
}

function makeSampleGrades(students, subjects) {
  // Simple formula to make different (but repeatable) sample marks.
  // Some exam marks are left empty (null) so the demo shows missing data.
  const grades = [];
  for (let i = 0; i < students.length; i++) {
    for (let j = 0; j < subjects.length; j++) {
      const base = 48 + ((i * 13 + j * 17) % 47);
      let test1 = base + ((i + j) % 7) - 3;
      let test2 = base + ((i * 3 + j) % 9) - 4;
      let exam = base + ((i + j * 2) % 11) - 5;
      test1 = Math.min(100, Math.max(0, test1));
      test2 = Math.min(100, Math.max(0, test2));
      exam = Math.min(100, Math.max(0, exam));
      if ((i + j) % 9 === 0) {
        exam = null;
      }
      grades.push({
        studentId: students[i].id,
        subjectId: subjects[j].id,
        semester: CURRENT_SEMESTER,
        test1: test1,
        test2: test2,
        exam: exam
      });
    }
  }
  return grades;
}

function makeSampleAnnouncements() {
  return [
    {
      id: "A001",
      title: "Welcome to the Knox College School Portal",
      text: "This portal is a student project built for CIT2011. Use the Login page and the sample accounts to explore the Administrator, Teacher and Viewer dashboards.",
      date: "2026-11-23",
      author: "System Administrator"
    },
    {
      id: "A002",
      title: "Sample notice: tuition statements",
      text: "Tuition amounts, payments and student records in this demo are sample data only. The Administrator can add or change them at any time.",
      date: "2026-11-22",
      author: "System Administrator"
    },
    {
      id: "A003",
      title: "Sample notice: report cards",
      text: "Teachers enter marks on the Teacher Dashboard. Report cards then calculate the averages automatically and can be printed.",
      date: "2026-11-21",
      author: "System Administrator"
    }
  ];
}

// Put all the sample data into localStorage.
function seedAllData() {
  const students = makeSampleStudents();
  const subjects = makeSampleSubjects();
  saveList(KEYS.users, makeSampleUsers());
  saveList(KEYS.teachers, makeSampleTeachers());
  saveList(KEYS.subjects, subjects);
  saveList(KEYS.classes, makeSampleClasses());
  saveList(KEYS.students, students);
  saveList(KEYS.payments, makeSamplePayments());
  saveList(KEYS.grades, makeSampleGrades(students, subjects));
  saveList(KEYS.announcements, makeSampleAnnouncements());
  saveList(KEYS.messages, []);
  localStorage.setItem(KEYS.ready, "yes");
}

// Runs on every page. Adds the sample data only the first time.
function initData() {
  if (localStorage.getItem(KEYS.ready) !== "yes") {
    seedAllData();
  }
}

// Used by the Administrator "Reset sample data" button.
function resetData() {
  seedAllData();
}

// ---------------------------------------------------------------
// 4. SIMULATED LOGIN SESSION
// ---------------------------------------------------------------
// IMPORTANT: This login is only a simulation. The usernames and passwords
// are stored in the browser as plain text, so anyone can read them with
// the developer tools. Real systems check passwords on a server.

function getSession() {
  const text = sessionStorage.getItem(KEYS.session);
  if (text === null) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

// Check the username and password. Returns the user, or null if wrong.
function loginUser(username, password) {
  const users = loadList(KEYS.users);
  for (const user of users) {
    if (user.username === username && user.password === password) {
      const session = {
        username: user.username,
        role: user.role,
        name: user.name,
        teacherId: user.teacherId
      };
      sessionStorage.setItem(KEYS.session, JSON.stringify(session));
      return user;
    }
  }
  return null;
}

function dashboardPageFor(role) {
  if (role === "admin") {
    return "admin-dashboard.html";
  }
  if (role === "teacher") {
    return "teacher-dashboard.html";
  }
  return "viewer-dashboard.html";
}

function logout() {
  sessionStorage.removeItem(KEYS.session);
  window.location.href = "login.html?msg=loggedout";
}

// Used at the top of each dashboard script. If the person is not logged in
// (or has the wrong role) they are sent to the login page.
function requireRole(role) {
  const session = getSession();
  if (session === null) {
    window.location.href = "login.html?msg=login";
    return null;
  }
  if (session.role !== role) {
    window.location.href = "login.html?msg=denied";
    return null;
  }
  // The page starts hidden (class "guard"). Show it now that access is OK.
  document.body.classList.remove("guard");
  return session;
}

// ---------------------------------------------------------------
// 5. NAVIGATION BAR (same on every page)
// ---------------------------------------------------------------

function setupNav() {
  const list = document.getElementById("navLinks");
  if (list === null) {
    return;
  }
  const session = getSession();

  if (session !== null) {
    // Logged in: show Dashboard link and Log out button
    const dashItem = document.createElement("li");
    const dashLink = makeEl("a", "My Dashboard");
    dashLink.href = dashboardPageFor(session.role);
    dashItem.appendChild(dashLink);
    list.appendChild(dashItem);

    const logoutItem = document.createElement("li");
    const logoutButton = makeButton("Log out", "nav-logout", logout);
    logoutItem.appendChild(logoutButton);
    list.appendChild(logoutItem);
  } else {
    const loginItem = document.createElement("li");
    const loginLink = makeEl("a", "Login");
    loginLink.href = "login.html";
    loginItem.appendChild(loginLink);
    list.appendChild(loginItem);
  }

  // Highlight the link for the page we are on
  let current = window.location.pathname.split("/").pop();
  if (current === "") {
    current = "index.html";
  }
  const links = list.querySelectorAll("a");
  links.forEach(function (link) {
    if (link.getAttribute("href") === current) {
      link.setAttribute("aria-current", "page");
    }
  });

  // Menu button for small screens
  const menuButton = document.getElementById("menuButton");
  if (menuButton !== null) {
    menuButton.addEventListener("click", function () {
      const isOpen = list.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }
}

// ---------------------------------------------------------------
// 6. SMALL HELPER FUNCTIONS (DOM, tables, messages)
// ---------------------------------------------------------------

// Remove everything inside an element.
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Make an element with text. textContent is used (not innerHTML) so
// text typed by a user can never run as code.
function makeEl(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  if (className) {
    element.className = className;
  }
  return element;
}

function makeButton(text, className, handler) {
  const button = makeEl("button", text, className);
  button.type = "button";
  button.addEventListener("click", handler);
  return button;
}

// Add one table row. Each cell can be plain text or an element (like a button).
function addRow(tbody, cells, rowClass) {
  const row = document.createElement("tr");
  if (rowClass) {
    row.className = rowClass;
  }
  for (const cell of cells) {
    const td = document.createElement("td");
    if (cell instanceof Node) {
      td.appendChild(cell);
    } else {
      td.textContent = cell;
    }
    row.appendChild(td);
  }
  tbody.appendChild(row);
  return row;
}

// A row that says there is nothing to show.
function addEmptyRow(tbody, columns, text) {
  const row = document.createElement("tr");
  const td = makeEl("td", text, "empty-note");
  td.colSpan = columns;
  row.appendChild(td);
  tbody.appendChild(row);
}

// Fill a <select> list. "items" is an array of {value, label}.
function fillSelect(select, items, firstText) {
  clearElement(select);
  if (firstText) {
    const first = makeEl("option", firstText);
    first.value = "";
    select.appendChild(first);
  }
  for (const item of items) {
    const option = makeEl("option", item.label);
    option.value = item.value;
    select.appendChild(option);
  }
}

// Show a success or error message in a message box.
function showMessage(box, text, type) {
  box.textContent = text;
  box.className = "message " + type;
  box.hidden = false;
}

function hideMessage(box) {
  box.textContent = "";
  box.hidden = true;
}

// Show one section of a dashboard and hide the others.
// Buttons use data-section="name"; sections have id="section-name".
function setupSections(onShow) {
  const buttons = document.querySelectorAll("[data-section]");
  const sections = document.querySelectorAll(".panel-section");

  function show(name) {
    sections.forEach(function (section) {
      section.hidden = section.id !== "section-" + name;
    });
    buttons.forEach(function (button) {
      if (button.getAttribute("data-section") === name) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
    if (onShow) {
      onShow(name);
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      show(button.getAttribute("data-section"));
    });
  });

  if (buttons.length > 0) {
    show(buttons[0].getAttribute("data-section"));
  }
  return show;
}

// Today's date as text like 2026-11-23 (local time)
function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function formatMoney(amount) {
  const number = Number(amount) || 0;
  return "J$" + number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

// Make the next id such as P008 from a list of records.
function nextRecordId(prefix, list) {
  let highest = 0;
  for (const item of list) {
    if (item.id && item.id.startsWith(prefix)) {
      const number = parseInt(item.id.slice(prefix.length), 10);
      if (!Number.isNaN(number) && number > highest) {
        highest = number;
      }
    }
  }
  return prefix + String(highest + 1).padStart(3, "0");
}

// Next free student ID in the style KC26013
function nextStudentId() {
  const students = loadList(KEYS.students);
  let highest = 0;
  for (const student of students) {
    if (/^KC26\d{3}$/.test(student.id)) {
      const number = parseInt(student.id.slice(4), 10);
      if (number > highest) {
        highest = number;
      }
    }
  }
  return "KC26" + String(highest + 1).padStart(3, "0");
}

// ---------------------------------------------------------------
// 7. LOOK-UP HELPERS
// ---------------------------------------------------------------

function findById(list, id) {
  for (const item of list) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

function getStudent(id) {
  return findById(loadList(KEYS.students), id);
}

function fullName(student) {
  return student.firstName + " " + student.lastName;
}

function getClassName(classId) {
  const found = findById(loadList(KEYS.classes), classId);
  if (found === null) {
    return "Not assigned";
  }
  return found.name;
}

function getSubjectName(subjectId) {
  const found = findById(loadList(KEYS.subjects), subjectId);
  if (found === null) {
    return "Unknown subject";
  }
  return found.name;
}

// Teachers marked as demo accounts are shown as "To be confirmed".
function getTeacherLabel(teacherId) {
  const teacher = findById(loadList(KEYS.teachers), teacherId);
  if (teacher === null || teacher.showInDirectory === false) {
    return "To be confirmed";
  }
  return teacher.name;
}

// ---------------------------------------------------------------
// 8. TUITION (MONEY) CALCULATIONS
// ---------------------------------------------------------------

function getPaymentsFor(studentId) {
  const payments = loadList(KEYS.payments);
  return payments.filter(function (payment) {
    return payment.studentId === studentId;
  });
}

// Works out what a student owes.
//   Paid        = nothing left to pay
//   Pending     = a balance is left but the due date has not passed yet
//   Outstanding = a balance is left and the due date has passed
function getFinance(student) {
  const payments = getPaymentsFor(student.id);
  let paid = 0;
  for (const payment of payments) {
    paid += Number(payment.amount);
  }
  const due = Number(student.tuitionDue) || 0;
  const balance = Math.max(Math.round((due - paid) * 100) / 100, 0);

  let status = "Pending";
  if (balance <= 0) {
    status = "Paid";
  } else if (student.dueDate && todayISO() > student.dueDate) {
    status = "Outstanding";
  }
  return { due: due, paid: paid, balance: balance, status: status, payments: payments };
}

// A coloured label for a status. The word is always shown too, so the
// colour is not the only way to tell the statuses apart.
function makeStatusBadge(status) {
  return makeEl("span", status, "badge badge-" + status.toLowerCase());
}

// ---------------------------------------------------------------
// 9. GRADE CALCULATIONS
// ---------------------------------------------------------------

function findGrade(grades, studentId, subjectId, semester) {
  for (const grade of grades) {
    if (grade.studentId === studentId && grade.subjectId === subjectId && grade.semester === semester) {
      return grade;
    }
  }
  return null;
}

// Average of the marks that were entered (blank marks are skipped).
function subjectAverage(record) {
  if (record === null) {
    return null;
  }
  const marks = [];
  const values = [record.test1, record.test2, record.exam];
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      marks.push(Number(value));
    }
  }
  if (marks.length === 0) {
    return null;
  }
  let total = 0;
  for (const mark of marks) {
    total += mark;
  }
  return Math.round((total / marks.length) * 10) / 10;
}

function letterGrade(average) {
  if (average === null) {
    return "N/A";
  }
  if (average >= 80) {
    return "A";
  }
  if (average >= 70) {
    return "B";
  }
  if (average >= 60) {
    return "C";
  }
  if (average >= 50) {
    return "D";
  }
  if (average >= 40) {
    return "E";
  }
  return "F";
}

function remarkFor(average) {
  if (average === null) {
    return "No marks have been entered yet.";
  }
  if (average >= 80) {
    return "Excellent work. Keep it up.";
  }
  if (average >= 70) {
    return "Very good performance.";
  }
  if (average >= 60) {
    return "Good effort. Aim a little higher.";
  }
  if (average >= 50) {
    return "Satisfactory. More revision is needed.";
  }
  return "Needs improvement. Please see the class teachers for help.";
}

// Collects everything a report card needs for one student and semester.
function buildReportData(studentId, semester) {
  const subjects = loadList(KEYS.subjects);
  const grades = loadList(KEYS.grades);
  const rows = [];
  let total = 0;
  let counted = 0;

  for (const subject of subjects) {
    const record = findGrade(grades, studentId, subject.id, semester);
    const average = subjectAverage(record);
    rows.push({
      subjectName: subject.name,
      test1: record === null ? null : record.test1,
      test2: record === null ? null : record.test2,
      exam: record === null ? null : record.exam,
      average: average,
      letter: letterGrade(average)
    });
    if (average !== null) {
      total += average;
      counted++;
    }
  }

  let overall = null;
  if (counted > 0) {
    overall = Math.round((total / counted) * 10) / 10;
  }
  return { rows: rows, overall: overall, letter: letterGrade(overall), subjectsCounted: counted };
}

// Overall average only (used in the reports).
function overallAverageFor(studentId, semester) {
  return buildReportData(studentId, semester).overall;
}

// ---------------------------------------------------------------
// 10. VALIDATION HELPERS
// ---------------------------------------------------------------

function isValidName(text) {
  return /^[A-Za-z][A-Za-z .'-]{1,39}$/.test(text);
}

function isValidStudentId(text) {
  return /^KC\d{5}$/.test(text);
}

function isValidPhone(text) {
  return /^(\+?1[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/.test(text);
}

function isValidEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function ageFromDate(isoDate) {
  const born = new Date(isoDate);
  if (Number.isNaN(born.getTime())) {
    return -1;
  }
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDifference = now.getMonth() - born.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < born.getDate())) {
    age--;
  }
  return age;
}

// Checks one mark typed in a box. A blank box is allowed (no mark yet).
// Returns {ok: true/false, value: number or null}
function parseScore(text) {
  const clean = String(text).trim();
  if (clean === "") {
    return { ok: true, value: null };
  }
  const number = Number(clean);
  if (Number.isNaN(number) || number < 0 || number > 100) {
    return { ok: false, value: null };
  }
  return { ok: true, value: number };
}

// ---------------------------------------------------------------
// 11. START-UP (runs on every page)
// ---------------------------------------------------------------

try {
  initData();
} catch (error) {
  // Browser storage can be blocked (for example in some private modes).
  window.addEventListener("DOMContentLoaded", function () {
    const notice = document.createElement("p");
    notice.className = "message error";
    notice.textContent = "Browser storage is not available, so this portal cannot save or load records. Please allow site data in your browser settings.";
    document.body.insertBefore(notice, document.body.firstChild);
  });
}

// Scripts use "defer", so the page is already built when this runs.
setupNav();

// ---------------------------------------------------------------
// 12. GRADE ENTRY TABLE (used by the Administrator and Teacher pages)
// ---------------------------------------------------------------
// Both dashboards need the same table of marks, so the code lives here.

const MARK_FIELDS = ["test1", "test2", "exam"];
const MARK_LABELS = ["Test 1", "Test 2", "Exam"];

// Filter a list of students by typing in a search box (ID or name).
function searchStudents(students, text) {
  const words = text.trim().toLowerCase();
  if (words === "") {
    return students;
  }
  return students.filter(function (student) {
    const name = fullName(student).toLowerCase();
    return name.includes(words) || student.id.toLowerCase().includes(words);
  });
}

// Show the average and letter for one row while the person types.
function updateRowAverage(rowObject) {
  const marks = [];
  let allGood = true;
  for (let i = 0; i < rowObject.inputs.length; i++) {
    const result = parseScore(rowObject.inputs[i].value);
    marks.push(result);
    if (result.ok) {
      rowObject.inputs[i].classList.remove("invalid");
    } else {
      rowObject.inputs[i].classList.add("invalid");
      allGood = false;
    }
  }
  if (!allGood) {
    rowObject.averageCell.textContent = "Check marks";
    rowObject.letterCell.textContent = "-";
    return;
  }
  const average = subjectAverage({ test1: marks[0].value, test2: marks[1].value, exam: marks[2].value });
  rowObject.averageCell.textContent = average === null ? "-" : String(average);
  rowObject.letterCell.textContent = letterGrade(average);
}

// Build the table rows. Saved marks are filled in so they can be edited.
// Returns a list of "row objects" that the save function reads later.
function renderGradeTable(tbody, students, subjectId, semester) {
  clearElement(tbody);
  const rowObjects = [];
  if (students.length === 0) {
    addEmptyRow(tbody, 7, "No students match these choices.");
    return rowObjects;
  }
  const grades = loadList(KEYS.grades);

  for (const student of students) {
    const record = findGrade(grades, student.id, subjectId, semester);
    const inputs = [];
    const cells = [student.id, fullName(student)];

    for (let i = 0; i < MARK_FIELDS.length; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.maxLength = 5;
      input.className = "score-input";
      input.setAttribute("aria-label", MARK_LABELS[i] + " mark for " + fullName(student));
      if (record !== null && record[MARK_FIELDS[i]] !== null && record[MARK_FIELDS[i]] !== undefined) {
        input.value = record[MARK_FIELDS[i]];
      }
      inputs.push(input);
      cells.push(input);
    }

    const averageCell = makeEl("span", "-");
    const letterCell = makeEl("span", "-");
    cells.push(averageCell);
    cells.push(letterCell);

    const row = addRow(tbody, cells);
    const rowObject = { student: student, inputs: inputs, averageCell: averageCell, letterCell: letterCell, row: row };
    updateRowAverage(rowObject);
    for (const input of inputs) {
      input.addEventListener("input", function () {
        updateRowAverage(rowObject);
      });
    }
    rowObjects.push(rowObject);
  }
  return rowObjects;
}

// Check every mark in the table. Returns the good records and the error count.
function readGradeTable(rowObjects) {
  const records = [];
  let errors = 0;
  for (const rowObject of rowObjects) {
    const marks = [];
    let rowIsBad = false;
    for (let i = 0; i < rowObject.inputs.length; i++) {
      const result = parseScore(rowObject.inputs[i].value);
      marks.push(result);
      if (!result.ok) {
        rowIsBad = true;
        rowObject.inputs[i].classList.add("invalid");
      }
    }
    if (rowIsBad) {
      errors++;
    } else {
      records.push({ studentId: rowObject.student.id, test1: marks[0].value, test2: marks[1].value, exam: marks[2].value });
    }
  }
  return { records: records, errors: errors };
}

// Save a batch of marks into localStorage (add new records, update old ones).
function saveGradeRecords(records, subjectId, semester) {
  const grades = loadList(KEYS.grades);
  for (const record of records) {
    const existing = findGrade(grades, record.studentId, subjectId, semester);
    const allBlank = record.test1 === null && record.test2 === null && record.exam === null;
    if (allBlank) {
      if (existing !== null) {
        grades.splice(grades.indexOf(existing), 1);
      }
    } else if (existing !== null) {
      existing.test1 = record.test1;
      existing.test2 = record.test2;
      existing.exam = record.exam;
    } else {
      grades.push({
        studentId: record.studentId,
        subjectId: subjectId,
        semester: semester,
        test1: record.test1,
        test2: record.test2,
        exam: record.exam
      });
    }
  }
  saveList(KEYS.grades, grades);
  return records.length;
}

// ---------------------------------------------------------------
// 13. STUDENT PROFILE VIEW (read-only, used by Administrator and Viewer)
// ---------------------------------------------------------------

function makeTable(headings, caption) {
  const wrap = makeEl("div", null, "table-wrap");
  const table = document.createElement("table");
  if (caption) {
    table.appendChild(makeEl("caption", caption));
  }
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const heading of headings) {
    const th = makeEl("th", heading);
    th.scope = "col";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  wrap.appendChild(table);
  return { wrap: wrap, tbody: tbody };
}

// Shows profile + academic record + financial statement inside "container".
// Nothing here changes the stored data.
function renderStudentProfile(container, student) {
  clearElement(container);
  container.appendChild(makeEl("h3", fullName(student) + " (" + student.id + ")"));

  const details = [
    ["Class", getClassName(student.classId)],
    ["Semester", student.semester],
    ["Residence", student.residence],
    ["Gender", student.gender],
    ["Date of birth", student.dob + " (age " + ageFromDate(student.dob) + ")"],
    ["Guardian", student.guardianName],
    ["Guardian phone", student.guardianPhone],
    ["Email", student.email ? student.email : "Not provided"],
    ["Address", student.address ? student.address : "Not provided"]
  ];
  const list = makeEl("dl", null, "profile-grid");
  for (const pair of details) {
    const group = document.createElement("div");
    group.appendChild(makeEl("dt", pair[0]));
    group.appendChild(makeEl("dd", pair[1]));
    list.appendChild(group);
  }
  container.appendChild(list);

  // Academic record
  container.appendChild(makeEl("h3", "Academic record: " + student.semester));
  const report = buildReportData(student.id, student.semester);
  const academic = makeTable(["Subject", "Test 1", "Test 2", "Exam", "Average", "Grade"]);
  for (const row of report.rows) {
    addRow(academic.tbody, [
      row.subjectName, formatScore(row.test1), formatScore(row.test2), formatScore(row.exam),
      row.average === null ? "-" : String(row.average), row.letter
    ]);
  }
  addRow(academic.tbody, [
    makeEl("strong", "Overall average"), "", "", "",
    makeEl("strong", report.overall === null ? "-" : String(report.overall)),
    makeEl("strong", report.letter)
  ]);
  container.appendChild(academic.wrap);

  // Financial statement
  renderFinanceStatement(container, student);
}

// Shows the tuition summary and payment history for one student.
function renderFinanceStatement(container, student) {
  container.appendChild(makeEl("h3", "Financial statement"));
  const finance = getFinance(student);
  const summary = makeTable(["Tuition due", "Total paid", "Balance", "Due date", "Status"]);
  addRow(summary.tbody, [
    formatMoney(finance.due), formatMoney(finance.paid), formatMoney(finance.balance),
    student.dueDate ? student.dueDate : "Not set", makeStatusBadge(finance.status)
  ]);
  container.appendChild(summary.wrap);

  const history = makeTable(["Date", "Amount", "Method", "Note"], "Payment history");
  if (finance.payments.length === 0) {
    addEmptyRow(history.tbody, 4, "No payments recorded yet.");
  } else {
    const sorted = finance.payments.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    for (const payment of sorted) {
      addRow(history.tbody, [payment.date, formatMoney(payment.amount), payment.method, payment.note ? payment.note : "-"]);
    }
  }
  container.appendChild(history.wrap);
}

// ---------------------------------------------------------------
// 14. DROP-DOWN OPTIONS USED ON SEVERAL PAGES
// ---------------------------------------------------------------

// Lists of {value, label} for fillSelect()
function classOptions() {
  return loadList(KEYS.classes).map(function (item) {
    return { value: item.id, label: item.name };
  });
}

function semesterOptions() {
  return SEMESTERS.map(function (name) {
    return { value: name, label: name };
  });
}

function studentOptions(students) {
  return students.map(function (student) {
    return { value: student.id, label: student.id + " - " + fullName(student) };
  });
}
