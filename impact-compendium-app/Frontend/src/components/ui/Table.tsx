import React, { useState } from 'react';
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

interface TableProps {
  columns: TableColumn[];
  data: TableRow[];
  onRowExpand?: (row: TableRow) => void;
  expandedRows?: Set<string | number>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowExpand,
  expandedRows = new Set(),
  searchValue = '',
  onSearchChange
}) => {
  const getCategoryBadgeVariant = (category: string) => {
    if (category.toLowerCase().includes('impact outcome story')) return 'story';
    if (category.toLowerCase().includes('impact')) return 'impact';
    if (category.toLowerCase().includes('outcome')) return 'outcome';
    return 'other';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Header */}
      {onSearchChange && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search studies..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              const isEven = index % 2 === 0;
              
              return (
                <React.Fragment key={row.id}>
                  <tr className={`${isEven ? 'bg-white' : 'bg-yellow-50'} hover:bg-yellow-100 transition-colors`}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.key === 'title' ? (
                          <div>
                            <button
                              onClick={() => onRowExpand?.(row)}
                              className="text-left hover:text-yellow-600 font-medium"
                            >
                              {row[column.key]}
                            </button>
                            {isExpanded && row.summary && (
                              <div className="mt-2 text-gray-600 text-xs">
                                {row.summary}
                              </div>
                            )}
                          </div>
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
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {data.length} results
        </div>
      </div>
    </div>
  );
};
