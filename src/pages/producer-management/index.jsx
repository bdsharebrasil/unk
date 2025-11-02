import { useState } from 'react';
import { Link } from 'wouter';
import { useProducers } from '@/hooks/useProducers';
import { ProducerService } from '@/services/producerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/Icon';
import { toast } from 'sonner';
import ProducerCard from './components/ProducerCard';
import ProducerDetailModal from './components/ProducerDetailModal';
import ProducerFormModal from './components/ProducerFormModal';
import { useAuth } from '@/hooks/use-auth';

const ProducersPage = () => {
  const { producers, loading, refetch } = useProducers();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [editingProducer, setEditingProducer] = useState(null);
  const [creatingProducer, setCreatingProducer] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filteredProducers = (producers || []).filter((producer) => {
    const searchLower = (search || '').toLowerCase();

    // Defensive: some fields may be null/undefined in DB; coerce to empty string
    const fantasy = (producer?.fantasy_name || '').toString().toLowerCase();
    const company = (producer?.company_name || '').toString().toLowerCase();
    const contact = (producer?.contact_person || '').toString().toLowerCase();
    const city = (producer?.city || '').toString().toLowerCase();

    return (
      fantasy.includes(searchLower) ||
      company.includes(searchLower) ||
      contact.includes(searchLower) ||
      city.includes(searchLower)
    );
  });

  const handleDelete = async (producer) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem deletar produtores');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o produtor ${producer.fantasy_name}?`)) {
      return;
    }

    setDeletingId(producer.id);
    try {
      const success = await ProducerService.delete(producer.id);
      if (success) {
        refetch();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateNewPassword = async (producer) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerar novas senhas');
      return;
    }

    const newPassword = await ProducerService.generateRandomPassword();
    const confirmed = confirm(
      `Nova senha para ${producer.fantasy_name}:\n\n${newPassword}\n\nDeseja aplicar esta senha?`
    );

    if (confirmed) {
      const success = await ProducerService.updatePassword(producer.profile_id, newPassword);
      if (success) {
        toast.success('Senha atualizada! Anote a nova senha.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtores</h1>
            <p className="text-muted-foreground mt-1">Gerencie os produtores e suas informações</p>
          </div>

          {isAdmin && (
            <Button onClick={() => setCreatingProducer(true)} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Icon name="Plus" size={20} className="mr-2" />
              Novo Produtor
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, empresa, cidade..."
              className="pl-10 bg-white/5 backdrop-blur-md border-white/10"
            />
          </div>
        </div>

        {/* Producer Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Carregando produtores...</div>
          </div>
        ) : filteredProducers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="Building2" size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum produtor encontrado</h3>
            <p className="text-muted-foreground">{search ? 'Tente ajustar sua busca' : 'Adicione um novo produtor para começar'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducers.map((producer) => (
              <Link href={`/producer/${producer.id}`} key={producer.id}>
                <ProducerCard producer={producer} onClick={() => setSelectedProducer(producer)} />
              </Link>
            ))}
          </div>
        )}

        {/* Modals */}
        <ProducerDetailModal
          producer={selectedProducer}
          open={!!selectedProducer}
          onClose={() => setSelectedProducer(null)}
          onEdit={() => {
            setEditingProducer(selectedProducer);
            setSelectedProducer(null);
          }}
        />

        <ProducerFormModal
          producer={editingProducer}
          open={!!editingProducer}
          onClose={() => setEditingProducer(null)}
          onSuccess={() => {
            refetch();
            setEditingProducer(null);
          }}
          mode="edit"
        />

        <ProducerFormModal
          producer={null}
          open={creatingProducer}
          onClose={() => setCreatingProducer(false)}
          onSuccess={() => {
            refetch();
            setCreatingProducer(false);
          }}
          mode="create"
        />
      </div>
    </div>
  );
};

export default ProducersPage;
