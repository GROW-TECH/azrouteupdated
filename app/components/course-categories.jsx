// // components/course-categories.jsx
// import { useState } from 'react';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// export const CATEGORIES = [
//   // 'Web Development',
//   // 'Mobile Development',
//   // 'Data Science',
//   // 'Machine Learning',
//   // 'DevOps',
//   // 'Cloud Computing',
//   // 'Cybersecurity',
//   // 'Blockchain',
//   // 'Game Development',
//   'Dentistry',
//   'Medical',
//   'Nursing',
//   'Other'
// ];

// export function CourseCategories({ value, onChange }) {
//   const [customCategory, setCustomCategory] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(value || '');

//   const handleCategoryChange = (newValue) => {
//     setSelectedCategory(newValue);
//     if (newValue !== 'Other') {
//       onChange(newValue);
//     }
//   };

//   const handleCustomCategoryChange = (e) => {
//     setCustomCategory(e.target.value);
//     onChange(e.target.value);
//   };

//   return (
//     <div className="space-y-2">
//       <Select value={selectedCategory} onValueChange={handleCategoryChange}>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Category" />
//         </SelectTrigger>
//         <SelectContent>
//           {CATEGORIES.map(category => (
//             <SelectItem key={category} value={category}>
//               {category}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
      
//       {selectedCategory === 'Other' && (
//         <Input
//           placeholder="Enter custom category"
//           value={customCategory}
//           onChange={handleCustomCategoryChange}
//           className="mt-2"
//         />
//       )}
//     </div>
//   );
// }