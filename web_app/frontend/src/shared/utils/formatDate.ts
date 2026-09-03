export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-DK", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

