import { Users, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
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
        title: "Success!",
        description: "Person added successfully.",
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
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 py-2">
            {!collapsed && <SidebarGroupLabel>Contacts</SidebarGroupLabel>}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
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
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Add Contact
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {people.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {!collapsed ? "No contacts yet" : <Users className="h-4 w-4 mx-auto" />}
                </div>
              ) : (
                people.map((person) => (
                  <SidebarMenuItem key={person.name}>
                    <SidebarMenuButton
                      onClick={() => onSelectPerson(person.name)}
                      isActive={selectedPerson === person.name}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        {!collapsed ? (
                          <>
                            <span className="truncate">{person.name}</span>
                            <Badge
                              variant={person.balance >= 0 ? "default" : "secondary"}
                              className={person.balance >= 0 ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}
                            >
                              {person.balance >= 0 ? "+" : ""}₹{Math.abs(person.balance).toFixed(0)}
                            </Badge>
                          </>
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
