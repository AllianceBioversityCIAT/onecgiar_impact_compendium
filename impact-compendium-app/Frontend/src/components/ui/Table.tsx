import React, { useState, ReactNode } from 'react';
import { Badge } from './Badge';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface TableRow {
  id: string | number;
  [key: string]: any;
}

interface SortState {
  field: string;
  dir: 'asc' | 'desc';
}

interface TableProps {
  columns: TableColumn[];
  data: TableRow[];
  onRowExpand?: (row: TableRow) => void;
  expandedRows?: Set<string | number>;
  expandRender?: (row: TableRow) => ReactNode;
  onTitleClick?: (row: TableRow) => void;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  onEdit?: (row: TableRow) => void;
  onDelete?: (row: TableRow) => void;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowExpand,
  expandedRows = new Set(),
  expandRender,
  onTitleClick,
  sort,
  onSortChange,
  onEdit,
  onDelete,
}) => {
  const [localExpandedRow, setLocalExpandedRow] = useState<
    string | number | null
  >(null);
  const [columnOrder, setColumnOrder] = useState<TableColumn[]>(columns);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  const handleRowToggle = (row: TableRow) => {
    if (onRowExpand) {
      onRowExpand(row);
    } else {
      const newExpanded = localExpandedRow === row.id ? null : row.id;
      setLocalExpandedRow(newExpanded);
    }
  };

  const handleTitleClick = (row: TableRow) => {
    onTitleClick?.(row);
  };

  const handleSortClick = (column: TableColumn) => {
    if (!column.sortable || !onSortChange) return;

    const newDir =
      sort?.field === column.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ field: column.key, dir: newDir });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    row: TableRow,
    action: 'expand' | 'title'
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'expand') {
        handleRowToggle(row);
      } else {
        handleTitleClick(row);
      }
    }
  };

  const handleSortKeyDown = (e: React.KeyboardEvent, column: TableColumn) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSortClick(column);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumn(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedColumn === null || draggedColumn === dropIndex) return;

    const newOrder = [...columnOrder];
    const draggedItem = newOrder[draggedColumn];
    newOrder.splice(draggedColumn, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
  };

  const getCategoryBadgeVariant = (category: string) => {
    if (category.toLowerCase().includes('impact outcome story')) return 'story';
    if (category.toLowerCase().includes('impact')) return 'impact';
    if (category.toLowerCase().includes('outcome')) return 'outcome';
    return 'other';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="w-8 px-3 py-4"></th>
              {columnOrder.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-move ${column.width || ''} ${draggedColumn === index ? 'opacity-50' : ''} ${column.key === 'title' ? 'w-96 max-w-96' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, index)}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                    {column.sortable ? (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSortClick(column);
                        }}
                        onKeyDown={e => handleSortKeyDown(e, column)}
                        className="group flex items-center gap-1 font-bold text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors"
                        aria-sort={
                          sort?.field === column.key
                            ? sort.dir === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        {column.label}
                        <span className="flex flex-col ml-1">
                          <svg
                            className={`w-3 h-3 transition-colors ${
                              sort?.field === column.key && sort.dir === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-300 group-hover:text-gray-500'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <svg
                            className={`w-3 h-3 -mt-1 transition-colors ${
                              sort?.field === column.key && sort.dir === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-300 group-hover:text-gray-500'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, _index) => {
              const isExpanded =
                expandedRows.has(row.id) || localExpandedRow === row.id;
              // const _isEven = index % 2 === 0;

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => handleTitleClick(row)}
                  >
                    <td className="w-8 px-3 py-4">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRowToggle(row);
                        }}
                        onKeyDown={e => handleKeyDown(e, row, 'expand')}
                        className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} row details`}
                      >
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </td>
                    {columnOrder.map(column => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 text-sm ${column.key === 'title' ? 'w-96 max-w-96' : ''}`}
                      >
                        {column.key === 'title' ? (
                          <span
                            className="font-medium text-gray-900 block truncate text-left hover:text-blue-600 transition-colors"
                            title={row[column.key]}
                          >
                            {row[column.key]}
                          </span>
                        ) : column.key === 'category' ? (
                          <Badge
                            variant={getCategoryBadgeVariant(row[column.key])}
                          >
                            {row[column.key]}
                          </Badge>
                        ) : column.key === 'id' ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {row[column.key]}
                          </span>
                        ) : column.key === 'year' ? (
                          <span className="font-semibold text-gray-800">
                            {row[column.key]}
                          </span>
                        ) : column.key === 'actions' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onEdit?.(row);
                              }}
                              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Edit study"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDelete?.(row);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete study"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : column.key === 'doi' ? (
                          <span
                            className="text-gray-700 block truncate max-w-32"
                            title={row[column.key]}
                          >
                            {row[column.key]}
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            {Array.isArray(row[column.key])
                              ? row[column.key].join(', ')
                              : row[column.key]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr
                      style={{ backgroundColor: 'var(--ic-color-expanded-bg)' }}
                    >
                      <td></td>
                      <td colSpan={columnOrder.length} className="px-4 py-4">
                        <div className="transition-all duration-200 ease-in-out">
                          {expandRender ? (
                            expandRender(row)
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {row.summary?.substring(0, 240)}
                                  {row.summary?.length > 240 ? '...' : ''}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={getCategoryBadgeVariant(
                                    row.category
                                  )}
                                >
                                  {row.category}
                                </Badge>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleTitleClick(row);
                                  }}
                                  className="text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center gap-1"
                                >
                                  View details
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
