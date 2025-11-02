/**
 * Gera o conteúdo do contrato preenchendo o template com dados do evento
 */
export const generateContractContent = (
  template: string,
  eventData: {
    eventName: string;
    eventDate: string;
    location: string;
    city: string;
    cacheValue: number;
    djName: string;
    producerName: string;
    commissionRate: number;
  }
): string => {
  let content = template;

  // Formatar data do evento sem horário (apenas data)
  let eventDateFormatted = '';
  if (eventData.eventDate) {
    if (typeof eventData.eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventData.eventDate)) {
      const [year, month, day] = eventData.eventDate.split('-');
      eventDateFormatted = `${day}/${month}/${year}`;
    } else {
      const date = new Date(eventData.eventDate);
      eventDateFormatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
  }
  
  // Formatar data de hoje sem horário
  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  
  // Substituir variáveis do template
  const variables: Record<string, string> = {
    '{{eventName}}': eventData.eventName || '',
    '{{eventDate}}': eventDateFormatted || '',
    '{{location}}': eventData.location || '',
    '{{city}}': eventData.city || '',
    '{{cacheValue}}': eventData.cacheValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
    '{{djName}}': eventData.djName || '',
    '{{producerName}}': eventData.producerName || '',
    '{{commissionRate}}': eventData.commissionRate?.toString() || '20',
    '{{today}}': todayFormatted,
  };

  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  return content;
};
