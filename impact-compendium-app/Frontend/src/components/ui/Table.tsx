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
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowExpand,
  expandedRows = new Set(),
  expandRender,
  onTitleClick,
  sort,
  onSortChange
}) => {
  const [localExpandedRow, setLocalExpandedRow] = useState<string | number | null>(null);
  const [columnOrder, setColumnOrder] = useState<TableColumn[]>(columns);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  const handleRowToggle = (row: TableRow) => {
    const newExpanded = localExpandedRow === row.id ? null : row.id;
    setLocalExpandedRow(newExpanded);
    onRowExpand?.(row);
  };

  const handleTitleClick = (row: TableRow) => {
    onTitleClick?.(row);
  };

  const handleSortClick = (column: TableColumn) => {
    if (!column.sortable || !onSortChange) return;
    
    const newDir = sort?.field === column.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ field: column.key, dir: newDir });
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: TableRow, action: 'expand' | 'title') => {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              {columnOrder.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-bold text-gray-700 tracking-wider cursor-move ${column.width || ''} ${draggedColumn === index ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    {column.sortable ? (
                      <button
                        onClick={() => handleSortClick(column)}
                        onKeyDown={(e) => handleSortKeyDown(e, column)}
                        className="flex items-center gap-1 font-bold text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
                        aria-sort={
                          sort?.field === column.key 
                            ? sort.dir === 'asc' ? 'ascending' : 'descending'
                            : 'none'
                        }
                      >
                        {column.label}
                        <span className="flex flex-col">
                          <svg 
                            className={`w-3 h-3 ${
                              sort?.field === column.key && sort.dir === 'asc' 
                                ? 'text-gray-900' 
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                          <svg 
                            className={`w-3 h-3 -mt-1 ${
                              sort?.field === column.key && sort.dir === 'desc' 
                                ? 'text-gray-900' 
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
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
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const isExpanded = localExpandedRow === row.id;
              const isEven = index % 2 === 0;
              
              return (
                <React.Fragment key={row.id}>
                  <tr 
                    className={`${isEven ? 'bg-white' : 'bg-gray-50'} transition-colors duration-150 ${isExpanded ? 'bg-yellow-50' : 'hover:bg-yellow-50'} cursor-pointer`}
                    style={isExpanded ? { backgroundColor: 'var(--ic-color-expanded-bg)' } : {}}
                    onClick={() => handleTitleClick(row)}
                  >
                    <td className="w-8 px-2 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowToggle(row);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, row, 'expand')}
                        className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} row details`}
                      >
                        <svg 
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    {columnOrder.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.key === 'title' ? (
                          <span className="font-medium text-gray-900">
                            {row[column.key]}
                          </span>
                        ) : column.key === 'category' ? (
                          <Badge variant={getCategoryBadgeVariant(row[column.key])}>
                            {row[column.key]}
                          </Badge>
                        ) : (
                          <span className="text-gray-900">{row[column.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr style={{ backgroundColor: 'var(--ic-color-expanded-bg)' }}>
                      <td></td>
                      <td colSpan={columnOrder.length} className="px-4 py-4">
                        <div className="transition-all duration-200 ease-in-out">
                          {expandRender ? expandRender(row) : (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {row.summary?.substring(0, 240)}
                                  {row.summary?.length > 240 ? '...' : ''}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant={getCategoryBadgeVariant(row.category)}>
                                  {row.category}
                                </Badge>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTitleClick(row);
                                  }}
                                  className="text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center gap-1"
                                >
                                  View details
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
