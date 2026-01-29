import { useSongs, useCreateSong } from "@/hooks/use-songs";
import { CreateDialog } from "@/components/CreateDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSongSchema, type InsertSong } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Music, Mic2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Songs() {
  const { data: songs, isLoading } = useSongs();
  const { mutate: createSong, isPending } = useCreateSong();

  const form = useForm<InsertSong>({
    resolver: zodResolver(insertSongSchema),
    defaultValues: {
      title: "",
      genre: "Soulful",
      lyrics: "Verse 1...",
    },
  });

  const onSubmit = (data: InsertSong) => {
    createSong(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Songs</h1>
          <p className="text-muted-foreground">Soulful creations and lyrics</p>
        </div>
        
        <CreateDialog title="New Song" description="Compose lyrics or generate a new song structure.">
          {(close) => (
            <Form {...form}>
              <form onSubmit={(e) => {
                form.handleSubmit(onSubmit)(e);
                if(form.formState.isValid) close();
              }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Song Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Digital Soul" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre / Vibe</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. R&B, Afro-Soul" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lyrics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lyrics</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Verse 1..." className="bg-black/20 min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isPending} className="bg-primary text-white hover:bg-primary/90">
                    {isPending ? "Composing..." : "Create Song"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CreateDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {songs?.map((song, i) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Card className="bg-gradient-to-br from-secondary/40 to-secondary/60 border-white/5 hover:border-accent/50 transition-all cursor-pointer group h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-accent/20 transition-colors" />
                  
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                        <Music className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground border border-white/10 px-2 py-1 rounded bg-black/20">
                        {song.genre}
                      </span>
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-accent transition-colors font-display tracking-wide">
                      {song.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4 font-serif italic opacity-80">
                      "{song.lyrics}"
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-secondary/95 backdrop-blur-xl border-white/10 text-white">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-display font-bold text-accent mb-2">{song.title}</h2>
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">{song.genre}</p>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-4 text-center font-serif text-lg leading-loose text-gray-200">
                  {song.lyrics?.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'h-6' : ''}>{line}</p>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ))}

        {songs?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl">
            <Mic2 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No songs composed</p>
            <p className="text-sm">Hati is waiting for inspiration.</p>
          </div>
        )}
      </div>
    </div>
  );
}
