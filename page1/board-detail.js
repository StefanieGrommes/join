document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('board-detail-root');

  if (!root) return;

  const cardVariants = [
    {
      id: 'story-1',
      title: 'Kochwelt Page & Recipe Recommender',
      description: 'Build the landing page and recipe suggestions for the cooking platform.',
      dueDate: '10/05/2023',
      priority: 'Medium',
      priorityColor: '#f9a35c',
      category: 'User Story',
      categoryColor: '#2d8cff',
      assignedTo: ['EM', 'MB', 'AM'],
      subtasks: [
        { label: 'Implement recipe recommendation', done: true },
        { label: 'Landing page layout', done: false },
        { label: 'Mobile optimization', done: false }
      ]
    },
    {
      id: 'tech-1',
      title: 'CSS Architecture Planning',
      description: 'Define the naming system and reusable CSS rules for all project modules.',
      dueDate: '02/09/2023',
      priority: 'Urgent',
      priorityColor: '#f66a5f',
      category: 'Technical Task',
      categoryColor: '#2bc7b7',
      assignedTo: ['SM', 'BZ'],
      subtasks: [
        { label: 'Create base structure', done: true },
        { label: 'Naming convention review', done: true },
        { label: 'Finalize utility classes', done: false }
      ]
    },
    {
      id: 'story-2',
      title: 'Daily Overview Dashboard',
      description: 'Create a dashboard with tasks, priorities, and a quick summary overview.',
      dueDate: '18/09/2023',
      priority: 'Low',
      priorityColor: '#5bc0be',
      category: 'User Story',
      categoryColor: '#7c6cf7',
      assignedTo: ['JJ', 'AM'],
      subtasks: [
        { label: 'Build summary cards', done: true },
        { label: 'Add chart widgets', done: false },
        { label: 'Review accessibility', done: false }
      ]
    },
    {
      id: 'tech-2',
      title: 'Database Integration Setup',
      description: 'Connect the frontend logic to the shared contact and task dataset.',
      dueDate: '25/10/2023',
      priority: 'High',
      priorityColor: '#ff7d5c',
      category: 'Technical Task',
      categoryColor: '#ffb703',
      assignedTo: ['EM', 'SM', 'BZ'],
      subtasks: [
        { label: 'Prepare API layer', done: true },
        { label: 'Map task objects', done: true },
        { label: 'Validate rendering', done: false }
      ]
    },
    {
      id: 'story-3',
      title: 'Contact Management View',
      description: 'Add a contact list with avatars, roles, and quick status information.',
      dueDate: '04/11/2023',
      priority: 'Medium',
      priorityColor: '#f9a35c',
      category: 'User Story',
      categoryColor: '#4dabf7',
      assignedTo: ['MB', 'JJ', 'AM'],
      subtasks: [
        { label: 'Create contact cards', done: true },
        { label: 'Add filter search', done: false },
        { label: 'Test responsiveness', done: false }
      ]
    }
  ];

  const renderers = [
    renderLargeUserStoryCard,
    renderLargeTechnicalTaskCard,
    renderTaskDetail,
    renderLargeUserStoryCard,
    renderLargeTechnicalTaskCard
  ];

  root.innerHTML = cardVariants
    .map((task, index) => renderers[index % renderers.length](task))
    .join('');
});
