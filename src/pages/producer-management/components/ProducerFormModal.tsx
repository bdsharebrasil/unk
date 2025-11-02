import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProducerService } from '@/services/producerService';
import { Icon } from '@/components/Icon';
import { ImageCropper } from '@/components/ImageCropper';
import { toast } from 'sonner';

interface Producer {
  id: string;
  profile_id: string;
  company_name: string;
  fantasy_name: string;
  cnpj: string | null;
  address: string | null;
  city: string;
  state: string;
  cep: string | null;
  commercial_phone: string | null;
  contact_phone: string | null;
  contact_person: string;
  owner_name: string | null;
  rating: number | null;
  admin_notes: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  profile?: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
  } | null;
}

interface ProducerFormModalProps {
  producer: Producer | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
}

const ProducerFormModal = ({ producer, open, onClose, onSuccess, mode }: ProducerFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const deriveEmailUser = (email?: string | null) => {
    if (!email) return '';
    const lower = email.toLowerCase();
    if (lower.endsWith('@unk.com')) return lower.replace('@unk.com', '');
    return lower;
  };

  const [formData, setFormData] = useState({
    fantasy_name: producer?.fantasy_name || '',
    company_name: producer?.company_name || '',
    cnpj: producer?.cnpj || '',
    address: producer?.address || '',
    city: producer?.city || '',
    state: producer?.state || '',
    cep: producer?.cep || '',
    commercial_phone: producer?.commercial_phone || '',
    contact_phone: producer?.contact_phone || '',
    contact_person: producer?.contact_person || '',
    owner_name: producer?.owner_name || '',
    email: deriveEmailUser(producer?.profile?.email),
    password: '',
    rating: producer?.rating ?? 0,
    admin_notes: producer?.admin_notes || '',
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    const url = URL.createObjectURL(croppedBlob);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        if (!formData.password) {
          toast.error('Senha é obrigatória para criar produtor');
          setLoading(false);
          return;
        }

        const { producer: newProducer } = await ProducerService.create(
          {
            fantasy_name: formData.fantasy_name,
            company_name: formData.company_name,
            cnpj: formData.cnpj || undefined,
            address: formData.address || undefined,
            city: formData.city,
            state: formData.state,
            cep: formData.cep || undefined,
            commercial_phone: formData.commercial_phone || undefined,
            contact_phone: formData.contact_phone || undefined,
            contact_person: formData.contact_person,
            owner_name: formData.owner_name || undefined,
            rating: formData.rating,
            admin_notes: formData.admin_notes || undefined,
            email: `${formData.email}@unk.com`,
          },
          formData.password,
        );

        if (avatarFile && newProducer.profile_id) {
          await ProducerService.uploadAvatar(newProducer.profile_id, avatarFile);
        }

        toast.success(`Produtor criado! Email: ${formData.email}@unk.com`);
      } else if (producer) {
        await ProducerService.update(producer.id, {
          fantasy_name: formData.fantasy_name,
          company_name: formData.company_name,
          cnpj: formData.cnpj || undefined,
          address: formData.address || undefined,
          city: formData.city,
          state: formData.state,
          cep: formData.cep || undefined,
          commercial_phone: formData.commercial_phone || undefined,
          contact_phone: formData.contact_phone || undefined,
          contact_person: formData.contact_person,
          owner_name: formData.owner_name || undefined,
          rating: formData.rating,
          admin_notes: formData.admin_notes || undefined,
        });

        if (avatarFile && producer.profile_id) {
          await ProducerService.uploadAvatar(producer.profile_id, avatarFile);
        }

        if (formData.password && producer.profile_id) {
          await ProducerService.updatePassword(producer.profile_id, formData.password);
        }

        toast.success('Produtor atualizado!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving producer:', error);
      toast.error('Erro ao salvar produtor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === 'create' ? 'Criar Novo Produtor' : 'Editar Produtor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {avatarPreview || producer?.avatar_url ? (
                <img
                  src={avatarPreview || producer.avatar_url || ''}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="Building2" size={48} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                  <Icon name="Upload" size={16} />
                  Selecionar Foto
                </div>
              </Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fantasy_name">Nome Fantasia *</Label>
              <Input
                id="fantasy_name"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Razão Social *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Nome do Contato *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="owner_name">Nome do Dono</Label>
              <Input id="owner_name" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Telefone do Contato</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="commercial_phone">Telefone Comercial</Label>
              <Input
                id="commercial_phone"
                value={formData.commercial_phone}
                onChange={(e) => setFormData({ ...formData, commercial_phone: e.target.value })}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="state">UF *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email para Login * (sem @unk.com)</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="amuse"
                  required
                  disabled={mode === 'edit'}
                />
                <span className="flex items-center text-muted-foreground">@unk.com</span>
              </div>
            </div>
            <div>
              <Label htmlFor="password">{mode === 'create' ? 'Senha *' : 'Nova Senha (deixe em branco para não alterar)'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={mode === 'create'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label>Avaliação (Estrelas)</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })} className="transition-transform hover:scale-110">
                  <Icon name="Star" size={32} className={star <= formData.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="admin_notes">Notas Administrativas (privadas)</Label>
            <Textarea
              id="admin_notes"
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              rows={4}
              placeholder="Observações internas sobre o produtor..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'create' ? 'Criar Produtor' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop}
            open={cropperOpen}
            onClose={() => setCropperOpen(false)}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProducerFormModal;
