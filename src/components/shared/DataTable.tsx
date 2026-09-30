"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchableText?: (row: T) => string;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  skeletonRowCount?: number;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  defaultPageSize?: number;
  className?: string;
  tableClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  searchPlaceholder = "Search records...",
  searchableText,
  toolbar,
  emptyState,
  isLoading = false,
  skeletonRowCount = 5,
  onRowClick,
  pagination = true,
  defaultPageSize = 10,
  className,
  tableClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (query.trim() && searchableText) {
      const q = query.trim().toLowerCase();
      result = result.filter((row) =>
        searchableText(row).toLowerCase().includes(q)
      );
    }
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      const sortValue = column?.sortValue;
      result = [...result].sort((a, b) => {
        const av = sortValue ? sortValue(a) : String((a as Record<string, unknown>)[sort.key]);
        const bv = sortValue ? sortValue(b) : String((b as Record<string, unknown>)[sort.key]);
        if (typeof av === "number" && typeof bv === "number") {
          return (av - bv) * (sort.direction === "asc" ? 1 : -1);
        }
        return (
          String(av).localeCompare(String(bv)) *
          (sort.direction === "asc" ? 1 : -1)
        );
      });
    }
    return result;
  }, [rows, query, sort, columns, searchableText]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = pagination
    ? filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredRows.slice(0, defaultPageSize);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((current) =>
      current?.key === key
        ? current.direction === "asc"
          ? { key, direction: "desc" }
          : null
        : { key, direction: "asc" }
    );
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {(searchableText || toolbar) && (
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center">
          {searchableText && (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 rounded-lg pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {toolbar}
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                          active && "text-primary"
                        )}
                        aria-label={`Sort by column ${column.header?.toString()}`}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="py-3">
                      <Skeleton
                        className={cn(
                          "h-4",
                          column.align === "right" ? "ml-auto" : ""
                        )}
                        style={{ width: `${70 + (index * 13) % 30}%` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length > 0 ? (
              pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.className
                      )}
                    >
                      {column.cell ? column.cell(row) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-full p-0">
                  {emptyState ?? (
                    <EmptyState
                      title="No records found"
                      description="Try adjusting your search or filters."
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : (
        <div className="border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{pageRows.length}</span>{" "}
            {pageRows.length === 1 ? "record" : "records"}
          </p>
        </div>
      )}
    </div>
  );
}