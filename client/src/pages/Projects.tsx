import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { CreateDialog } from "@/components/CreateDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Code2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { mutate: createProject, isPending } = useCreateProject();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      language: "javascript",
      code: "// Start coding...",
    },
  });

  const onSubmit = (data: InsertProject) => {
    createProject(data, {
      onSuccess: (project) => {
        form.reset();
        setSelectedProject(project.id); // Open newly created project
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
          <h1 className="text-4xl font-display font-bold text-white mb-2">Projects</h1>
          <p className="text-muted-foreground">Digital creations by Hati & Azura</p>
        </div>
        
        <CreateDialog title="New Project" description="Create a new codebase or application idea.">
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
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Neural Network UI" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief overview..." className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="javascript, python, etc." className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isPending} className="bg-primary text-white hover:bg-primary/90">
                    {isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CreateDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {projects?.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Card className="bg-secondary/40 border-white/5 hover:border-primary/50 hover:bg-secondary/60 transition-all cursor-pointer group h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Code2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground border border-white/10 px-2 py-1 rounded">
                        {project.language}
                      </span>
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-muted-foreground mt-4">
                      <Calendar className="w-3 h-3 mr-2" />
                      {project.createdAt && format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] bg-[#1e1e1e] text-white border-white/10 p-0 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10 bg-secondary">
                  <h2 className="text-2xl font-display font-bold">{project.title}</h2>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex-1 overflow-auto bg-[#282c34]">
                  <SyntaxHighlighter 
                    language={project.language || 'javascript'} 
                    style={atomOneDark}
                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}
                  >
                    {project.code || '// No code available'}
                  </SyntaxHighlighter>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl">
            <Code2 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No projects yet</p>
            <p className="text-sm">Ask Hati to create something amazing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
