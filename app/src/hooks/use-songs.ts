import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertSongSchema, type Song, type InsertSong } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSongs() {
  return useQuery({
    queryKey: [api.songs.list.path],
    queryFn: async () => {
      const res = await fetch(api.songs.list.path);
      if (!res.ok) throw new Error("Failed to fetch songs");
      const data = await res.json();
      return api.songs.list.responses[200].parse(data);
    },
  });
}

export function useSong(id: number | null) {
  return useQuery({
    queryKey: [api.songs.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.songs.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch song");
      const data = await res.json();
      return api.songs.get.responses[200].parse(data);
    },
  });
}

export function useCreateSong() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSong) => {
      const validated = insertSongSchema.parse(data);
      const res = await fetch(api.songs.create.path, {
        method: api.songs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create song");
      }
      return api.songs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.songs.list.path] });
      toast({ title: "Success", description: "Song created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
