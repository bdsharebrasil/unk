import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  DollarSign, 
  Users, 
  X, 
  Plus,
  Search,
  User,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DJ {
  id: string;
  artist_name: string;
  avatar_url?: string;
  base_price?: number;
  genre?: string;
}

interface Producer {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface EventFormData {
  event_name: string;
  event_date: Date | null;
  event_time: string;
  location: string;
  city: string;
  description: string;
  budget: number;
  selectedDJs: DJ[];
  selectedProducer: Producer | null;
  djCacheValues: Record<string, number>;
  visible_to_dj: boolean;
  shared_with_admin: boolean;
}

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDJ?: DJ;
  preselectedProducer?: Producer;
}

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  preselectedDJ,
  preselectedProducer
}) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [djs, setDJs] = useState<DJ[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [djSearchTerm, setDJSearchTerm] = useState('');
  const [producerSearchTerm, setProducerSearchTerm] = useState('');
  const [showDJSearch, setShowDJSearch] = useState(false);
  const [showProducerSearch, setShowProducerSearch] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_date: null,
    event_time: '',
    location: '',
    city: '',
    description: '',
    budget: 0,
    selectedDJs: preselectedDJ ? [preselectedDJ] : [],
    selectedProducer: preselectedProducer || null,
    djCacheValues: preselectedDJ ? { [preselectedDJ.id]: preselectedDJ.base_price || 0 } : {},
    visible_to_dj: true,
    shared_with_admin: userProfile?.role === 'dj' ? false : true,
  });

  // Load DJs and Producers
  useEffect(() => {
    if (isOpen) {
      loadDJs();
      if (userProfile?.role === 'admin') {
        loadProducers();
      }
    }
  }, [isOpen, userProfile?.role]);

  const loadDJs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, artist_name, avatar_url, base_price, genre')
        .eq('role', 'dj')
        .eq('is_active', true)
        .order('artist_name');

      if (error) throw error;
      setDJs(data || []);
    } catch (error) {
      console.error('Error loading DJs:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao carregar lista de DJs', 
        variant: 'destructive' 
      });
    }
  };

  const loadProducers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'producer')
        .order('full_name');

      if (error) throw error;
      setProducers(data || []);
    } catch (error) {
      console.error('Error loading producers:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao carregar lista de produtores', 
        variant: 'destructive' 
      });
    }
  };

  const addDJ = (dj: DJ) => {
    if (!formData.selectedDJs.find(selectedDJ => selectedDJ.id === dj.id)) {
      setFormData(prev => ({
        ...prev,
        selectedDJs: [...prev.selectedDJs, dj],
        djCacheValues: {
          ...prev.djCacheValues,
          [dj.id]: dj.base_price || 0
        }
      }));
    }
    setShowDJSearch(false);
    setDJSearchTerm('');
  };

  const removeDJ = (djId: string) => {
    setFormData(prev => {
      const { [djId]: removed, ...remainingCacheValues } = prev.djCacheValues;
      return {
        ...prev,
        selectedDJs: prev.selectedDJs.filter(dj => dj.id !== djId),
        djCacheValues: remainingCacheValues
      };
    });
  };

  const updateDJCache = (djId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      djCacheValues: {
        ...prev.djCacheValues,
        [djId]: value
      }
    }));
  };

  const calculateTotalCache = () => {
    return Object.values(formData.djCacheValues).reduce((sum, value) => sum + (value || 0), 0);
  };

  const filteredDJs = djs.filter(dj =>
    dj.artist_name.toLowerCase().includes(djSearchTerm.toLowerCase()) &&
    !formData.selectedDJs.find(selectedDJ => selectedDJ.id === dj.id)
  );

  const filteredProducers = producers.filter(producer =>
    producer.full_name.toLowerCase().includes(producerSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.event_name.trim()) {
      toast({ title: 'Erro', description: 'Nome do evento é obrigatório', variant: 'destructive' });
      return;
    }

    if (!formData.event_date) {
      toast({ title: 'Erro', description: 'Data do evento é obrigatória', variant: 'destructive' });
      return;
    }

    if (formData.selectedDJs.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um DJ', variant: 'destructive' });
      return;
    }

    if (userProfile?.role === 'admin' && !formData.selectedProducer) {
      toast({ title: 'Erro', description: 'Selecione um produtor', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const eventDateTime = new Date(formData.event_date);
      if (formData.event_time) {
        const [hours, minutes] = formData.event_time.split(':');
        eventDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      const totalCache = calculateTotalCache();
      
      // Create the event
      const eventData = {
        event_name: formData.event_name.trim(),
        event_date: eventDateTime.toISOString(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        description: formData.description.trim(),
        budget: formData.budget || totalCache,
        cache_value: totalCache,
        producer_id: formData.selectedProducer?.id || 
                     (userProfile?.role === 'producer' ? userProfile.id : null),
        created_by: userProfile?.id,
        created_by_role: userProfile?.role,
        visible_to_dj: formData.visible_to_dj,
        shared_with_admin: formData.shared_with_admin,
        payment_status: 'pending'
      };

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

      // Create event-DJ relationships
      const eventDJData = formData.selectedDJs.map(dj => ({
        event_id: event.id,
        dj_id: dj.id,
        cache_value: formData.djCacheValues[dj.id] || 0,
        payment_status: 'pending'
      }));

      const { error: eventDJError } = await supabase
        .from('event_djs')
        .insert(eventDJData);

      if (eventDJError) throw eventDJError;

      // Create contracts automatically
      const contractData = formData.selectedDJs.map(dj => ({
        event_id: event.id,
        dj_id: dj.id,
        producer_id: formData.selectedProducer?.id || userProfile?.id,
        cache_value: formData.djCacheValues[dj.id] || 0,
        contract_content: `Contrato de prestação de serviços de DJ para o evento "${formData.event_name}" em ${format(eventDateTime, 'dd/MM/yyyy', { locale: ptBR })}`,
        signed: false
      }));

      const { error: contractError } = await supabase
        .from('contracts')
        .insert(contractData);

      if (contractError) throw contractError;

      toast({ 
        title: 'Sucesso!', 
        description: `Evento "${formData.event_name}" criado com sucesso. Contratos gerados automaticamente.` 
      });

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['event_djs'] });
      
      onClose();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao criar evento', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_date: null,
      event_time: '',
      location: '',
      city: '',
      description: '',
      budget: 0,
      selectedDJs: preselectedDJ ? [preselectedDJ] : [],
      selectedProducer: preselectedProducer || null,
      djCacheValues: preselectedDJ ? { [preselectedDJ.id]: preselectedDJ.base_price || 0 } : {},
      visible_to_dj: true,
      shared_with_admin: userProfile?.role === 'dj' ? false : true,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Criar Novo Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_name">Nome do Evento *</Label>
              <Input
                id="event_name"
                value={formData.event_name}
                onChange={(e) => setFormData(prev => ({ ...prev, event_name: e.target.value }))}
                placeholder="Digite o nome do evento"
              />
            </div>

            <div>
              <Label>Data do Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.event_date ? (
                      format(formData.event_date, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.event_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, event_date: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="event_time">Horário</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Nome do local"
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Cidade do evento"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes do evento, horários, observações..."
              rows={3}
            />
          </div>

          {/* Producer Selection (Admin only) */}
          {userProfile?.role === 'admin' && (
            <div>
              <Label>Produtor *</Label>
              <div className="relative">
                {!formData.selectedProducer ? (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProducerSearch(!showProducerSearch)}
                      className="w-full justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Selecionar Produtor
                    </Button>
                    
                    {showProducerSearch && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar produtor..."
                              value={producerSearchTerm}
                              onChange={(e) => setProducerSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            {filteredProducers.map((producer) => (
                              <div
                                key={producer.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, selectedProducer: producer }));
                                  setShowProducerSearch(false);
                                  setProducerSearchTerm('');
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={producer.avatar_url} />
                                  <AvatarFallback>
                                    {producer.full_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{producer.full_name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={formData.selectedProducer.avatar_url} />
                        <AvatarFallback>
                          {formData.selectedProducer.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{formData.selectedProducer.full_name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, selectedProducer: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DJ Selection */}
          <div>
            <Label>DJs do Evento *</Label>
            
            {/* Selected DJs */}
            <div className="space-y-3 mb-4">
              {formData.selectedDJs.map((dj) => (
                <Card key={dj.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={dj.avatar_url} />
                          <AvatarFallback>
                            {dj.artist_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{dj.artist_name}</p>
                          {dj.genre && <p className="text-sm text-muted-foreground">{dj.genre}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={formData.djCacheValues[dj.id] || 0}
                            onChange={(e) => updateDJCache(dj.id, parseFloat(e.target.value) || 0)}
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDJ(dj.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add DJ Button */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDJSearch(!showDJSearch)}
                className="w-full mb-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar DJ
              </Button>
              
              {showDJSearch && (
                <Card>
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar DJ..."
                        value={djSearchTerm}
                        onChange={(e) => setDJSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredDJs.map((dj) => (
                        <div
                          key={dj.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                          onClick={() => addDJ(dj)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={dj.avatar_url} />
                              <AvatarFallback>
                                {dj.artist_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium">{dj.artist_name}</span>
                              {dj.genre && <p className="text-xs text-muted-foreground">{dj.genre}</p>}
                            </div>
                          </div>
                          
                          {dj.base_price && (
                            <Badge variant="secondary">
                              R$ {dj.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      {filteredDJs.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          {djSearchTerm ? 'Nenhum DJ encontrado' : 'Nenhum DJ disponível'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Budget and Cache Summary */}
          {formData.selectedDJs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de Cachês:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {calculateTotalCache().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Visibility Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visible_to_dj"
                checked={formData.visible_to_dj}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, visible_to_dj: checked as boolean }))
                }
              />
              <Label htmlFor="visible_to_dj">Evento visível para os DJs selecionados</Label>
            </div>

            {userProfile?.role === 'dj' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared_with_admin"
                  checked={formData.shared_with_admin}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, shared_with_admin: checked as boolean }))
                  }
                />
                <Label htmlFor="shared_with_admin">Compartilhar com administrador</Label>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isLoading || formData.selectedDJs.length === 0}
          >
            {isLoading ? 'Criando...' : 'Criar Evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};