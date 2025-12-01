import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CreditCard, Plus, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
}

export const SubscriptionManager = ({ userId, onTransactionAdded }: { userId: string; onTransactionAdded: () => void }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", amount: "", dueDay: "" });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(`subscriptions-${userId}`);
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, [userId]);

  const saveSubscriptions = (subs: Subscription[]) => {
    setSubscriptions(subs);
    localStorage.setItem(`subscriptions-${userId}`, JSON.stringify(subs));
  };

  const handleAdd = () => {
    if (!newSub.name || !newSub.amount || !newSub.dueDay) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const sub: Subscription = {
      id: crypto.randomUUID(),
      name: newSub.name,
      amount: parseFloat(newSub.amount),
      dueDay: parseInt(newSub.dueDay),
    };

    saveSubscriptions([...subscriptions, sub]);
    setNewSub({ name: "", amount: "", dueDay: "" });
    toast({ title: "Subscription Added" });
  };

  const handleDelete = (id: string) => {
    saveSubscriptions(subscriptions.filter(s => s.id !== id));
  };

  const handlePay = async (sub: Subscription) => {
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "expense",
        amount: sub.amount,
        category: "Bills & Utilities",
        description: `Subscription: ${sub.name}`,
        date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({ title: "Paid!", description: `Logged ₹${sub.amount} for ${sub.name}` });
      onTransactionAdded();
    } catch (error) {
      toast({ title: "Error", description: "Failed to log payment", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 px-4 rounded-xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Manage Subscriptions</p>
            <p className="text-xs text-muted-foreground">{subscriptions.length} active</p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscriptions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add New Form */}
          <div className="grid grid-cols-3 gap-2 items-end bg-muted/30 p-3 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input 
                value={newSub.name} 
                onChange={e => setNewSub({...newSub, name: e.target.value})} 
                placeholder="Netflix"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input 
                type="number" 
                value={newSub.amount} 
                onChange={e => setNewSub({...newSub, amount: e.target.value})} 
                placeholder="199"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Day</Label>
              <div className="flex gap-1">
                <Input 
                  type="number" 
                  min="1" max="31"
                  value={newSub.dueDay} 
                  onChange={e => setNewSub({...newSub, dueDay: e.target.value})} 
                  placeholder="5"
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleAdd} className="h-8 w-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {subscriptions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No subscriptions added.</p>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{sub.dueDay}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{sub.name}</p>
                      <p className="text-sm text-muted-foreground">₹{sub.amount}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handlePay(sub)} title="Log Payment">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)} title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
