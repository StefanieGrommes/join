# join
Join is a kanban-based project management tool designed and built by a group of dedicated students as part of
their web development bootcamp at the Developer Akademie.

Kanban, a Japanese term meaning "billboard", is a highly effective method to visualize work, limit
work-in-progress, and maximize efficiency (or flow). Join leverages the principles of kanban to help users
manage their tasks and projects in an intuitive, visual interface.

In Join you can create a board, fill it with tasks and assign it to your collegues.

On screens up to 360px wide, use the arrow button in a task card to open the
"Move to" menu and move the task to the previous or next board column. The
column assignment is saved locally and remains after reloading the page.
On larger screens, tasks can be moved using drag and drop.

## Sign-up and login (educational prototype)

Sign-up validates the name, email, password, confirmation and accepted privacy
policy using JavaScript, without native HTML validation. Successful registration
stores an account under `users` and a linked contact under `contacts` in the shared
Firebase Realtime Database, starts the account session automatically and opens
the summary page after the success message.

Login checks the stored email and password. Login, guest mode, display name and
profile color use `localStorage`, so they survive closing the tab or browser.
Logout removes only Join's login/profile keys and the tab's contact/task cache,
not database records or unrelated browser data. Contact/task caches still use
`sessionStorage`. The legacy session keys `join-session-mode` (`demo` for accounts)
and `join-demo-name` are retained for compatibility with existing pages.

This prototype does not use Firebase Authentication. Passwords are currently
plain strings, and database rules are unchanged. **Use invented test accounts
only, never real or reused passwords.** Browser-based login guards are not
server-side access control; publicly readable records remain publicly readable.
Secure authentication and appropriate database rules are required before real use.

It is important to note that Join is designed as an educational exercise and is not intended for extensive
business usage. While we strive to ensure the best possible user experience, we cannot guarantee consistent
availability, reliability, accuracy, or other aspects of quality regarding Join.
