import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from './ui/table';

// Example data for the table
const tableData = [
  { name: "John Doe", age: 28, role: "Developer" },
  { name: "Jane Smith", age: 32, role: "Designer" },
  { name: "Samuel Green", age: 25, role: "Product Manager" },
];

const MyTable = () => {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full table-auto border-separate border-spacing-0.5">
        <TableHead>
          <TableRow>
            <TableHeadCell className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</TableHeadCell>
            <TableHeadCell className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Age</TableHeadCell>
            <TableHeadCell className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row, index) => (
            <TableRow key={index} className="bg-white border-b hover:bg-gray-50">
              <TableCell className="px-6 py-3 text-sm text-gray-800">{row.name}</TableCell>
              <TableCell className="px-6 py-3 text-sm text-gray-800">{row.age}</TableCell>
              <TableCell className="px-6 py-3 text-sm text-gray-800">{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MyTable;
