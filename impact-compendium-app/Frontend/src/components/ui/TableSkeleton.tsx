import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 7 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              {Array.from({ length: columns - 1 }, (_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="w-8 px-2 py-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                {Array.from({ length: columns - 1 }, (_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className={`h-4 bg-gray-200 rounded animate-pulse ${colIndex === 0 ? 'w-3/4' : colIndex === 1 ? 'w-16' : 'w-1/2'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
