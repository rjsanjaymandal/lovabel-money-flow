import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Plus, Tag, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryManager({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
}: CategoryManagerProps) {
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

  const isMobile = useIsMobile();

  const ManagerContent = (
    <div className="space-y-6">
      {/* Add New Category */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
          Add New Category
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter category name"
              maxLength={100}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={handleAddCategory}
            className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20 shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
          Existing Categories
        </Label>
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
          {localCategories.map((category, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10"
            >
              {editingIndex === index ? (
                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-200">
                  <Input
                    value={editValue}
                    maxLength={100}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleEditCategory(index)
                    }
                    className="flex-1 h-10 rounded-xl bg-background/50 border-primary/20"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleEditCategory(index)}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 rounded-lg h-10"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingIndex(null)}
                    size="sm"
                    variant="ghost"
                    className="rounded-lg h-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground/90">
                    {category}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => {
                        setEditingIndex(index);
                        setEditValue(category);
                      }}
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCategory(index)}
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Mobile delete button always visible */}
                  <div className="sm:hidden">
                    <Button
                      onClick={() => handleDeleteCategory(index)}
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl text-muted-foreground/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {localCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              No categories found. Add one above.
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="w-full h-14 rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
      >
        Save Changes
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 pt-2 max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
          <DrawerHeader className="p-0 mb-6">
            <DrawerTitle className="text-2xl font-black tracking-tight text-center">
              Manage Categories
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Edit your transaction categories
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto no-scrollbar pb-10">
            {ManagerContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/5 bg-card/95 backdrop-blur-2xl shadow-2xl p-8 rounded-[2.5rem]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black tracking-tight text-center">
            Manage Categories
          </DialogTitle>
        </DialogHeader>
        {ManagerContent}
      </DialogContent>
    </Dialog>
  );
}
