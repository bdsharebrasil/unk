import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Calendar,
  MapPin,
  User
} from 'lucide-react';

interface Contract {
  id: string;
  event_id: string;
  dj_id: string;
  producer_id: string;
  cache_value: number;
  contract_content?: string;
  contract_url?: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
  
  // Relations
  event?: {
    event_name: string;
    event_date: string;
    location?: string;
    city?: string;
  };
  dj?: {
    artist_name: string;
    avatar_url?: string;
  };
  producer?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (contract) {
      setContractContent(contract.contract_content || generateDefaultContract(contract));
    }
  }, [contract]);

  const generateDefaultContract = (contractData: Contract) => {
    const eventDate = contractData.event?.event_date 
      ? format(new Date(contractData.event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : 'Data a definir';

    const location = contractData.event?.location && contractData.event?.city
      ? `${contractData.event.location}, ${contractData.event.city}`
      : contractData.event?.location || contractData.event?.city || 'Local a definir';

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DJ

CONTRATANTE: ${contractData.producer?.full_name || 'Produtor'}
CONTRATADO(A): ${contractData.dj?.artist_name || 'DJ'}

EVENTO: ${contractData.event?.event_name || 'Evento'}
DATA: ${eventDate}
LOCAL: ${location}

VALOR DO CACHÊ: R$ ${contractData.cache_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CLÁUSULAS:

1. DO OBJETO
O presente contrato tem por objeto a prestação de serviços de DJ pelo CONTRATADO para o evento acima especificado.

2. DO VALOR E PAGAMENTO
O valor total dos serviços é de R$ ${contractData.cache_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, que será pago conforme acordado entre as partes.

3. DAS OBRIGAÇÕES DO CONTRATADO
- Apresentar-se no local e horário acordados
- Executar os serviços com qualidade profissional
- Levar equipamentos necessários conforme rider técnico

4. DAS OBRIGAÇÕES DO CONTRATANTE
- Efetuar o pagamento na forma acordada
- Disponibilizar as condições técnicas necessárias
- Fornecer energia elétrica e espaço adequado

5. DISPOSIÇÕES GERAIS
Este contrato é válido para o evento especificado e substitui todos os acordos anteriores sobre o mesmo objeto.

Local e Data: ${new Date().toLocaleDateString('pt-BR')}

___________________________    ___________________________
       CONTRATANTE                    CONTRATADO(A)`;
  };

  const handleSaveContract = async () => {
    if (!contract) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          contract_content: contractContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({ 
        title: 'Contrato atualizado', 
        description: 'O conteúdo do contrato foi salvo com sucesso.' 
      });

      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao salvar contrato', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!contract) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          signed: true,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({ 
        title: 'Contrato assinado', 
        description: 'Você assinou o contrato com sucesso.' 
      });

      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      onClose();
    } catch (error: any) {
      console.error('Error signing contract:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao assinar contrato', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!contract) return null;

  const canEdit = userProfile?.role === 'admin' || 
                  (userProfile?.role === 'producer' && userProfile.id === contract.producer_id);
  const canSign = userProfile?.role === 'dj' && userProfile.id === contract.dj_id && !contract.signed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato - {contract.event?.event_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {contract.signed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 font-medium">Contrato Assinado</span>
                  {contract.signed_at && (
                    <Badge variant="outline">
                      Assinado em {format(new Date(contract.signed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">Aguardando Assinatura</span>
                </>
              )}
            </div>

            {canEdit && !contract.signed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar Edição' : 'Editar Contrato'}
              </Button>
            )}
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {contract.event?.event_date 
                    ? format(new Date(contract.event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : 'Data não definida'
                  }
                </span>
              </div>

              {(contract.event?.location || contract.event?.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {contract.event.location && contract.event.city
                      ? `${contract.event.location}, ${contract.event.city}`
                      : contract.event.location || contract.event.city
                    }
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  Cachê: R$ {contract.cache_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>DJ: {contract.dj?.artist_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Produtor: {contract.producer?.full_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contract Content */}
          <div>
            <Label htmlFor="contract_content">Conteúdo do Contrato</Label>
            {isEditing ? (
              <Textarea
                id="contract_content"
                value={contractContent}
                onChange={(e) => setContractContent(e.target.value)}
                rows={20}
                className="mt-2 font-mono text-sm"
                placeholder="Digite o conteúdo do contrato..."
              />
            ) : (
              <Card>
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {contractContent}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>

          {isEditing && (
            <Button 
              onClick={handleSaveContract}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Contrato'}
            </Button>
          )}

          {canSign && (
            <Button 
              onClick={handleSignContract}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Assinando...' : 'Assinar Contrato'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};