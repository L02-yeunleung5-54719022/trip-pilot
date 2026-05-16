function parseDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getDates(start: string, end: string) {
  const result: string[] = [];
  const current = parseDateKey(start);
  const last = parseDateKey(end);

  while (current <= last) {
    result.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}
