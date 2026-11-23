/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_teacher.js
  PURPOSE: Code for teacher-dashboard.html (Teachers only).
    - Step 1: choose one of YOUR subjects, Step 2: class, Step 3: semester.
    - Load the students, filter them, enter marks for the whole class
      at once (batch) and save them.
    - Generate and print report cards with automatic averages.
  Uses the shared functions from KnoxCollege_Spalding_Clarendon_shared.js
*/

// Only a Teacher may stay on this page.
const session = requireRole("teacher");

// The table of marks that is on the screen right now
let gradeRows = [];
let chosenSubjectId = "";
let chosenSemester = "";

// The subjects that belong to the teacher who is logged in
function mySubjects() {
  return loadList(KEYS.subjects).filter(function (subject) {
    return subject.teacherId === session.teacherId;
  });
}

// ---------------------------------------------------------------
// GRADE ENTRY: the three steps
// ---------------------------------------------------------------
function updateLoadButton() {
  const ready =
    document.getElementById("tSubject").value !== "" &&
    document.getElementById("tClass").value !== "" &&
    document.getElementById("tSemester").value !== "";
  document.getElementById("tLoad").disabled = !ready;
}

function setupSteps() {
  const subjectSelect = document.getElementById("tSubject");
  const classSelect = document.getElementById("tClass");
  const semesterSelect = document.getElementById("tSemester");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const box = document.getElementById("teacherMessage");

  const subjects = mySubjects().map(function (subject) {
    return { value: subject.id, label: subject.name };
  });
  fillSelect(subjectSelect, subjects, "Choose a subject");
  fillSelect(classSelect, classOptions(), "Choose a class");
  fillSelect(semesterSelect, semesterOptions(), "Choose a semester");
  semesterSelect.value = CURRENT_SEMESTER;

  if (subjects.length === 0) {
    showMessage(box, "No subjects are assigned to you yet. Ask the Administrator to assign one.", "error");
    subjectSelect.disabled = true;
  }

  // Step 1 -> Step 2
  subjectSelect.addEventListener("change", function () {
    const chosen = subjectSelect.value !== "";
    step2.disabled = !chosen;
    if (!chosen) {
      classSelect.value = "";
      step3.disabled = true;
    }
    updateLoadButton();
  });

  // Step 2 -> Step 3
  classSelect.addEventListener("change", function () {
    step3.disabled = classSelect.value === "";
    updateLoadButton();
  });

  semesterSelect.addEventListener("change", updateLoadButton);
}

// Show the students and their saved marks
function loadStudents() {
  const box = document.getElementById("teacherMessage");
  hideMessage(box);

  const subjectId = document.getElementById("tSubject").value;
  const classId = document.getElementById("tClass").value;
  const semester = document.getElementById("tSemester").value;

  // Safety check: a teacher may only enter marks for their own subjects
  const allowed = mySubjects().some(function (subject) {
    return subject.id === subjectId;
  });
  if (!allowed) {
    showMessage(box, "You can only enter marks for your own subjects.", "error");
    return;
  }

  const students = loadList(KEYS.students).filter(function (student) {
    return student.classId === classId && student.semester === semester;
  });

  chosenSubjectId = subjectId;
  chosenSemester = semester;
  gradeRows = renderGradeTable(document.getElementById("tGradeTable"), students, subjectId, semester);

  document.getElementById("gradeTitle").textContent =
    getSubjectName(subjectId) + " | " + getClassName(classId) + " | " + semester;
  document.getElementById("tSearch").value = "";
  document.getElementById("tMissing").checked = false;
  document.getElementById("gradeArea").hidden = false;
  document.getElementById("tSave").hidden = gradeRows.length === 0;
  applyFilter();
  showClassAverage();
}

// Student filtering: hide rows instead of rebuilding the table,
// so marks that were typed but not saved yet are not lost.
function applyFilter() {
  const text = document.getElementById("tSearch").value.trim().toLowerCase();
  const missingOnly = document.getElementById("tMissing").checked;
  let shown = 0;

  for (const rowObject of gradeRows) {
    const student = rowObject.student;
    const matchesText = text === "" ||
      fullName(student).toLowerCase().includes(text) ||
      student.id.toLowerCase().includes(text);
    const hasMissing = rowObject.inputs.some(function (input) {
      return input.value.trim() === "";
    });
    const visible = matchesText && (!missingOnly || hasMissing);
    rowObject.row.hidden = !visible;
    if (visible) {
      shown++;
    }
  }

  const count = document.getElementById("tCount");
  if (gradeRows.length === 0) {
    count.textContent = "There are no students in this class and semester.";
  } else {
    count.textContent = "Showing " + shown + " of " + gradeRows.length + " student(s).";
  }
}

// Batch save: every mark in the table is checked, then saved together
function saveMarks() {
  const box = document.getElementById("teacherMessage");
  const result = readGradeTable(gradeRows);
  if (result.errors > 0) {
    showMessage(box, result.errors + " row(s) have a mark that is not a number from 0 to 100. Fix the red boxes and save again.", "error");
    return;
  }
  const saved = saveGradeRecords(result.records, chosenSubjectId, chosenSemester);
  showMessage(box, "Saved marks for " + saved + " student(s) in " + getSubjectName(chosenSubjectId) + ".", "success");
  showClassAverage();
}

// Average of the saved subject averages for the students in the table
function showClassAverage() {
  const line = document.getElementById("tClassAverage");
  const grades = loadList(KEYS.grades);
  let total = 0;
  let counted = 0;
  for (const rowObject of gradeRows) {
    const record = findGrade(grades, rowObject.student.id, chosenSubjectId, chosenSemester);
    const average = subjectAverage(record);
    if (average !== null) {
      total += average;
      counted++;
    }
  }
  if (counted === 0) {
    line.textContent = "No saved marks yet for this class.";
  } else {
    const classAverage = Math.round((total / counted) * 10) / 10;
    line.textContent = "Saved class average for " + getSubjectName(chosenSubjectId) + ": " +
      classAverage + " (" + letterGrade(classAverage) + ") from " + counted + " student(s).";
  }
}

// ---------------------------------------------------------------
// REPORT CARDS
// ---------------------------------------------------------------
function setupReportCards() {
  const classSelect = document.getElementById("rClass");
  const studentSelect = document.getElementById("rStudent");
  const semesterSelect = document.getElementById("rSemester");

  fillSelect(classSelect, classOptions(), "Choose a class");
  fillSelect(semesterSelect, semesterOptions(), "Choose a semester");
  semesterSelect.value = CURRENT_SEMESTER;
  fillSelect(studentSelect, [], "Choose a class first");

  // Only list the students of the chosen class
  classSelect.addEventListener("change", function () {
    const members = loadList(KEYS.students).filter(function (student) {
      return student.classId === classSelect.value;
    });
    if (classSelect.value === "") {
      fillSelect(studentSelect, [], "Choose a class first");
    } else {
      fillSelect(studentSelect, studentOptions(members), "Choose a student");
    }
  });

  document.getElementById("rGenerate").addEventListener("click", generateReportCard);
  document.getElementById("rPrint").addEventListener("click", function () {
    window.print();
  });
}

function generateReportCard() {
  const box = document.getElementById("reportMessage");
  hideMessage(box);
  const studentId = document.getElementById("rStudent").value;
  const semester = document.getElementById("rSemester").value;

  if (studentId === "" || semester === "") {
    showMessage(box, "Please choose a class, a student and a semester.", "error");
    return;
  }
  const student = getStudent(studentId);
  if (student === null) {
    showMessage(box, "That student could not be found.", "error");
    return;
  }
  renderReportCard(document.getElementById("reportCard"), student, semester);
  document.getElementById("reportArea").hidden = false;
}

// Build the report card on the page
function renderReportCard(container, student, semester) {
  clearElement(container);
  const report = buildReportData(student.id, semester);

  // Heading with the school emblem
  const head = makeEl("div", null, "report-head");
  const logo = document.createElement("img");
  logo.src = "Assets/KnoxCollege_Spalding_Clarendon_logo.svg";
  logo.alt = "";
  head.appendChild(logo);
  const titles = document.createElement("div");
  titles.appendChild(makeEl("h2", "Knox College"));
  titles.appendChild(makeEl("p", "Spalding, Clarendon, Jamaica"));
  titles.appendChild(makeEl("p", "Student report card | " + semester));
  head.appendChild(titles);
  container.appendChild(head);

  // Student details
  const details = [
    ["Student", fullName(student)],
    ["Student ID", student.id],
    ["Class", getClassName(student.classId)],
    ["Residence", student.residence]
  ];
  const list = makeEl("dl", null, "profile-grid");
  for (const pair of details) {
    const group = document.createElement("div");
    group.appendChild(makeEl("dt", pair[0]));
    group.appendChild(makeEl("dd", pair[1]));
    list.appendChild(group);
  }
  container.appendChild(list);

  // Marks table
  const subjects = loadList(KEYS.subjects);
  const table = makeTable(["Subject", "Test 1", "Test 2", "Exam", "Average", "Grade", "Teacher"]);
  for (let i = 0; i < report.rows.length; i++) {
    const row = report.rows[i];
    addRow(table.tbody, [
      row.subjectName, formatScore(row.test1), formatScore(row.test2), formatScore(row.exam),
      row.average === null ? "-" : String(row.average), row.letter, getTeacherLabel(subjects[i].teacherId)
    ]);
  }
  addRow(table.tbody, [
    makeEl("strong", "Overall average"), "", "", "",
    makeEl("strong", report.overall === null ? "-" : String(report.overall)),
    makeEl("strong", report.letter), ""
  ]);
  container.appendChild(table.wrap);

  // Summary
  const missing = report.rows.length - report.subjectsCounted;
  container.appendChild(makeEl("p", "Subjects with marks: " + report.subjectsCounted + " of " + report.rows.length +
    (missing > 0 ? " (" + missing + " subject(s) have no marks yet and are not counted)." : ".")));
  container.appendChild(makeEl("p", "Remark: " + remarkFor(report.overall)));
  container.appendChild(makeEl("p", "Grading scale: A 80-100, B 70-79, C 60-69, D 50-59, E 40-49, F below 40. Subject average = average of the marks entered. Overall average = average of the subject averages.", "source-note"));

  // Signature lines (printed)
  const signatures = makeEl("div", null, "signature-row");
  signatures.appendChild(makeEl("div", "Class teacher signature", "signature-line"));
  signatures.appendChild(makeEl("div", "Principal signature", "signature-line"));
  container.appendChild(signatures);
  container.appendChild(makeEl("p", "Printed on " + todayISO(), "source-note"));
}

// ---------------------------------------------------------------
// START
// ---------------------------------------------------------------
function startTeacherPage() {
  document.getElementById("welcomeText").textContent = "Signed in as " + session.name;
  setupSteps();
  setupReportCards();

  document.getElementById("tLoad").addEventListener("click", loadStudents);
  document.getElementById("tSave").addEventListener("click", saveMarks);
  document.getElementById("tSearch").addEventListener("input", applyFilter);
  document.getElementById("tMissing").addEventListener("change", applyFilter);

  setupSections();
}

if (session !== null) {
  startTeacherPage();
}
