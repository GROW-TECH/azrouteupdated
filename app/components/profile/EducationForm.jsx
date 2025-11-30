import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

export function EducationForm({ education = [], onSubmit, onDelete }) {
  // Ensure education is always an array
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field: '',
    startDate: null,
    endDate: null,
    current: false
  });
  
  const [editIndex, setEditIndex] = useState(null);

  // Handling form submission (edit or add new)
  const handleSubmit = () => {
    if (editIndex !== null) {
      // Update existing entry
      const updatedEducation = [...education];
      updatedEducation[editIndex] = formData;
      onSubmit(updatedEducation);
    } else {
      // Add new education entry
      onSubmit([...education, formData]);
    }
    // Reset form after submission
    setFormData({
      school: '',
      degree: '',
      field: '',
      startDate: null,
      endDate: null,
      current: false
    });
    setEditIndex(null);
  };

  // Edit specific education entry
  const handleEdit = (index) => {
    setFormData(education[index]);
    setEditIndex(index);
  };

  // Handle delete
  const handleDelete = (index) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    onDelete(updatedEducation);
  };

  useEffect(() => {
    if (editIndex !== null) {
      setFormData(education[editIndex]);
    }
  }, [editIndex, education]);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>School/Institution</Label>
          <Input
            value={formData.school}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              school: e.target.value
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Degree</Label>
          <Input
            value={formData.degree}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              degree: e.target.value
            }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Field of Study</Label>
        <Input
          value={formData.field}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            field: e.target.value
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <DatePicker
            date={formData.startDate}
            onSelect={(date) => setFormData(prev => ({
              ...prev,
              startDate: date
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <DatePicker
            date={formData.endDate}
            onSelect={(date) => setFormData(prev => ({
              ...prev,
              endDate: date
            }))}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {editIndex !== null && (
          <Button 
            variant="destructive" 
            onClick={() => handleDelete(editIndex)}
          >
            Delete
          </Button>
        )}
        <Button
          onClick={handleSubmit}
        >
          {editIndex !== null ? 'Update' : 'Save'}
        </Button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Education Entries</h3>
        <ul>
          {Array.isArray(education) && education.length > 0 ? (
            education.map((edu, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{edu.school} - {edu.degree}</span>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(index)}
                    className="mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))
          ) : (
            <p>No education entries available.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
