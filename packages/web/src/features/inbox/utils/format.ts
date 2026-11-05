export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
