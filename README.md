# Knox College School Portal

**Student:** Alistan Junior Byron | **Student ID:** 2509137
**Programme:** BSc Computing and Information Technology
**Course:** CIT2011 - Web Programming | **Tutor:** Miss Anuli | **Lab:** Monday, 3:00 PM - 5:00 PM
**Project:** Individual School Portal Assignment (approved individual project)
**School:** Knox College, Spalding, Clarendon, Jamaica

A front-end school portal made with HTML5, CSS3 and vanilla JavaScript. There is no server. The browser's `localStorage` is the simulated database and `sessionStorage` holds the simulated login.

> This is a student project, not the official Knox College website. Student, grade, payment and announcement records are **fictional sample data**.

## How to open it
1. Unzip the project and open `index.html` in Google Chrome (double-click works).
2. Click **Login** and use a sample account below.
3. For the most reliable result, host it (see `Documentation/..._GitHub_and_Hosting_Instructions.pdf`).

## Sample accounts
| Role | Username | Password |
|---|---|---|
| Administrator | admin | Admin@123 |
| Teacher (3 subjects, for testing) | teacher | Teacher@123 |
| Teacher: Mr. Brown (Mathematics) | mr.brown | Teacher@123 |
| Teacher: Miss Black (English Language) | miss.black | Teacher@123 |
| Teacher: Miss Williams (English Literature) | miss.williams | Teacher@123 |
| Teacher: Miss Gray (Information Technology) | miss.gray | Teacher@123 |
| General authorized user (read-only) | viewer | Viewer@123 |

## Folder structure
```
Knox_College_Spalding_Clarendon_School_Portal/
  index.html  about.html  contact.html  login.html
  admin-dashboard.html  teacher-dashboard.html  viewer-dashboard.html
  CSS/         KnoxCollege_Spalding_Clarendon_styles.css
  JavaScript/  ..._shared.js  ..._public.js  ..._login.js
               ..._admin.js  ..._teacher.js  ..._viewer.js
  Assets/      logo and banner (SVG drawings made for this project)
  Documentation/  project report, sitemap, testing checklist,
                  presentation and viva guide, GitHub and hosting instructions
  README.md
```
File names include the school name and address as the assignment requires. The seven HTML pages keep their short names so links and free hosting work.

## What it does
- **Home, About, Contact:** school facts, announcements, teacher directory, and a contact form using HTML5 validation (`required`, `pattern`, `minlength`).
- **Administrator:** student registry with create, read, update and delete; duplicate IDs blocked; classes and semesters; subjects and teachers; grade grid; tuition ledger and payments with **Paid / Pending / Outstanding** status; announcements; contact messages.
- **Teacher:** subject, class and semester steps; student filter; batch grade entry with validation; printable report cards with automatic averages.
- **General authorized user:** read-only student search, profiles, academic records, financial statements, and reports with bar charts.

## Calculations
- Subject average = average of the marks entered (blank marks are skipped). Overall average = average of the subject averages.
- Grades: A 80-100, B 70-79, C 60-69, D 50-59, E 40-49, F below 40.
- Balance = tuition due - total paid. **Paid:** nothing left. **Pending:** balance left, due date not passed. **Outstanding:** balance left, due date passed.

## Limits of the simulated login
Passwords are stored as plain text in the browser, the role is kept in the browser and can be edited, and there is no hashing, lock-out or HTTPS. Real systems check passwords on a server.

## Testing (23 November 2026)
Automated checks in a simulated browser (169) and in Google Chrome (29) passed, Chrome showed no console errors, and no page scrolls sideways at 360px. Firefox, Safari, real phones, a physical printer and a hosted copy were **not** tested. See the Testing Checklist.

## Not yet done (placeholders)
- GitHub repository link: *to be added after the repository is created.*
- Free hosting link: *to be added after the site is published.*
- Official Knox College mission, vision, values and verified contact details: placeholders or flagged for confirmation on the About and Contact pages.

## Sources
Wikipedia (Knox College, Jamaica), Jamaica Observer (March 2022), Jamaica Gleaner (March 2022), Jamaica Information Service (July 2026), CIT2011 lecture and lab notes.
