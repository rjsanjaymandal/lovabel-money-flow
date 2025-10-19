import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LendBorrowRecord {
  id: string;
  type: string;
  person_name: string;
  amount: number;
  description: string;
  date: string;
  status: string;
}

interface PersonGroup {
  personName: string;
  records: LendBorrowRecord[];
  totalAmount: number;
  type: string;
}

export const LendBorrowSection = ({ userId }: { userId: string }) => {
  const [records, setRecords] = useState<LendBorrowRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [quickAddForms, setQuickAddForms] = useState<Record<string, { amount: string; description: string }>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    person_name: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (userId) {
      fetchRecords();
    }
  }, [userId]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("lend_borrow")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (data) setRecords(data);
  };

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
      fetchRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuickAdd = async (personName: string, type: "lent" | "borrowed") => {
    const form = quickAddForms[personName];
    if (!form?.amount) {
      toast({
        title: "Error",
        description: "Please enter an amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type,
        person_name: personName,
        amount: parseFloat(form.amount),
        description: form.description || null,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Transaction added successfully.`,
      });

      setQuickAddForms({ ...quickAddForms, [personName]: { amount: "", description: "" } });
      fetchRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSettle = async (id: string) => {
    const { error } = await supabase
      .from("lend_borrow")
      .update({ status: "settled" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settled!",
        description: "Transaction marked as settled.",
      });
      fetchRecords();
    }
  };

  const handleClearAll = async (personName: string) => {
    const pendingForPerson = records.filter(
      (r) => r.person_name === personName && r.status === "pending"
    );

    const ids = pendingForPerson.map((r) => r.id);

    const { error } = await supabase
      .from("lend_borrow")
      .update({ status: "settled" })
      .in("id", ids);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "All Cleared!",
        description: `All transactions with ${personName} have been settled.`,
      });
      fetchRecords();
    }
  };

  const pendingRecords = records.filter((r) => r.status === "pending");
  const settledRecords = records.filter((r) => r.status === "settled");

  // Group all records by person (pending + settled)
  const allGrouped: PersonGroup[] = [];
  const personMap = new Map<string, PersonGroup>();

  records.forEach((record) => {
    if (!personMap.has(record.person_name)) {
      personMap.set(record.person_name, {
        personName: record.person_name,
        records: [],
        totalAmount: 0,
        type: record.type,
      });
    }
    const group = personMap.get(record.person_name)!;
    group.records.push(record);
    if (record.status === "pending") {
      group.totalAmount += record.type === "lent" ? record.amount : -record.amount;
    }
  });

  personMap.forEach((value) => {
    allGrouped.push(value);
  });

  const totalLent = pendingRecords
    .filter((r) => r.type === "lent")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalBorrowed = pendingRecords
    .filter((r) => r.type === "borrowed")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">You Lent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">₹{totalLent.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">You Borrowed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">₹{totalBorrowed.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">People</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="person">Person Name</Label>
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
                Add Person
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {allGrouped.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No people added yet. Click "Add Person" to start tracking!
            </CardContent>
          </Card>
        ) : (
          allGrouped.map((group) => {
            const form = quickAddForms[group.personName] || { amount: "", description: "" };
            const isExpanded = expandedPerson === group.personName;
            
            return (
              <Card key={group.personName} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedPerson(isExpanded ? null : group.personName)}>
                    {/* Person Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-2 cursor-pointer flex-1">
                            <div>
                              <h4 className="font-semibold text-lg">{group.personName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {group.records.filter(r => r.status === "pending").length} pending
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${
                                group.totalAmount >= 0 ? "text-success" : "text-accent"
                              }`}
                            >
                              ₹{Math.abs(group.totalAmount).toFixed(2)}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {group.totalAmount >= 0 ? "You'll Get" : "You Owe"}
                            </Badge>
                          </div>
                          {group.records.some(r => r.status === "pending") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleClearAll(group.personName)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Form */}
                      <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Amount (₹)"
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) =>
                              setQuickAddForms({
                                ...quickAddForms,
                                [group.personName]: { ...form, amount: e.target.value },
                              })
                            }
                          />
                          <Input
                            placeholder="Description (optional)"
                            value={form.description}
                            onChange={(e) =>
                              setQuickAddForms({
                                ...quickAddForms,
                                [group.personName]: { ...form, description: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-success hover:bg-success/90"
                            onClick={() => handleQuickAdd(group.personName, "lent")}
                          >
                            Given
                          </Button>
                          <Button
                            className="flex-1 bg-accent hover:bg-accent/90"
                            onClick={() => handleQuickAdd(group.personName, "borrowed")}
                          >
                            Taken
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Transaction History */}
                    <CollapsibleContent>
                      <div className="space-y-2 mt-4 pt-4 border-t">
                        <h5 className="text-sm font-semibold text-muted-foreground">Transaction History</h5>
                        {group.records.map((record) => (
                          <div
                            key={record.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              record.status === "pending" ? "bg-muted/50" : "opacity-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  record.status === "settled"
                                    ? "bg-muted"
                                    : record.type === "lent"
                                    ? "bg-success/10"
                                    : "bg-accent/10"
                                }`}
                              >
                                {record.status === "settled" ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Clock className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {record.type === "lent" ? "Given" : "Taken"}
                                  </p>
                                  {record.description && (
                                    <p className="text-xs text-muted-foreground">• {record.description}</p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(record.date), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${record.type === "lent" ? "text-success" : "text-accent"}`}>
                                {record.type === "lent" ? "+" : "-"}₹{record.amount.toFixed(2)}
                              </p>
                              {record.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSettle(record.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Settle
                                </Button>
                              )}
                              {record.status === "settled" && (
                                <Badge variant="secondary" className="text-xs">Settled</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
