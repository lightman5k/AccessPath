import { ReactNode } from "react";

/**
 * Table: semantic table wrapper with consistent sizing/spacing.
 */
type Column = {
  key: string;
  header: ReactNode;
  className?: string;
};

type Row = {
  key: string;
  cells: ReactNode[];
  className?: string;
};

type TableProps = {
  columns: Column[];
  rows: Row[];
  ariaLabel?: string;
};

export function Table({ columns, rows, ariaLabel }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-label={ariaLabel}
        className="min-w-full border-separate border-spacing-0 text-left text-sm"
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-b border-gray-200 px-3 py-2 font-medium text-gray-600 ${
                  column.className ?? ""
                }`.trim()}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.className ?? "hover:bg-gray-50"}>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.key}-${columns[index]?.key ?? index}`}
                  className={`border-b border-gray-100 px-3 py-2 ${
                    columns[index]?.className ?? ""
                  }`.trim()}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
