export const getImagePrefix = () => {
  const base =
    process.env.NEXT_PUBLIC_ENV === "local"
      ? "http://127.0.0.1:8000"
      : "https://classroom.onrender.com";

  return `${base}/media/`;
};