import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Calendar, Users, FileText, DollarSign, Settings, Music2, Headphones, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { storageService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface NavItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: Headphones, path: '/dj-management', label: 'DJs', roles: ['admin'] },
  { icon: Users, path: '/producer-management', label: 'Produtores', roles: ['admin'] },
  { icon: Calendar, path: '/event-calendar', label: 'Eventos', roles: ['admin', 'producer'] },
  { icon: Home, path: '/', label: 'Início', roles: ['admin'] },
  { icon: FileText, path: '/agenda-manager', label: 'Agenda', roles: ['admin', 'producer'] },
  { icon: DollarSign, path: '/financial-tracking', label: 'Financeiro', roles: ['admin', 'producer'] },
  { icon: Settings, path: '/company-settings', label: 'Configurações', roles: ['admin'] },
];

const producerNavItems: NavItem[] = [
  { icon: Headphones, path: '/my-djs', label: 'Meus DJs', roles: ['producer'] },
  { icon: Calendar, path: '/my-events', label: 'Eventos', roles: ['producer'] },
  { icon: Home, path: '/producer-dashboard', label: 'Início', roles: ['producer'] },
  { icon: FileText, path: '/my-contracts', label: 'Contratos', roles: ['producer'] },
  { icon: DollarSign, path: '/my-payments', label: 'Pagamentos', roles: ['producer'] },
];

export function TopBar() {
  const [location, setLocation] = useLocation();
  const { role, userProfile, logout, refreshProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const items = role === 'producer' ? producerNavItems : navItems;
  const filteredItems = items.filter((item) => item.roles.includes(role || ''));

  useEffect(() => {
    const loadCompanyLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('avatar_url')
          .limit(1)
          .single();

        if (!error && data?.avatar_url) {
          setCompanyLogo(data.avatar_url);
          return;
        }

        // fallback to localStorage if available
        const avatar = localStorage.getItem('company_avatar_url');
        if (avatar) setCompanyLogo(avatar);
      } catch (e) {
        const avatar = localStorage.getItem('company_avatar_url');
        if (avatar) setCompanyLogo(avatar);
      }
    };
    loadCompanyLogo();
  }, []);

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      toast.success('Logout realizado com sucesso!');
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  // Profile editor state and handlers
  const [profileForm, setProfileForm] = useState({ full_name: '', avatar_url: '', avatar_preview: '', _avatarFile: null });

  const openProfileEditor = async () => {
    setMenuOpen(false);
    try {
      // populate form from current userProfile if available
      if (userProfile) {
        setProfileForm({
          full_name: userProfile.fullName || userProfile.email || '',
          avatar_url: userProfile.avatarUrl || '',
          avatar_preview: '',
          _avatarFile: null,
        });
        setProfileModalOpen(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      setProfileForm({ full_name: data?.full_name || '', avatar_url: data?.avatar_url || '', avatar_preview: '', _avatarFile: null });
      setProfileModalOpen(true);
    } catch (e) {
      console.error('Erro ao abrir editor de perfil:', e);
      toast.error('Não foi possível abrir o editor de perfil');
    }
  };

  const handleProfileSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.error('Usuário não encontrado');

      let avatarUrl = profileForm.avatar_url;
      if (profileForm._avatarFile) {
        const file = profileForm._avatarFile as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
        const path = `avatars/${fileName}`;
        const { data, error } = await storageService.uploadFile('avatars', path, file);
        if (error) throw error;
        avatarUrl = data?.publicUrl;
      }

      const { error } = await supabase.from('profiles').update({ full_name: profileForm.full_name, avatar_url: avatarUrl }).eq('id', user.id);
      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      setProfileModalOpen(false);
      // refresh auth profile
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      toast.error('Erro ao atualizar perfil');
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 backdrop-blur-xl border-b border-white/10"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Music2 className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Portal UNK</h1>
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex items-center gap-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.path || (item.path !== '/' && location.startsWith(item.path));
              const isHome = item.path === '/' || item.path === '/producer-dashboard';

              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={cn(
                      'player-button group relative transition-all duration-300 hover:scale-110 hover:-translate-y-1',
                      isActive && 'active',
                      isHome && 'scale-110',
                    )}
                    style={isHome ? { width: '56px', height: '56px' } : {}}
                    title={item.label}
                  >
                    <Icon
                      className={cn(
                        'transition-all duration-300',
                        isHome ? 'w-6 h-6' : 'w-5 h-5',
                        isActive ? 'text-white' : 'text-foreground/70 group-hover:text-foreground',
                      )}
                    />

                    {/* Tooltip */}
                    <span className="absolute top-full mt-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Avatar / user menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-border bg-muted"
              title={userProfile?.fullName || userProfile?.email || 'Conta'}
            >
              {userProfile?.avatarUrl ? (
                // @ts-ignore
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-foreground">{(userProfile?.fullName?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()}</span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-md z-50">
                <div className="py-2">
                  <button onClick={openProfileEditor} className="w-full text-left px-4 py-2 text-sm hover:bg-muted">Perfil</button>
                  <button
                    onClick={async () => { setMenuOpen(false); await handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    Sair
                  </button>
                </div>

                <div className="border-t border-white/5 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                    {userProfile?.avatarUrl ? (
                      // @ts-ignore
                      <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm">{(userProfile?.fullName?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()}</div>
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-foreground">{userProfile?.fullName || userProfile?.email}</div>
                    <div className="text-xs text-muted-foreground">{userProfile?.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Editor Modal */}
          {profileModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setProfileModalOpen(false)} />
              <div className="relative bg-card border border-border rounded-lg p-6 w-full max-w-md z-60">
                <h3 className="text-lg font-bold mb-3">Editar Perfil</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center">
                      {(profileForm.avatar_preview || profileForm.avatar_url) ? (
                        <img src={profileForm.avatar_preview || profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm">{(profileForm.full_name?.[0] || 'U').toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e?.target?.files?.[0];
                          if (!file) return;
                          const previewUrl = URL.createObjectURL(file);
                          setProfileForm((p) => ({ ...p, _avatarFile: file, avatar_preview: previewUrl }));
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <label className="block text-sm">Nome</label>
                  <input value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />

                  <div className="flex justify-end gap-2 pt-3">
                    <button onClick={() => setProfileModalOpen(false)} className="px-4 py-2 rounded border border-border">Cancelar</button>
                    <button onClick={handleProfileSave} className="px-4 py-2 rounded bg-primary text-white">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
