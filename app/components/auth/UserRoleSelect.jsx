// components/auth/UserRoleSelect.jsx
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

export function UserRoleSelect({ value, onChange }) {
  return (
    <RadioGroup
      defaultValue={value}
      onValueChange={onChange}
      className="flex justify-center space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="student" id="student" />
        <Label htmlFor="student">Student</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="teacher" id="teacher" />
        <Label htmlFor="teacher">Teacher</Label>
      </div>
    </RadioGroup>
  );
}