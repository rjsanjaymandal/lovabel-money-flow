import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: "lent",
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
        type: formData.type,
        person_name: formData.person_name,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        date: formData.date,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Record added successfully.",
      });

      setOpen(false);
      setFormData({
        type: "lent",
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

  // Group pending records by person
  const groupedPending: PersonGroup[] = [];
  const personMap = new Map<string, PersonGroup>();

  pendingRecords.forEach((record) => {
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
    group.totalAmount += record.amount;
  });

  personMap.forEach((value) => {
    groupedPending.push(value);
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
        <h3 className="text-lg font-semibold">Pending Transactions</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lend/Borrow Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lent">I Lent Money</SelectItem>
                    <SelectItem value="borrowed">I Borrowed Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="amount">Amount (₹)</Label>
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
                Add Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {groupedPending.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No pending transactions. All settled!
            </CardContent>
          </Card>
        ) : (
          groupedPending.map((group) => (
            <Card key={group.personName} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Person Header with Clear All button */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <h4 className="font-semibold text-lg">{group.personName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.records.length} transaction{group.records.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            group.type === "lent" ? "text-success" : "text-accent"
                          }`}
                        >
                          ₹{group.totalAmount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {group.type === "lent" ? "You Lent" : "You Borrowed"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClearAll(group.personName)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Individual transactions */}
                  <div className="space-y-2">
                    {group.records.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              record.type === "lent" ? "bg-success/10" : "bg-accent/10"
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            {record.description && (
                              <p className="text-sm font-medium">{record.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">₹{record.amount.toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSettle(record.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Settle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {settledRecords.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-8">Settled Transactions</h3>
          <div className="space-y-2 opacity-60">
            {settledRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{record.person_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-muted-foreground">
                        ₹{record.amount.toFixed(2)}
                      </p>
                      <Badge variant="secondary">Settled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
