
// File: components/profile/SkillsManager.js
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SkillsManager({ skills, onUpdate }) {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onUpdate([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    onUpdate(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddSkill} className="flex gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a new skill..."
        />
        <Button type="submit">Add</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleRemoveSkill(skill)}
          >
            {skill} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}