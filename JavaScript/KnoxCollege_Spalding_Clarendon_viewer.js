/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_viewer.js
  PURPOSE: Code for viewer-dashboard.html (General Authorized User).
    - Search and filter students.
    - Show a student's profile, academic record and financial statement.
    - Show reports with simple bar charts.
  READ-ONLY: this file never calls saveList() or any function that
  changes records. It only reads data and shows it.
  Uses the shared functions from KnoxCollege_Spalding_Clarendon_shared.js
*/

// Only a Viewer may stay on this page.
const session = requireRole("viewer");

// ---------------------------------------------------------------
// STUDENT SEARCH
// ---------------------------------------------------------------
function renderSearch() {
  const tbody = document.getElementById("vTable");
  clearElement(tbody);

  let students = loadList(KEYS.students);
  const classId = document.getElementById("vClass").value;
  const semester = document.getElementById("vSemester").value;
  const status = document.getElementById("vStatus").value;

  if (classId !== "") {
    students = students.filter(function (student) {
      return student.classId === classId;
    });
  }
  if (semester !== "") {
    students = students.filter(function (student) {
      return student.semester === semester;
    });
  }
  if (status !== "") {
    students = students.filter(function (student) {
      return getFinance(student).status === status;
    });
  }
  students = searchStudents(students, document.getElementById("vSearch").value);

  document.getElementById("vCount").textContent = "Found " + students.length + " student(s).";

  if (students.length === 0) {
    addEmptyRow(tbody, 7, "No students match your search.");
    return;
  }
  for (const student of students) {
    const average = overallAverageFor(student.id, student.semester);
    const viewButton = makeButton("View", "btn btn-small", function () {
      showProfile(student.id);
    });
    addRow(tbody, [
      student.id, fullName(student), getClassName(student.classId), student.semester,
      average === null ? "-" : String(average), makeStatusBadge(getFinance(student).status), viewButton
    ]);
  }
}

function showProfile(id) {
  const student = getStudent(id);
  if (student === null) {
    return;
  }
  const panel = document.getElementById("vProfile");
  renderStudentProfile(panel, student);
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------

// One bar of a bar chart. The bar is a <div> whose width is a percentage.
function addBar(container, label, percent, cssClass, valueText) {
  const row = makeEl("div", null, "bar-row");
  row.appendChild(makeEl("span", label));
  const track = makeEl("div", null, "bar-track");
  const fill = makeEl("div", null, "bar-fill " + cssClass);
  fill.style.width = Math.max(0, Math.min(100, percent)) + "%";
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(makeEl("span", valueText));
  container.appendChild(row);
}

function renderReport() {
  const classId = document.getElementById("rpClass").value;
  const semester = document.getElementById("rpSemester").value;

  let students = loadList(KEYS.students);
  if (classId !== "") {
    students = students.filter(function (student) {
      return student.classId === classId;
    });
  }
  if (semester !== "") {
    students = students.filter(function (student) {
      return student.semester === semester;
    });
  }

  // Summary numbers and the table
  const tbody = document.getElementById("rpTable");
  clearElement(tbody);
  let averageTotal = 0;
  let averageCount = 0;
  let collected = 0;
  let balance = 0;
  const statusCounts = { Paid: 0, Pending: 0, Outstanding: 0 };

  if (students.length === 0) {
    addEmptyRow(tbody, 6, "No students match these choices.");
  }
  for (const student of students) {
    const report = buildReportData(student.id, student.semester);
    const finance = getFinance(student);
    if (report.overall !== null) {
      averageTotal += report.overall;
      averageCount++;
    }
    collected += finance.paid;
    balance += finance.balance;
    statusCounts[finance.status]++;
    addRow(tbody, [
      fullName(student), getClassName(student.classId),
      report.overall === null ? "-" : String(report.overall), report.letter,
      formatMoney(finance.balance), makeStatusBadge(finance.status)
    ]);
  }

  document.getElementById("rpStudents").textContent = students.length;
  document.getElementById("rpAverage").textContent =
    averageCount === 0 ? "-" : String(Math.round((averageTotal / averageCount) * 10) / 10);
  document.getElementById("rpCollected").textContent = formatMoney(collected);
  document.getElementById("rpBalance").textContent = formatMoney(balance);

  // Bar chart 1: average mark for each subject
  const subjectBars = document.getElementById("subjectBars");
  clearElement(subjectBars);
  const subjects = loadList(KEYS.subjects);
  const grades = loadList(KEYS.grades);
  for (const subject of subjects) {
    let total = 0;
    let counted = 0;
    for (const student of students) {
      const average = subjectAverage(findGrade(grades, student.id, subject.id, student.semester));
      if (average !== null) {
        total += average;
        counted++;
      }
    }
    if (counted === 0) {
      addBar(subjectBars, subject.name, 0, "", "-");
    } else {
      const subjectAverageValue = Math.round((total / counted) * 10) / 10;
      addBar(subjectBars, subject.name, subjectAverageValue, "", String(subjectAverageValue));
    }
  }

  // Bar chart 2: how many students are Paid, Pending or Outstanding
  const statusBars = document.getElementById("statusBars");
  clearElement(statusBars);
  const names = ["Paid", "Pending", "Outstanding"];
  for (const name of names) {
    let percent = 0;
    if (students.length > 0) {
      percent = (statusCounts[name] / students.length) * 100;
    }
    addBar(statusBars, name, percent, name.toLowerCase(), String(statusCounts[name]));
  }
}

// ---------------------------------------------------------------
// START
// ---------------------------------------------------------------
function startViewerPage() {
  document.getElementById("welcomeText").textContent = "Signed in as " + session.name;

  fillSelect(document.getElementById("vClass"), classOptions(), "All classes");
  fillSelect(document.getElementById("vSemester"), semesterOptions(), "All semesters");
  fillSelect(document.getElementById("rpClass"), classOptions(), "All classes");
  fillSelect(document.getElementById("rpSemester"), semesterOptions(), "All semesters");

  const searchControls = ["vSearch", "vClass", "vSemester", "vStatus"];
  for (const id of searchControls) {
    const control = document.getElementById(id);
    control.addEventListener(control.tagName === "SELECT" ? "change" : "input", renderSearch);
  }
  document.getElementById("rpClass").addEventListener("change", renderReport);
  document.getElementById("rpSemester").addEventListener("change", renderReport);
  document.getElementById("rpPrint").addEventListener("click", function () {
    window.print();
  });

  // Draw each section again whenever it is opened, so it shows the newest data
  setupSections(function (name) {
    if (name === "search") {
      renderSearch();
    } else if (name === "reports") {
      renderReport();
    }
  });
}

if (session !== null) {
  startViewerPage();
}
