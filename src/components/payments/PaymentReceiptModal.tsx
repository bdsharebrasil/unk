import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Upload, 
  FileText, 
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  location?: string;
  city?: string;
  cache_value?: number;
}

interface DJ {
  id: string;
  artist_name: string;
  avatar_url?: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  dj: DJ | null;
  cacheValue: number;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  event,
  dj,
  cacheValue
}) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(cacheValue || 0);
  const [notes, setNotes] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione uma imagem (JPG, PNG, GIF) ou PDF.',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB.',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !event || !dj || !userProfile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file name with timestamp
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `payment-receipts/${event.id}/${dj.id}/${timestamp}.${fileExtension}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 80) return prev + 10;
          return prev;
        });
      }, 200);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(90);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL');
      }

      setUploadProgress(95);

      // Save receipt record to database
      const { error: dbError } = await supabase
        .from('payment_receipts')
        .insert({
          event_id: event.id,
          dj_id: dj.id,
          producer_id: userProfile.id,
          receipt_url: urlData.publicUrl,
          amount: amount,
          notes: notes.trim() || null
        });

      if (dbError) throw dbError;

      // Update event_djs payment status
      const { error: eventDjError } = await supabase
        .from('event_djs')
        .update({
          payment_status: 'paid',
          payment_receipt_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', event.id)
        .eq('dj_id', dj.id);

      if (eventDjError) throw eventDjError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: 'Comprovante enviado!',
        description: `Comprovante de pagamento para ${dj.artist_name} foi enviado com sucesso.`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['payment_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['event_djs'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Reset form and close
      setSelectedFile(null);
      setAmount(cacheValue || 0);
      setNotes('');
      setUploadProgress(0);
      onClose();

    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Erro ao enviar comprovante',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!event || !dj) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Comprovante de Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event and DJ Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{event.event_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {(event.location || event.city) && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.location && event.city
                      ? `${event.location}, ${event.city}`
                      : event.location || event.city
                    }
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>DJ: {dj.artist_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  Valor do Cachê: R$ {cacheValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Pago *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0,00"
              className="text-lg"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Comprovante de Pagamento *</Label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Clique para enviar o comprovante</p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF, PDF (máx. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o pagamento..."
              rows={3}
            />
          </div>

          {/* Important Notice */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-yellow-800">Importante:</p>
                  <p className="text-sm text-yellow-700">
                    O comprovante deve estar no valor exato do cachê acordado e em nome do CNPJ da empresa contratante.
                    Este comprovante será visível para o DJ no dashboard dele.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando comprovante...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || amount <= 0 || isUploading}
          >
            {isUploading ? 'Enviando...' : 'Enviar Comprovante'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};