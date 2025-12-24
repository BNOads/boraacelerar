import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit } from "lucide-react";
import { AIAgent } from "@/data/ai-agents";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminAgenteDialogProps {
    agent?: AIAgent;
    onSuccess: (agent: AIAgent) => void;
    onDelete?: (id: string) => void;
    categories: string[];
}

export function AdminAgenteDialog({
    agent,
    onSuccess,
    onDelete,
    categories,
}: AdminAgenteDialogProps) {
    const [open, setOpen] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [formData, setFormData] = useState<Partial<AIAgent>>({
        category: categories[0] || "",
        title: "",
        url: "",
    });

    useEffect(() => {
        if (agent && open) {
            setFormData(agent);
        } else if (!agent && open) {
            setFormData({
                category: categories[0] || "",
                title: "",
                url: "",
            });
        }
    }, [agent, open, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.url || !formData.category) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const updatedAgent: AIAgent = {
            id: agent?.id || Math.random().toString(36).substr(2, 9),
            category: formData.category!,
            title: formData.title!,
            url: formData.url!,
            order: agent?.order || 0,
        };

        onSuccess(updatedAgent);
        setOpen(false);
        toast.success(agent ? "Agente atualizado!" : "Agente adicionado!");
    };

    const handleDelete = () => {
        if (agent?.id && onDelete) {
            onDelete(agent.id);
            setShowDeleteAlert(false);
            setOpen(false);
            toast.success("Agente removido!");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {agent ? (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Button>
                    ) : (
                        <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Agente
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{agent ? "Editar Agente" : "Adicionar Novo Agente"}</DialogTitle>
                        <DialogDescription>
                            Preencha as informações do agente de IA abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Metas do negócio"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">URL do ChatGPT/Agente *</Label>
                            <Input
                                id="url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://chatgpt.com/g/..."
                                required
                            />
                        </div>

                        <div className="flex justify-between gap-2 pt-4">
                            {agent && onDelete ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteAlert(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                </Button>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {agent ? "Salvar Alterações" : "Adicionar"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover este agente? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
