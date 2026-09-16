// ===============================
// Datensätze für die Info-Seiten
// Diese Datei enthält alle Inhalte für Help, Privacy Policy und Legal Notice.
// So bleiben Texte von HTML getrennt und sind leicht austauschbar.
// ===============================

const infoPages = {
  help: {
    title: 'Help',
    intro: 'Here you can find the most important information about how Join works and how you can use it efficiently.',
    sections: [
      {
        heading: 'What is Join?',
        content: [
          'Join is a task and project management tool that helps teams organize responsibilities, track progress, and keep communication clear.',
          'It is designed for simple, structured collaboration across the entire project workflow.'
        ]
      },
      {
        heading: 'How to use it',
        content: [
          '1. Create a task in the desired status column.',
          '2. Add a title, description, due date, and assigned contacts.',
          '3. Organize your work by moving tasks between columns with drag and drop.',
          '4. Keep your responsibilities visible by editing, deleting, or checking subtasks.'
        ]
      },
      {
        heading: 'Tips',
        content: [
          'Use clear task titles and keep descriptions short but precise.',
          'Update the task status regularly so the project always reflects the current progress.',
          'Use the contact list to assign responsibilities quickly and transparently.'
        ]
      }
    ]
  },

  privacy: {
    title: 'Privacy Policy',
    intro: 'This privacy policy explains what data we collect, why we collect it, and how we protect it.',
    sections: [
      {
        heading: 'Data collection',
        content: [
          'We collect only the information that is necessary to operate the application, such as account data, contact information, and task-related information.',
          'This includes names, email addresses, and user-related assignments used within Join.'
        ]
      },
      {
        heading: 'Purpose of processing',
        content: [
          'The stored data is used to provide access to the platform, manage tasks, enable collaboration, and maintain a functional user account.',
          'We do not use personal data for unrelated or commercial purposes.'
        ]
      },
      {
        heading: 'Protection',
        content: [
          'We apply technical and organizational measures to protect stored data against unauthorized access, loss, or misuse.',
          'However, no digital system can guarantee absolute security, and users are responsible for keeping their accounts secure.'
        ]
      }
    ]
  },

  legal: {
    title: 'Legal Notice',
    intro: 'The following information provides the legal details about the operator and the responsibilities of the application.',
    sections: [
      {
        heading: 'Provider',
        content: [
          'Join Project Management Tool',
          'Responsible for the content and operation of this application: the project team behind Join.'
        ]
      },
      {
        heading: 'Contact',
        content: [
          'For questions, please contact the team via the contact details provided in the project documentation or communication channels.',
          'This application is intended for project coordination and collaboration within the course or project context.'
        ]
      },
      {
        heading: 'Liability',
        content: [
          'Although all care is taken to provide correct and up-to-date information, no liability is assumed for the completeness, correctness, or timeliness of the content.',
          'The use of this application is at the user’s own responsibility.'
        ]
      }
    ]
  }
};

const navigationItems = [
  { id: 'summary', label: 'Summary', icon: '▣' },
  { id: 'add-task', label: 'Add Task', icon: '＋' },
  { id: 'board', label: 'Board', icon: '▦' },
  { id: 'contacts', label: 'Contacts', icon: '◉' }
];

const footerNavigationItems = [
  { id: 'help', label: 'Help', href: '#help' },
  { id: 'privacy', label: 'Privacy Policy', href: '#privacy' },
  { id: 'legal', label: 'Legal notice', href: '#legal' }
];
