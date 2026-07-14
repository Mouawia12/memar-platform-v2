'use strict';

/**
 * Extract and validate pagination params from query string
 */
function getPagination(query) {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const from   = (page - 1) * limit;
  const to     = from + limit - 1;
  return { page, limit, from, to };
}

/**
 * Build Supabase range + order from query params
 */
function applyPagination(query, qb, paginationObj) {
  const sortBy  = query.sortBy  || 'created_at';
  const sortDir = query.sortDir === 'asc';
  return qb
    .range(paginationObj.from, paginationObj.to)
    .order(sortBy, { ascending: sortDir });
}

module.exports = { getPagination, applyPagination };
