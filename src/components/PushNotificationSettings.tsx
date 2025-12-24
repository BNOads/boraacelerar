import { useState } from "react";
import { Bell, BellOff, Smartphone, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function PushNotificationSettings() {
    const { toast } = useToast();
    const {
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        isiOS,
        isPWA,
        subscribe,
        unsubscribe
    } = usePushNotifications();
    const [isSendingTest, setIsSendingTest] = useState(false);

    const handleToggle = async () => {
        try {
            if (isSubscribed) {
                await unsubscribe();
                toast({ title: "Notificações desativadas" });
            } else {
                await subscribe();
                toast({ title: "Notificações ativadas!" });
            }
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleSendTest = async () => {
        setIsSendingTest(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            await supabase.functions.invoke('send-push-notification', {
                body: {
                    user_id: user.id,
                    payload: {
                        title: "Notificação de Teste 🔔",
                        body: "As notificações push estão funcionando!",
                        url: "/"
                    }
                }
            });

            toast({ title: "Teste enviado!" });
        } catch (error: any) {
            toast({ title: "Falha ao enviar", description: error.message, variant: "destructive" });
        } finally {
            setIsSendingTest(false);
        }
    };

    // iOS not in PWA mode - show instructions
    if (isiOS && !isPWA) {
        return (
            <div className="p-4 rounded-lg bg-card/50 border border-border space-y-4">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Notificações Push</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Instale o app primeiro para ativar as notificações.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                    <p>1. Toque no botão Compartilhar no Safari</p>
                    <p>2. Role para baixo e toque em "Adicionar à Tela de Início"</p>
                    <p>3. Abra o app pela tela de início</p>
                </div>
            </div>
        );
    }

    // Not supported
    if (!isSupported) {
        return (
            <div className="p-4 rounded-lg bg-card/10 border border-dashed border-border opacity-60">
                <div className="flex items-center gap-3">
                    <BellOff className="w-5 h-5" />
                    <div>
                        <h3 className="font-semibold">Notificações Push</h3>
                        <p className="text-xs">Não suportado neste navegador</p>
                    </div>
                </div>
            </div>
        );
    }

    // Permission denied
    if (permission === 'denied') {
        return (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                        <h3 className="font-semibold">Notificações Push</h3>
                        <p className="text-xs">Permissão negada - verifique as configurações do navegador</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-lg bg-card/50 border border-border space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isSubscribed ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                    <div>
                        <h3 className="font-semibold">Notificações Push</h3>
                        <p className="text-xs text-muted-foreground">
                            {isSubscribed ? "Ativado" : "Desativado"}
                        </p>
                    </div>
                </div>
                <Switch
                    checked={isSubscribed}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                />
            </div>

            {isSubscribed && (
                <div className="flex items-center gap-3 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendTest}
                        disabled={isSendingTest}
                        className="w-full text-xs h-8"
                    >
                        {isSendingTest ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                        Enviar Teste
                    </Button>
                </div>
            )}
        </div>
    );
}
