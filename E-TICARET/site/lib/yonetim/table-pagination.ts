"use client";

import type { TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";

/** Yönetim ProTable — sayfa başına 10–100 */
export const ADMIN_PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"] as const;

export function useAdminTablePagination(
  defaultPageSize = 20,
  resetKey?: string | number,
): TablePaginationConfig {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => {
    setCurrent(1);
  }, [resetKey]);

  return {
    current,
    pageSize,
    showSizeChanger: true,
    pageSizeOptions: [...ADMIN_PAGE_SIZE_OPTIONS],
    showTotal: (total, [from, to]) => `${from}-${to} / ${total}`,
    onChange: (page, size) => {
      setCurrent(page);
      setPageSize(size);
    },
    onShowSizeChange: (_page, size) => {
      setCurrent(1);
      setPageSize(size);
    },
  };
}
