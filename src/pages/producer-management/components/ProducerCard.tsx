import { Icon } from '@/components/Icon';
import type { Tables } from '@/integrations/supabase/types';

// We receive records from profiles and optionally merged producer fields through selects elsewhere
type Producer = Tables<'profiles'>;

interface ProducerCardProps {
  producer: Producer;
  onClick: () => void;
}

// Extra fields that may or may not exist depending on query joins
type ExtendedProducer = Producer & {
  fantasy_name?: string | null;
  company_name?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  commercial_phone?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  avatar_url?: string | null;
  events_count?: number | null; // only rendered if provided by backend
};

const ProducerCard = ({ producer, onClick }: ProducerCardProps) => {
  const p = producer as ExtendedProducer;
  const rating = Math.max(0, Math.min(5, Number(p.rating ?? 0)));

  const displayName = p.fantasy_name || p.full_name || 'Produtor';
  const displaySubtitle = p.company_name || undefined;
  const displayCity = p.city || (p as any).location?.split(',')[0]?.trim();
  const displayState = p.state || (p as any).location?.split(',')[1]?.trim();
  const contactPerson = p.contact_person || p.full_name || undefined;
  const contactPhone = p.contact_phone || p.phone || undefined;
  const avatar = (p as any).avatar_url || undefined;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-gradient-to-br from-purple-800/30 via-slate-900/20 to-blue-800/20 border border-white/10 backdrop-blur-md p-5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-2 ring-white/15 shadow-inner">
            {avatar ? (
              <img src={avatar as string} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Icon name="Building2" size={28} className="text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{displayName}</h3>
              {displaySubtitle && <p className="text-sm text-muted-foreground truncate">{displaySubtitle}</p>}
            </div>
            <div className="shrink-0 ml-2 flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="Star" size={16} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
            {contactPerson && (
              <div className="flex items-center gap-2 truncate"><Icon name="User" size={14} /><span className="truncate">{contactPerson}</span></div>
            )}
            {(displayCity || displayState) && (
              <div className="flex items-center gap-2 truncate">
                <Icon name="MapPin" size={14} />
                <span className="truncate">{displayCity}{displayCity && displayState ? ', ' : ''}{displayState}</span>
              </div>
            )}
            {contactPhone && (
              <div className="flex items-center gap-2 truncate"><Icon name="Phone" size={14} /><span>{contactPhone}</span></div>
            )}
          </div>

          {typeof p.events_count === 'number' && (
            <div className="mt-4">
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-center">
                <div className="text-xs text-muted-foreground">Eventos realizados</div>
                <div className="text-lg font-semibold text-foreground">{p.events_count}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerCard;
