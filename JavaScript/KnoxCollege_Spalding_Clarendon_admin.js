/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_admin.js
  PURPOSE: Code for admin-dashboard.html (Administrator only).
    - CRUD for students (Create, Read, Update, Delete)
    - classes and subjects
    - grade entry grid
    - tuition ledger, payments and status (Paid / Pending / Outstanding)
    - announcements and messages
  Uses the shared functions from KnoxCollege_Spalding_Clarendon_shared.js
*/

// Only an Administrator may stay on this page.
const session = requireRole("admin");

// "editingId" is empty when the form is adding a NEW student.
// When we are editing, it holds the ID the student had before editing.
let editingId = null;

// Remember the grade table that is currently on screen
let gradeRows = [];
let gradeSubjectId = "";
let gradeSemester = "";

// ---------------------------------------------------------------
// Small helpers for this page
// ---------------------------------------------------------------

// Show a list of problems inside a message box.
function showErrors(box, errors) {
  clearElement(box);
  box.className = "message error";
  box.appendChild(makeEl("strong", "Please fix the following:"));
  const list = document.createElement("ul");
  for (const error of errors) {
    list.appendChild(makeEl("li", error));
  }
  box.appendChild(list);
  box.hidden = false;
}

// Fill every drop-down list that depends on saved data.
function fillAllSelects() {
  fillSelect(document.getElementById("classId"), classOptions(), "Choose a class");
  fillSelect(document.getElementById("semester"), semesterOptions(), "Choose a semester");
  fillSelect(document.getElementById("studentClassFilter"), classOptions(), "All classes");
  fillSelect(document.getElementById("studentSemesterFilter"), semesterOptions(), "All semesters");

  const subjects = loadList(KEYS.subjects).map(function (item) {
    return { value: item.id, label: item.name };
  });
  fillSelect(document.getElementById("gradeSubject"), subjects, "Choose a subject");
  fillSelect(document.getElementById("gradeClass"), classOptions(), "Choose a class");
  fillSelect(document.getElementById("gradeSemester"), semesterOptions(), "Choose a semester");

  const students = loadList(KEYS.students).map(function (item) {
    return { value: item.id, label: item.id + " - " + fullName(item) };
  });
  fillSelect(document.getElementById("payStudent"), students, "Choose a student");
  fillSelect(document.getElementById("payMethod"), PAYMENT_METHODS.map(function (name) {
    return { value: name, label: name };
  }), "Choose a method");

  fillTeacherSelect(document.getElementById("subjectTeacher"), "", true);
}

// Teacher drop-down. "withBlank" adds a "To be confirmed" choice.
function fillTeacherSelect(select, selectedId, withBlank) {
  const teachers = loadList(KEYS.teachers).map(function (teacher) {
    let label = teacher.name;
    if (teacher.showInDirectory === false) {
      label = teacher.name + " (testing account)";
    }
    return { value: teacher.id, label: label };
  });
  fillSelect(select, teachers, withBlank ? "To be confirmed" : "");
  select.value = selectedId;
}

// ---------------------------------------------------------------
// OVERVIEW
// ---------------------------------------------------------------
function renderOverview() {
  const students = loadList(KEYS.students);
  let billed = 0;
  let collected = 0;
  let balance = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let outstandingCount = 0;

  for (const student of students) {
    const finance = getFinance(student);
    billed += finance.due;
    collected += finance.paid;
    balance += finance.balance;
    if (finance.status === "Paid") {
      paidCount++;
    } else if (finance.status === "Pending") {
      pendingCount++;
    } else {
      outstandingCount++;
    }
  }

  document.getElementById("statStudents").textContent = students.length;
  document.getElementById("statBilled").textContent = formatMoney(billed);
  document.getElementById("statCollected").textContent = formatMoney(collected);
  document.getElementById("statBalance").textContent = formatMoney(balance);
  document.getElementById("statPaid").textContent = paidCount;
  document.getElementById("statPending").textContent = pendingCount;
  document.getElementById("statOutstanding").textContent = outstandingCount;

  // Class summary table
  const tbody = document.getElementById("classSummaryTable");
  clearElement(tbody);
  const classes = loadList(KEYS.classes);
  if (classes.length === 0) {
    addEmptyRow(tbody, 4, "No classes have been added yet.");
  }
  for (const item of classes) {
    const members = students.filter(function (student) {
      return student.classId === item.id;
    });
    let total = 0;
    let counted = 0;
    let owing = 0;
    for (const student of members) {
      const average = overallAverageFor(student.id, student.semester);
      if (average !== null) {
        total += average;
        counted++;
      }
      if (getFinance(student).status === "Outstanding") {
        owing++;
      }
    }
    const classAverage = counted === 0 ? "-" : (Math.round((total / counted) * 10) / 10).toString();
    addRow(tbody, [item.name, members.length, classAverage, owing]);
  }
}

// ---------------------------------------------------------------
// STUDENTS (CRUD)
// ---------------------------------------------------------------

// READ: show the table, using the search box and the two filters
function renderStudents() {
  const tbody = document.getElementById("studentTable");
  clearElement(tbody);

  let students = loadList(KEYS.students);
  const classFilter = document.getElementById("studentClassFilter").value;
  const semesterFilter = document.getElementById("studentSemesterFilter").value;
  if (classFilter !== "") {
    students = students.filter(function (student) {
      return student.classId === classFilter;
    });
  }
  if (semesterFilter !== "") {
    students = students.filter(function (student) {
      return student.semester === semesterFilter;
    });
  }
  students = searchStudents(students, document.getElementById("studentSearch").value);

  document.getElementById("studentCount").textContent = "Showing " + students.length + " student(s).";

  if (students.length === 0) {
    addEmptyRow(tbody, 7, "No students match your search.");
    return;
  }
  for (const student of students) {
    const actions = document.createElement("div");
    actions.appendChild(makeButton("View", "btn btn-small btn-light", function () {
      viewStudent(student.id);
    }));
    actions.appendChild(makeButton("Edit", "btn btn-small", function () {
      startEdit(student.id);
    }));
    actions.appendChild(makeButton("Delete", "btn btn-small btn-danger", function () {
      deleteStudent(student.id);
    }));
    addRow(tbody, [
      student.id, fullName(student), getClassName(student.classId), student.semester,
      student.residence, student.guardianPhone, actions
    ]);
  }
}

// Read the form, check every box, and return the problems found.
function readStudentForm() {
  const errors = [];
  const students = loadList(KEYS.students);

  const id = document.getElementById("studentId").value.trim().toUpperCase();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender").value;
  const residence = document.getElementById("residence").value;
  const classId = document.getElementById("classId").value;
  const semester = document.getElementById("semester").value;
  const guardianName = document.getElementById("guardianName").value.trim();
  const guardianPhone = document.getElementById("guardianPhone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();
  const tuitionText = document.getElementById("tuitionDue").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!isValidStudentId(id)) {
    errors.push("Student ID must be KC followed by 5 digits, for example KC26013.");
  } else {
    // Duplicate check. When editing, the student's own old ID is allowed.
    const duplicate = students.some(function (student) {
      return student.id === id && student.id !== editingId;
    });
    if (duplicate) {
      errors.push("Student ID " + id + " is already used. Each student needs a different ID.");
    }
  }
  if (!isValidName(firstName)) {
    errors.push("First name must be 2 to 40 letters.");
  }
  if (!isValidName(lastName)) {
    errors.push("Last name must be 2 to 40 letters.");
  }
  if (dob === "") {
    errors.push("Date of birth is required.");
  } else {
    const age = ageFromDate(dob);
    if (age < 10 || age > 21) {
      errors.push("Date of birth gives an age of " + age + ". Students must be between 10 and 21.");
    }
  }
  if (gender === "") {
    errors.push("Choose a gender.");
  }
  if (residence === "") {
    errors.push("Choose Day Student or Boarder.");
  }
  if (classId === "") {
    errors.push("Choose a class.");
  }
  if (semester === "") {
    errors.push("Choose a semester.");
  }
  if (!isValidName(guardianName)) {
    errors.push("Guardian name must be 2 to 40 letters.");
  }
  if (!isValidPhone(guardianPhone)) {
    errors.push("Guardian phone must be a 10-digit number such as 876-555-0123.");
  }
  if (email !== "" && !isValidEmail(email)) {
    errors.push("The email address is not valid.");
  }
  const tuition = Number(tuitionText);
  if (tuitionText === "" || Number.isNaN(tuition) || tuition < 0) {
    errors.push("Tuition due must be a number that is 0 or more.");
  }
  if (dueDate === "") {
    errors.push("Tuition due date is required.");
  }

  const student = {
    id: id, firstName: firstName, lastName: lastName, dob: dob, gender: gender,
    residence: residence, classId: classId, semester: semester,
    guardianName: guardianName, guardianPhone: guardianPhone, email: email,
    address: address, tuitionDue: tuition, dueDate: dueDate
  };
  return { errors: errors, student: student };
}

// CREATE and UPDATE both come through the form
function handleStudentSubmit(event) {
  event.preventDefault();
  const box = document.getElementById("studentMessage");
  hideMessage(box);

  const result = readStudentForm();
  if (result.errors.length > 0) {
    showErrors(box, result.errors);
    return;
  }

  const students = loadList(KEYS.students);
  const student = result.student;

  if (editingId === null) {
    // CREATE
    students.push(student);
    saveList(KEYS.students, students);
    showMessage(box, "Student " + fullName(student) + " (" + student.id + ") was registered.", "success");
  } else {
    // UPDATE
    const position = students.findIndex(function (item) {
      return item.id === editingId;
    });
    students[position] = student;
    saveList(KEYS.students, students);

    // If the ID changed, the grades and payments must follow the new ID
    if (student.id !== editingId) {
      changeStudentIdEverywhere(editingId, student.id);
    }
    showMessage(box, "Student " + student.id + " was updated.", "success");
  }

  resetStudentForm();
  refreshAfterStudentChange();
}

function changeStudentIdEverywhere(oldId, newId) {
  const grades = loadList(KEYS.grades);
  for (const grade of grades) {
    if (grade.studentId === oldId) {
      grade.studentId = newId;
    }
  }
  saveList(KEYS.grades, grades);

  const payments = loadList(KEYS.payments);
  for (const payment of payments) {
    if (payment.studentId === oldId) {
      payment.studentId = newId;
    }
  }
  saveList(KEYS.payments, payments);
}

// Put a student's details into the form so they can be edited
function startEdit(id) {
  const student = getStudent(id);
  if (student === null) {
    return;
  }
  editingId = student.id;
  document.getElementById("studentId").value = student.id;
  document.getElementById("firstName").value = student.firstName;
  document.getElementById("lastName").value = student.lastName;
  document.getElementById("dob").value = student.dob;
  document.getElementById("gender").value = student.gender;
  document.getElementById("residence").value = student.residence;
  document.getElementById("classId").value = student.classId;
  document.getElementById("semester").value = student.semester;
  document.getElementById("guardianName").value = student.guardianName;
  document.getElementById("guardianPhone").value = student.guardianPhone;
  document.getElementById("email").value = student.email;
  document.getElementById("address").value = student.address;
  document.getElementById("tuitionDue").value = student.tuitionDue;
  document.getElementById("dueDate").value = student.dueDate;

  document.getElementById("studentFormTitle").textContent = "Edit student " + student.id;
  document.getElementById("studentSave").textContent = "Update student";
  document.getElementById("studentCancel").hidden = false;
  hideMessage(document.getElementById("studentMessage"));
  document.getElementById("studentForm").scrollIntoView({ behavior: "smooth" });
}

function resetStudentForm() {
  editingId = null;
  document.getElementById("studentForm").reset();
  document.getElementById("tuitionDue").value = 90000;
  document.getElementById("dueDate").value = "2027-01-15";
  document.getElementById("studentFormTitle").textContent = "Register a new student";
  document.getElementById("studentSave").textContent = "Save student";
  document.getElementById("studentCancel").hidden = true;
}

// DELETE
function deleteStudent(id) {
  const student = getStudent(id);
  if (student === null) {
    return;
  }
  const sure = confirm("Delete " + fullName(student) + " (" + id + ")? Their grades and payments will also be deleted.");
  if (!sure) {
    return;
  }
  saveList(KEYS.students, loadList(KEYS.students).filter(function (item) {
    return item.id !== id;
  }));
  saveList(KEYS.grades, loadList(KEYS.grades).filter(function (item) {
    return item.studentId !== id;
  }));
  saveList(KEYS.payments, loadList(KEYS.payments).filter(function (item) {
    return item.studentId !== id;
  }));
  if (editingId === id) {
    resetStudentForm();
  }
  document.getElementById("studentProfile").hidden = true;
  showMessage(document.getElementById("studentMessage"), "Student " + id + " was deleted.", "success");
  refreshAfterStudentChange();
}

// READ one student in full
function viewStudent(id) {
  const student = getStudent(id);
  if (student === null) {
    return;
  }
  const panel = document.getElementById("studentProfile");
  renderStudentProfile(panel, student);
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth" });
}

// After any student change, update every part of the page that shows students
function refreshAfterStudentChange() {
  fillAllSelects();
  renderStudents();
  renderOverview();
  renderClasses();
  renderLedger();
  renderPayments();
}

// ---------------------------------------------------------------
// CLASSES AND SUBJECTS
// ---------------------------------------------------------------
function renderClasses() {
  const tbody = document.getElementById("classTable");
  clearElement(tbody);
  const classes = loadList(KEYS.classes);
  const students = loadList(KEYS.students);
  if (classes.length === 0) {
    addEmptyRow(tbody, 3, "No classes yet.");
  }
  for (const item of classes) {
    const count = students.filter(function (student) {
      return student.classId === item.id;
    }).length;
    const deleteButton = makeButton("Delete", "btn btn-small btn-danger", function () {
      deleteClass(item.id);
    });
    addRow(tbody, [item.name, count, deleteButton]);
  }
}

function handleClassSubmit(event) {
  event.preventDefault();
  const box = document.getElementById("classSubjectMessage");
  const input = document.getElementById("className");
  const name = input.value.trim();
  const classes = loadList(KEYS.classes);

  if (name.length < 2 || name.length > 30) {
    showMessage(box, "Class name must be 2 to 30 characters.", "error");
    return;
  }
  const exists = classes.some(function (item) {
    return item.name.toLowerCase() === name.toLowerCase();
  });
  if (exists) {
    showMessage(box, "A class called " + name + " already exists.", "error");
    return;
  }
  classes.push({ id: nextRecordId("C", classes), name: name });
  saveList(KEYS.classes, classes);
  input.value = "";
  showMessage(box, "Class " + name + " was added.", "success");
  refreshAfterStudentChange();
}

function deleteClass(id) {
  const box = document.getElementById("classSubjectMessage");
  const inUse = loadList(KEYS.students).some(function (student) {
    return student.classId === id;
  });
  if (inUse) {
    showMessage(box, "This class still has students. Move them to another class first.", "error");
    return;
  }
  if (!confirm("Delete this class?")) {
    return;
  }
  saveList(KEYS.classes, loadList(KEYS.classes).filter(function (item) {
    return item.id !== id;
  }));
  showMessage(box, "Class deleted.", "success");
  refreshAfterStudentChange();
}

function renderSubjects() {
  const tbody = document.getElementById("subjectTable");
  clearElement(tbody);
  const subjects = loadList(KEYS.subjects);
  if (subjects.length === 0) {
    addEmptyRow(tbody, 4, "No subjects yet.");
  }
  for (const subject of subjects) {
    // A drop-down in the row lets the Administrator change the teacher
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Teacher for " + subject.name);
    fillTeacherSelect(select, subject.teacherId, true);
    select.addEventListener("change", function () {
      changeSubjectTeacher(subject.id, select.value);
    });
    const deleteButton = makeButton("Delete", "btn btn-small btn-danger", function () {
      deleteSubject(subject.id);
    });
    addRow(tbody, [subject.code, subject.name, select, deleteButton]);
  }
}

function changeSubjectTeacher(subjectId, teacherId) {
  const subjects = loadList(KEYS.subjects);
  const subject = findById(subjects, subjectId);
  if (subject === null) {
    return;
  }
  subject.teacherId = teacherId;
  saveList(KEYS.subjects, subjects);
  showMessage(document.getElementById("classSubjectMessage"), subject.name + " now has a new teacher assigned.", "success");
}

function handleSubjectSubmit(event) {
  event.preventDefault();
  const box = document.getElementById("classSubjectMessage");
  const subjects = loadList(KEYS.subjects);
  const name = document.getElementById("subjectName").value.trim();
  const code = document.getElementById("subjectCode").value.trim().toUpperCase();
  const teacherId = document.getElementById("subjectTeacher").value;

  const errors = [];
  if (name.length < 2 || name.length > 40) {
    errors.push("Subject name must be 2 to 40 characters.");
  }
  if (!/^[A-Z0-9]{2,6}$/.test(code)) {
    errors.push("Short code must be 2 to 6 letters or digits.");
  }
  if (subjects.some(function (item) { return item.name.toLowerCase() === name.toLowerCase(); })) {
    errors.push("A subject called " + name + " already exists.");
  }
  if (subjects.some(function (item) { return item.code === code; })) {
    errors.push("The code " + code + " is already used.");
  }
  if (errors.length > 0) {
    showErrors(box, errors);
    return;
  }

  subjects.push({ id: nextRecordId("S", subjects), name: name, code: code, teacherId: teacherId });
  saveList(KEYS.subjects, subjects);
  document.getElementById("subjectForm").reset();
  showMessage(box, "Subject " + name + " was added.", "success");
  fillAllSelects();
  renderSubjects();
  renderOverview();
}

function deleteSubject(id) {
  const subject = findById(loadList(KEYS.subjects), id);
  if (subject === null) {
    return;
  }
  if (!confirm("Delete " + subject.name + "? All marks for this subject will also be deleted.")) {
    return;
  }
  saveList(KEYS.subjects, loadList(KEYS.subjects).filter(function (item) {
    return item.id !== id;
  }));
  saveList(KEYS.grades, loadList(KEYS.grades).filter(function (item) {
    return item.subjectId !== id;
  }));
  showMessage(document.getElementById("classSubjectMessage"), "Subject deleted.", "success");
  fillAllSelects();
  renderSubjects();
  renderOverview();
}

// ---------------------------------------------------------------
// GRADES
// ---------------------------------------------------------------
function loadGradeGrid() {
  const box = document.getElementById("gradeMessage");
  hideMessage(box);
  const subjectId = document.getElementById("gradeSubject").value;
  const classId = document.getElementById("gradeClass").value;
  const semester = document.getElementById("gradeSemester").value;

  if (subjectId === "" || classId === "" || semester === "") {
    showMessage(box, "Please choose a subject, a class and a semester first.", "error");
    return;
  }

  const students = loadList(KEYS.students).filter(function (student) {
    return student.classId === classId && student.semester === semester;
  });
  gradeSubjectId = subjectId;
  gradeSemester = semester;
  gradeRows = renderGradeTable(document.getElementById("gradeTable"), students, subjectId, semester);
  document.getElementById("gradeCaption").textContent =
    getSubjectName(subjectId) + " | " + getClassName(classId) + " | " + semester;
  document.getElementById("gradeSave").hidden = gradeRows.length === 0;
}

function saveGradeGrid() {
  const box = document.getElementById("gradeMessage");
  const result = readGradeTable(gradeRows);
  if (result.errors > 0) {
    showMessage(box, result.errors + " row(s) have a mark that is not a number from 0 to 100. Fix the red boxes and save again.", "error");
    return;
  }
  const saved = saveGradeRecords(result.records, gradeSubjectId, gradeSemester);
  showMessage(box, "Saved marks for " + saved + " student(s).", "success");
  renderOverview();
}

// ---------------------------------------------------------------
// TUITION LEDGER AND PAYMENTS
// ---------------------------------------------------------------
function renderLedger(highlightId) {
  const tbody = document.getElementById("ledgerTable");
  clearElement(tbody);

  let students = searchStudents(loadList(KEYS.students), document.getElementById("ledgerSearch").value);
  const statusFilter = document.getElementById("ledgerStatus").value;

  let totalDue = 0;
  let totalPaid = 0;
  let totalBalance = 0;
  let shown = 0;

  for (const student of students) {
    const finance = getFinance(student);
    if (statusFilter !== "" && finance.status !== statusFilter) {
      continue;
    }
    const statementButton = makeButton("Statement", "btn btn-small btn-light", function () {
      showStatement(student.id);
    });
    const rowClass = student.id === highlightId ? "flash" : "";
    addRow(tbody, [
      student.id, fullName(student), getClassName(student.classId),
      formatMoney(finance.due), formatMoney(finance.paid), formatMoney(finance.balance),
      student.dueDate ? student.dueDate : "Not set", makeStatusBadge(finance.status), statementButton
    ], rowClass);
    totalDue += finance.due;
    totalPaid += finance.paid;
    totalBalance += finance.balance;
    shown++;
  }

  if (shown === 0) {
    addEmptyRow(tbody, 9, "No accounts match your search.");
  } else {
    addRow(tbody, [
      "", makeEl("strong", "Totals (" + shown + " students)"), "",
      makeEl("strong", formatMoney(totalDue)), makeEl("strong", formatMoney(totalPaid)),
      makeEl("strong", formatMoney(totalBalance)), "", "", ""
    ]);
  }
}

function showStatement(studentId) {
  const student = getStudent(studentId);
  if (student === null) {
    return;
  }
  const box = document.getElementById("statementBox");
  clearElement(box);
  box.appendChild(makeEl("h3", "Statement for " + fullName(student) + " (" + student.id + ")"));
  renderFinanceStatement(box, student);
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth" });
}

function renderPayments() {
  const tbody = document.getElementById("paymentTable");
  clearElement(tbody);
  const payments = loadList(KEYS.payments).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  if (payments.length === 0) {
    addEmptyRow(tbody, 6, "No payments have been recorded yet.");
    return;
  }
  for (const payment of payments) {
    const student = getStudent(payment.studentId);
    const name = student === null ? payment.studentId : payment.studentId + " - " + fullName(student);
    const deleteButton = makeButton("Delete", "btn btn-small btn-danger", function () {
      deletePayment(payment.id);
    });
    addRow(tbody, [payment.date, name, formatMoney(payment.amount), payment.method, payment.note ? payment.note : "-", deleteButton]);
  }
}

function handlePaymentSubmit(event) {
  event.preventDefault();
  const box = document.getElementById("paymentMessage");
  hideMessage(box);

  const studentId = document.getElementById("payStudent").value;
  const amountText = document.getElementById("payAmount").value;
  const date = document.getElementById("payDate").value;
  const method = document.getElementById("payMethod").value;
  const note = document.getElementById("payNote").value.trim();

  const errors = [];
  const student = studentId === "" ? null : getStudent(studentId);
  const amount = Number(amountText);

  if (student === null) {
    errors.push("Choose a student.");
  }
  if (amountText === "" || Number.isNaN(amount) || amount <= 0) {
    errors.push("Amount must be more than 0.");
  }
  if (date === "") {
    errors.push("Choose the payment date.");
  } else if (date > todayISO()) {
    errors.push("The payment date cannot be in the future.");
  }
  if (method === "") {
    errors.push("Choose a payment method.");
  }
  if (student !== null && amount > 0) {
    const balance = getFinance(student).balance;
    if (balance <= 0) {
      errors.push(fullName(student) + " has no balance left to pay.");
    } else if (amount > balance) {
      errors.push("The amount is more than the balance of " + formatMoney(balance) + ".");
    }
  }
  if (errors.length > 0) {
    showErrors(box, errors);
    return;
  }

  const payments = loadList(KEYS.payments);
  payments.push({
    id: nextRecordId("P", payments),
    studentId: studentId,
    date: date,
    amount: Math.round(amount * 100) / 100,
    method: method,
    note: note
  });
  saveList(KEYS.payments, payments);

  const finance = getFinance(student);
  showMessage(box, "Payment of " + formatMoney(amount) + " recorded for " + fullName(student) +
    ". Balance is now " + formatMoney(finance.balance) + " (" + finance.status + ").", "success");
  document.getElementById("payAmount").value = "";
  document.getElementById("payNote").value = "";
  renderLedger(studentId);
  renderPayments();
  renderOverview();
}

function deletePayment(id) {
  if (!confirm("Delete this payment record?")) {
    return;
  }
  saveList(KEYS.payments, loadList(KEYS.payments).filter(function (item) {
    return item.id !== id;
  }));
  showMessage(document.getElementById("paymentMessage"), "Payment deleted. The ledger has been recalculated.", "success");
  renderLedger();
  renderPayments();
  renderOverview();
}

// ---------------------------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------------------------
function renderAnnouncements() {
  const tbody = document.getElementById("announcementTable");
  clearElement(tbody);
  const items = loadList(KEYS.announcements).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  if (items.length === 0) {
    addEmptyRow(tbody, 4, "No announcements yet.");
  }
  for (const item of items) {
    const deleteButton = makeButton("Delete", "btn btn-small btn-danger", function () {
      deleteAnnouncement(item.id);
    });
    addRow(tbody, [item.date, item.title, item.text, deleteButton]);
  }
}

function handleAnnouncementSubmit(event) {
  event.preventDefault();
  const box = document.getElementById("announcementMessage");
  const title = document.getElementById("annTitle").value.trim();
  const text = document.getElementById("annText").value.trim();

  const errors = [];
  if (title.length < 3 || title.length > 80) {
    errors.push("Title must be 3 to 80 characters.");
  }
  if (text.length < 5 || text.length > 300) {
    errors.push("Message must be 5 to 300 characters.");
  }
  if (errors.length > 0) {
    showErrors(box, errors);
    return;
  }
  const items = loadList(KEYS.announcements);
  items.push({
    id: nextRecordId("A", items),
    title: title,
    text: text,
    date: todayISO(),
    author: session.name
  });
  saveList(KEYS.announcements, items);
  document.getElementById("announcementForm").reset();
  showMessage(box, "Announcement posted. It now shows on the Home page.", "success");
  renderAnnouncements();
}

function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) {
    return;
  }
  saveList(KEYS.announcements, loadList(KEYS.announcements).filter(function (item) {
    return item.id !== id;
  }));
  renderAnnouncements();
}

// ---------------------------------------------------------------
// MESSAGES FROM THE CONTACT PAGE
// ---------------------------------------------------------------
function renderMessages() {
  const tbody = document.getElementById("messageTable");
  clearElement(tbody);
  const items = loadList(KEYS.messages).slice().reverse();
  if (items.length === 0) {
    addEmptyRow(tbody, 7, "No messages yet. Messages sent from the Contact Us page appear here.");
    return;
  }
  for (const item of items) {
    const deleteButton = makeButton("Delete", "btn btn-small btn-danger", function () {
      saveList(KEYS.messages, loadList(KEYS.messages).filter(function (message) {
        return message.id !== item.id;
      }));
      renderMessages();
    });
    addRow(tbody, [item.date, item.name, item.email, item.phone ? item.phone : "-", item.subject, item.text, deleteButton]);
  }
}

// ---------------------------------------------------------------
// START: connect the buttons and show the first section
// ---------------------------------------------------------------
function startAdminPage() {
  document.getElementById("welcomeText").textContent = "Signed in as " + session.name;
  document.getElementById("payDate").value = todayISO();
  document.getElementById("dueDate").value = "2027-01-15";

  fillAllSelects();

  document.getElementById("studentForm").addEventListener("submit", handleStudentSubmit);
  document.getElementById("studentCancel").addEventListener("click", resetStudentForm);
  document.getElementById("studentClear").addEventListener("click", resetStudentForm);
  document.getElementById("generateId").addEventListener("click", function () {
    document.getElementById("studentId").value = nextStudentId();
  });
  document.getElementById("studentSearch").addEventListener("input", renderStudents);
  document.getElementById("studentClassFilter").addEventListener("change", renderStudents);
  document.getElementById("studentSemesterFilter").addEventListener("change", renderStudents);

  document.getElementById("classForm").addEventListener("submit", handleClassSubmit);
  document.getElementById("subjectForm").addEventListener("submit", handleSubjectSubmit);

  document.getElementById("gradeLoad").addEventListener("click", loadGradeGrid);
  document.getElementById("gradeSave").addEventListener("click", saveGradeGrid);

  document.getElementById("paymentForm").addEventListener("submit", handlePaymentSubmit);
  document.getElementById("ledgerSearch").addEventListener("input", function () {
    renderLedger();
  });
  document.getElementById("ledgerStatus").addEventListener("change", function () {
    renderLedger();
  });

  document.getElementById("announcementForm").addEventListener("submit", handleAnnouncementSubmit);

  document.getElementById("resetButton").addEventListener("click", function () {
    if (!confirm("Reset ALL records back to the sample data?")) {
      return;
    }
    resetData();
    resetStudentForm();
    refreshAfterStudentChange();
    renderSubjects();
    renderAnnouncements();
    renderMessages();
    showMessage(document.getElementById("resetMessage"), "Sample data restored.", "success");
  });

  // Each time a section opens, draw it again so it shows the newest data
  setupSections(function (name) {
    if (name === "overview") {
      renderOverview();
    } else if (name === "students") {
      renderStudents();
    } else if (name === "classes") {
      renderClasses();
      renderSubjects();
    } else if (name === "finance") {
      fillAllSelects();
      renderLedger();
      renderPayments();
    } else if (name === "grades") {
      fillAllSelects();
    } else if (name === "announcements") {
      renderAnnouncements();
    } else if (name === "messages") {
      renderMessages();
    }
  });
}

// Only run if the login check passed
if (session !== null) {
  startAdminPage();
}
