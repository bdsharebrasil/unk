import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Banknote,
  PieChart,
  Search,
  Eye,
  Download,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEvents, useFinancialStats, usePayments, usePaymentStats } from '@/hooks/useFinancial';
import { useDJs } from '@/hooks/useDJs';
import { useProducers } from '@/hooks/useProducers';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TransactionTable from './components/TransactionTable';
import { paymentService } from '@/services/supabaseService';

const FinancialTracking = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const queryClient = useQueryClient();

  // Fetch data using React Query hooks
  const { data: events = [], isLoading: loadingEvents } = useEvents();
  const { djs = [], loading: loadingDJs } = useDJs();
  const { producers = [], loading: loadingProducers } = useProducers();

  const eventsWithCache = useMemo(() => {
    return events.filter(event => event.cache && event.cache > 0);
  }, [events]);

  // compute stats from events (fallback)
  const statsFromEvents = useFinancialStats(eventsWithCache);

  const searchValue = searchTerm.trim().toLowerCase();

  // fetch payments and compute stats from payments (prefer payments when available)
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = usePayments();
  const statsFromPayments = usePaymentStats(payments);
  const stats = (payments && payments.length > 0) ? statsFromPayments : statsFromEvents;

  // Payment actions
  const handleProcessPayments = async (ids = []) => {
    try {
      for (const id of ids) {
        await paymentService.confirmPayment(id, { paid_at: new Date().toISOString(), payment_method: 'manual' });
      }
      toast.success('Pagamentos processados');
      // refresh payments and events
      try { refetchPayments?.(); } catch(e) {}
      queryClient.invalidateQueries(['events']);
    } catch (err) {
      console.error('Error processing payments:', err);
      toast.error('Erro ao processar pagamentos');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Confirma exclusão da transação?')) return;
    try {
      const res = await paymentService.delete(id);
      if (res?.error) throw new Error(res.error);
      toast.success('Transação excluída');
      try { refetchPayments?.(); } catch(e) {}
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      toast.error('Erro ao excluir transação');
    }
  };

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filteredEvents = eventsWithCache.filter((event) => {
    const eventMatches = (event.event_name || '').toLowerCase().includes(searchValue);
    const locationMatches = (event.location || '').toLowerCase().includes(searchValue);

    const matchesSearch = !searchValue || eventMatches || locationMatches;

    const normalizedStatus = String(event.payment_status ?? '').toLowerCase();
    const normalizedFilter = statusFilter.toLowerCase();
    const matchesStatus = normalizedFilter === 'all' || normalizedStatus === normalizedFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
      case 'paid': 
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pendente':
      case 'pending': 
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pagamento_enviado':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: 
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'pago':
      case 'paid': return 'Pago';
      case 'pendente':
      case 'pending': return 'Pendente';
      case 'pagamento_enviado': return 'Aguardando Aprovação';
      default: return status || '';
    }
  };

  const formatDateForDisplay = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }
    return '';
  };

  const handleMarkAsPaid = async (eventId) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ payment_status: 'pago' })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Pagamento confirmado com sucesso');
      queryClient.invalidateQueries(['events']);
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: PieChart },
    { id: 'transactions', label: 'Transações', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp }
  ];

  // map payments into transaction shape expected by TransactionTable
  const mappedTransactions = (payments || []).map((p) => {
    const ev = p.event || null;
    const eventName = ev?.event_name || ev?.name || p.event_name || '—';
    const eventType = ev?.event_type || ev?.type || p.event_type || '';
    const djName = (ev?.event_djs && ev.event_djs[0]?.dj?.full_name) || (ev?.event_djs && ev.event_djs[0]?.dj?.name) || p.dj?.full_name || '';
    const producerName = ev?.producer?.company_name || ev?.producer?.fantasy_name || ev?.producer?.profile?.full_name || '';
    const totalAmount = Number(p.amount ?? p.value ?? p.fee ?? ev?.fee ?? 0);
    // prefer pre-calculated unk_commission on payment, otherwise compute from event
    let unkCommission = 0;
    if (p != null && p.unk_commission != null) {
      unkCommission = Number(p.unk_commission) || 0;
    } else if (ev) {
      const rate = (() => { const v = ev?.commission_rate; if (v == null) return null; const parsed = Number(String(v).replace(',', '.')); return Number.isFinite(parsed) ? parsed : null; })();
      if (rate != null) {
        unkCommission = Math.round((totalAmount * (Math.max(rate, 0) / 100) + Number.EPSILON) * 100) / 100;
      } else if (ev?.commission_amount != null) {
        unkCommission = Number(ev.commission_amount) || 0;
      }
    }

    const distribution = {
      unkCommission,
      djNet: Number(p.dj_net ?? Math.max(0, totalAmount - unkCommission)),
    };

    return {
      id: p.id,
      date: p.created_at || p.date || null,
      eventName,
      eventType,
      djName,
      producerName,
      totalAmount,
      distribution,
      status: p.status || p.payment_status || 'pending',
      paymentProofUrl: p.payment_proof_url || p.proofUrl || null,
      raw: p,
    };
  });

  const filteredTransactions = mappedTransactions.filter((t) => {
    const q = searchValue;
    const matchesSearch = !q ||
      (t.eventName || '').toLowerCase().includes(q) ||
      (t.producerName || '').toLowerCase().includes(q) ||
      (t.djName || '').toLowerCase().includes(q);

    const normalizedFilter = String(statusFilter || '').toLowerCase();
    const status = String(t.status || '').toLowerCase();
    const matchesStatus = normalizedFilter === 'all' || normalizedFilter === '' || status === normalizedFilter;

    return matchesSearch && matchesStatus;
  });

  const loadingAny = loadingEvents || loadingDJs || loadingProducers || loadingPayments;

  if (loadingAny) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sistema financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Controle Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie receitas, comissões e pagamentos
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
              <DollarSign className="h-8 w-8 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Recebido
              </CardTitle>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                R$ {stats.paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.paidRevenue / stats.totalRevenue) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                A Receber
              </CardTitle>
              <Clock className="h-8 w-8 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                R$ {stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingCount} eventos pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card glow-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissão UNK Total
              </CardTitle>
              <Banknote className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalRevenue > 0 ? ((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1) : 0}% da receita total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div 
          className="glass-card p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 ${isActive ? 'glow-effect' : ''}`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Filters */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por evento, produtor ou DJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-md bg-card border border-input text-foreground"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="pagamento_enviado">Aguardando Aprovação</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TransactionTable
                    transactions={filteredTransactions}
                    onViewDetails={(t) => setSelectedTransaction(t)}
                    onProcessPayment={handleProcessPayments}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">Visão geral em desenvolvimento</p>
          </motion.div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">Relatórios em desenvolvimento</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FinancialTracking;
