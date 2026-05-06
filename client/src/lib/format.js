export const initialsFor = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const avatarColorClass = (key) => {
  if (!key) return 'avatar-color-1';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const idx = (Math.abs(hash) % 5) + 1;
  return `avatar-color-${idx}`;
};

export const formatDate = (input) => {
  if (!input) return '';
  const d = new Date(input);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDateLong = (input) => {
  if (!input) return '';
  const d = new Date(input);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
};

export const statusLabel = (status) => {
  if (status === 'todo') return 'To do';
  if (status === 'in-progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  return status;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const todayLong = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};
