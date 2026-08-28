// Shared helpers so every "list" endpoint returns the same shape:
//   { data: [...], page, pageSize, total, totalPages }

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};

export const paginated = (data, total, { page, pageSize }) => ({
  data,
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
