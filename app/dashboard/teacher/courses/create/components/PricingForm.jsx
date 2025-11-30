// app/dashboard/teacher/courses/create/components/PricingForm.jsx

'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, DollarSign } from "lucide-react";

export function PricingForm({ data, onChange }) {
  const addRequirement = () => {
    onChange('requirements', [...(data.requirements || []), '']);
  };

  const removeRequirement = (index) => {
    const newRequirements = [...data.requirements];
    newRequirements.splice(index, 1);
    onChange('requirements', newRequirements);
  };

  const updateRequirement = (index, value) => {
    const newRequirements = [...data.requirements];
    newRequirements[index] = value;
    onChange('requirements', newRequirements);
  };

  const addObjective = () => {
    onChange('objectives', [...(data.objectives || []), '']);
  };

  const removeObjective = (index) => {
    const newObjectives = [...data.objectives];
    newObjectives.splice(index, 1);
    onChange('objectives', newObjectives);
  };

  const updateObjective = (index, value) => {
    const newObjectives = [...data.objectives];
    newObjectives[index] = value;
    onChange('objectives', newObjectives);
  };

  return (
    <div className="space-y-8">
      {/* Pricing Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (£)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={data.price || ''}
                  onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discounted Price (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={data.discountedPrice || ''}
                  onChange={(e) => onChange('discountedPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Requirements</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRequirement}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>
          <div className="space-y-2">
            {data.requirements?.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={requirement}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  placeholder="Enter a requirement"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRequirement(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Learning Objectives</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addObjective}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </div>
          <div className="space-y-2">
            {data.objectives?.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder="Enter a learning objective"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}