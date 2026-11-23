/*
  Student:   Alistan Junior Byron
  Student ID: 2509137
  Programme: BSc Computing and Information Technology
  Course:    CIT2011 - Web Programming
  Tutor:     Miss Anuli
  Lab:       Monday, 3:00 PM - 5:00 PM
  Project:   Individual School Portal Assignment
             (Knox College, Spalding, Clarendon, Jamaica)

  FILE: KnoxCollege_Spalding_Clarendon_login.js
  PURPOSE: Code for login.html.
    - Checks the username and password against the saved accounts.
    - Sends each role to its own dashboard.
    - Shows messages when someone was sent back to this page.
  Remember: this is a SIMULATED login (see the note on the login page).
*/

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const signedInBox = document.getElementById("signedInBox");

// Messages that other pages ask us to show, for example login.html?msg=denied
function showReasonMessage() {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("msg");
  if (reason === "login") {
    showMessage(loginMessage, "Please log in to open a dashboard.", "info");
  } else if (reason === "denied") {
    showMessage(loginMessage, "That dashboard belongs to a different role. Log in with the correct account.", "error");
  } else if (reason === "loggedout") {
    showMessage(loginMessage, "You have been logged out.", "success");
  }
}

// If someone is already logged in, offer a shortcut instead of the form
function showSignedInBox() {
  const session = getSession();
  if (session === null) {
    return;
  }
  document.getElementById("signedInText").textContent =
    "You are logged in as " + session.name + " (" + session.role + ").";
  document.getElementById("signedInLink").href = dashboardPageFor(session.role);
  document.getElementById("signedInLogout").addEventListener("click", logout);
  signedInBox.hidden = false;
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  hideMessage(loginMessage);

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Missing data check
  if (username === "" || password === "") {
    showMessage(loginMessage, "Please enter both a username and a password.", "error");
    return;
  }

  const user = loginUser(username, password);
  if (user === null) {
    showMessage(loginMessage, "Wrong username or password. Check the sample accounts below and try again.", "error");
    document.getElementById("password").value = "";
    return;
  }

  // Success: go to the dashboard for this role
  window.location.href = dashboardPageFor(user.role);
});

showReasonMessage();
showSignedInBox();
