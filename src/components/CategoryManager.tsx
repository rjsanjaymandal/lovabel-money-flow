import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryManager({ open, onOpenChange, categories, onCategoriesChange }: CategoryManagerProps) {
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [newCategory, setNewCategory] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (localCategories.includes(newCategory.trim())) {
      toast({
        title: "Error",
        description: "Category already exists",
        variant: "destructive",
      });
      return;
    }

    const updated = [...localCategories, newCategory.trim()];
    setLocalCategories(updated);
    setNewCategory("");
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  const handleDeleteCategory = (index: number) => {
    const updated = localCategories.filter((_, i) => i !== index);
    setLocalCategories(updated);
    toast({
      title: "Success",
      description: "Category deleted successfully",
    });
  };

  const handleEditCategory = (index: number) => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updated = [...localCategories];
    updated[index] = editValue.trim();
    setLocalCategories(updated);
    setEditingIndex(null);
    setEditValue("");
    toast({
      title: "Success",
      description: "Category updated successfully",
    });
  };

  const handleSave = () => {
    onCategoriesChange(localCategories);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Category */}
          <div className="space-y-2">
            <Label>Add New Category</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="sm" className="gradient-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <Label>Existing Categories</Label>
            {localCategories.map((category, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                {editingIndex === index ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleEditCategory(index)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={() => handleEditCategory(index)} size="sm" variant="outline">
                      Save
                    </Button>
                    <Button onClick={() => setEditingIndex(null)} size="sm" variant="outline">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{category}</span>
                    <Button
                      onClick={() => {
                        setEditingIndex(index);
                        setEditValue(category);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCategory(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full gradient-primary">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
