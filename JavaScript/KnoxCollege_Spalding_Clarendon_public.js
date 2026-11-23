/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_public.js
  PURPOSE: Code for the public pages (index.html, about.html, contact.html).
    - Home page: show the latest announcements.
    - About page: show the teacher directory.
    - Contact page: check the form and save the message.
  Each page only runs the part that matches the elements on that page.
*/

// ---------- Home page: announcements ----------
function showAnnouncements() {
  const list = document.getElementById("announcementList");
  if (list === null) {
    return;
  }
  clearElement(list);

  const announcements = loadList(KEYS.announcements);
  if (announcements.length === 0) {
    list.appendChild(makeEl("li", "There are no announcements right now."));
    return;
  }

  // Newest first (dates are written as YYYY-MM-DD so they sort as text)
  announcements.sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  // Show the three newest
  const newest = announcements.slice(0, 3);
  for (const item of newest) {
    const li = document.createElement("li");
    li.appendChild(makeEl("h3", item.title));
    li.appendChild(makeEl("p", item.text));
    li.appendChild(makeEl("span", "Posted " + item.date + " by " + item.author, "date-text"));
    list.appendChild(li);
  }
}

// ---------- About page: teacher directory ----------
function showTeacherDirectory() {
  const tbody = document.getElementById("teacherTable");
  if (tbody === null) {
    return;
  }
  clearElement(tbody);

  const teachers = loadList(KEYS.teachers);
  const subjects = loadList(KEYS.subjects);
  let shown = 0;

  // One row for every subject taught by a teacher listed in the directory
  for (const teacher of teachers) {
    if (teacher.showInDirectory === false) {
      continue;
    }
    const taught = subjects.filter(function (subject) {
      return subject.teacherId === teacher.id;
    });
    if (taught.length === 0) {
      addRow(tbody, [teacher.name, "No subject assigned yet"]);
      shown++;
    }
    for (const subject of taught) {
      addRow(tbody, [teacher.name, subject.name]);
      shown++;
    }
  }

  // Subjects that do not have a confirmed teacher
  for (const subject of subjects) {
    const teacher = findById(teachers, subject.teacherId);
    if (teacher === null || teacher.showInDirectory === false) {
      addRow(tbody, ["To be confirmed", subject.name]);
      shown++;
    }
  }

  if (shown === 0) {
    addEmptyRow(tbody, 2, "No teachers have been added yet.");
  }
}

// ---------- Contact page: message form ----------
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (form === null) {
    return;
  }
  const messageBox = document.getElementById("contactMessage");
  const textArea = document.getElementById("contactText");
  const counter = document.getElementById("charCount");

  // Count the characters while the person types
  textArea.addEventListener("input", function () {
    counter.textContent = textArea.value.length + " / 500 characters";
  });

  form.addEventListener("reset", function () {
    form.classList.remove("was-validated");
    counter.textContent = "0 / 500 characters";
    hideMessage(messageBox);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading
    hideMessage(messageBox);
    form.classList.add("was-validated");

    // The browser checks required, pattern, minlength and type="email"
    if (!form.checkValidity()) {
      // Find the first box with a problem and explain it
      const firstBad = form.querySelector(":invalid");
      let help = firstBad.title;
      if (help === "") {
        help = "Please complete this field.";
      }
      showMessage(messageBox, "Please fix the highlighted field: " + help, "error");
      firstBad.focus();
      return;
    }

    // Save the message in localStorage
    const messages = loadList(KEYS.messages);
    messages.push({
      id: nextRecordId("M", messages),
      name: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      phone: document.getElementById("contactPhone").value.trim(),
      subject: document.getElementById("contactSubject").value,
      text: textArea.value.trim(),
      date: todayISO()
    });
    saveList(KEYS.messages, messages);

    form.reset();
    showMessage(messageBox, "Thank you. Your message was saved and the Administrator can now read it.", "success");
  });
}

showAnnouncements();
showTeacherDirectory();
setupContactForm();
