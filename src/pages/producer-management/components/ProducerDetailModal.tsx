import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/Icon';
import type { Tables } from '@/integrations/supabase/types';

type Producer = Tables<'profiles'>;
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface ProducerDetailModalProps {
  producer: Producer | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

type ExtendedProducer = Producer & {
  fantasy_name?: string | null;
  company_name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  commercial_phone?: string | null;
  contact_phone?: string | null;
  contact_person?: string | null;
  owner_name?: string | null;
  rating?: number | null;
  admin_notes?: string | null;
};

const ProducerDetailModal = ({ producer, open, onClose, onEdit }: ProducerDetailModalProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!producer) return null;

  const p = producer as ExtendedProducer;
  const displayName = p.fantasy_name || p.full_name || 'Produtor';
  const rating = (p.rating ?? 3) as number;
  const city = p.city || (p as any).location?.split(',')[0]?.trim();
  const state = p.state || (p as any).location?.split(',')[1]?.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Detalhes do Produtor</DialogTitle>
            {isAdmin && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Icon name="Edit" size={16} className="mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {(p as any).avatar_url ? (
                <img src={(p as any).avatar_url as string} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <Icon name="Building2" size={48} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{displayName}</h3>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="Star" size={18} className={`${i < rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                ))}
              </div>
            </div>
          </div>

          {(p.company_name || p.fantasy_name || p.cnpj) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="Building" size={20} />
                Empresa
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {p.company_name && (
                  <div>
                    <span className="text-muted-foreground">Razão Social:</span>
                    <p className="font-medium">{p.company_name}</p>
                  </div>
                )}
                {(p.fantasy_name || p.full_name) && (
                  <div>
                    <span className="text-muted-foreground">Nome Fantasia:</span>
                    <p className="font-medium">{p.fantasy_name || p.full_name}</p>
                  </div>
                )}
                {p.cnpj && (
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <p className="font-medium">{p.cnpj}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(p.contact_person || p.owner_name || p.contact_phone || p.commercial_phone) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="User" size={20} />
                Contato
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(p.contact_person || p.full_name) && (
                  <div>
                    <span className="text-muted-foreground">Nome do Contato:</span>
                    <p className="font-medium">{p.contact_person || p.full_name}</p>
                  </div>
                )}
                {p.owner_name && (
                  <div>
                    <span className="text-muted-foreground">Nome do Dono:</span>
                    <p className="font-medium">{p.owner_name}</p>
                  </div>
                )}
                {(p.contact_phone || p.phone) && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{p.contact_phone || p.phone}</p>
                  </div>
                )}
                {p.commercial_phone && (
                  <div>
                    <span className="text-muted-foreground">Telefone Comercial:</span>
                    <p className="font-medium">{p.commercial_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(p.address || city || state || p.cep) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="MapPin" size={20} />
                Endereço
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {p.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">{p.address}</p>
                  </div>
                )}
                {(city || state) && (
                  <>
                    {city && (
                      <div>
                        <span className="text-muted-foreground">Cidade:</span>
                        <p className="font-medium">{city}</p>
                      </div>
                    )}
                    {state && (
                      <div>
                        <span className="text-muted-foreground">UF:</span>
                        <p className="font-medium">{state}</p>
                      </div>
                    )}
                  </>
                )}
                {p.cep && (
                  <div>
                    <span className="text-muted-foreground">CEP:</span>
                    <p className="font-medium">{p.cep}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && p.admin_notes && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="FileText" size={20} />
                Notas Administrativas
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.admin_notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProducerDetailModal;
