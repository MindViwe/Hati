import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CreateDialogProps {
  title: string;
  description: string;
  children: (close: () => void) => React.ReactNode;
}

export function CreateDialog({ title, description, children }: CreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-secondary/95 border-white/10 backdrop-blur-xl text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {children(() => setOpen(false))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
