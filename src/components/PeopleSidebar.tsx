import { Users, Plus, TrendingUp, TrendingDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Person {
  name: string;
  balance: number;
}

interface PeopleSidebarProps {
  people: Person[];
  selectedPerson: string | null;
  onSelectPerson: (name: string) => void;
  onPersonAdded: () => void;
}

export function PeopleSidebar({ people, selectedPerson, onSelectPerson, onPersonAdded }: PeopleSidebarProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    person_name: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type: "lent",
        person_name: formData.person_name,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        date: formData.date,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: "Contact added successfully.",
      });

      setOpen(false);
      setFormData({
        person_name: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      onPersonAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className="w-80 border-r animate-slide-in-left">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SidebarGroupLabel className="text-base font-semibold">Contacts</SidebarGroupLabel>
                  <p className="text-xs text-muted-foreground">{people.length} people</p>
                </div>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 w-9 p-0 rounded-full gradient-primary hover:opacity-90 transition-opacity">
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Add New Contact 👤</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="person">Contact Name</Label>
                      <Input
                        id="person"
                        placeholder="John Doe"
                        value={formData.person_name}
                        onChange={(e) =>
                          setFormData({ ...formData, person_name: e.target.value })
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Initial Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        placeholder="Add notes..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>

                    <Button type="submit" className="w-full h-11 gradient-primary hover:opacity-90 transition-opacity">
                      Add Contact
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {people.length === 0 ? (
                <div className="px-4 py-12 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No contacts yet</p>
                  <p className="text-xs text-muted-foreground">Add someone to get started!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {people.map((person) => (
                    <SidebarMenuItem key={person.name}>
                      <SidebarMenuButton
                        onClick={() => onSelectPerson(person.name)}
                        isActive={selectedPerson === person.name}
                        className="w-full h-auto py-3 px-3 rounded-xl hover:bg-sidebar-accent transition-all duration-200 data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              person.balance >= 0 
                                ? 'gradient-success' 
                                : 'gradient-accent'
                            }`}>
                              {person.balance >= 0 ? (
                                <TrendingUp className="h-5 w-5 text-white" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{person.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {person.balance >= 0 ? "You'll get" : "You owe"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`font-bold text-xs px-2 py-1 ${
                              person.balance >= 0 
                                ? 'border-success/30 bg-success/10 text-success' 
                                : 'border-accent/30 bg-accent/10 text-accent'
                            }`}
                          >
                            {person.balance >= 0 ? '+' : '-'}₹{Math.abs(person.balance).toFixed(0)}
                          </Badge>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
