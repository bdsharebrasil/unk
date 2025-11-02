import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Sidebar } from "@/components/layout/sidebar";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, Instagram, Music, Plus, Search, Youtube, Eye, Edit, MapPin } from "lucide-react";
import { updateSuzyPradoProfile } from '@/utils/updateDJProfile';

interface DJ {
  id: string;
  artist_name: string;
  real_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  genre?: string | null;
  base_price?: number | null;
  status?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  soundcloud_url?: string | null;
  is_active?: boolean | null;
  location?: string | null;
}

type DJFormValues = Omit<Pick<
  DJ,
  | "artist_name"
  | "real_name"
  | "email"
  | "phone"
  | "bio"
  | "genre"
  | "base_price"
  | "instagram_url"
  | "youtube_url"
  | "tiktok_url"
  | "soundcloud_url"
  | "status"
  | "is_active"
>, never>;

const getInitials = (name?: string | null) => {
  if (!name) return "DJ";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch (error) {
    console.error("Failed to format currency:", error);
    return null;
  }
};

const DJsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDJ, setSelectedDJ] = useState<DJ | null>(null);

  // Update Suzy Prado profile on mount
  useEffect(() => {
    updateSuzyPradoProfile().then(result => {
      if (result.success) {
        console.log('Perfil da Suzy Prado atualizado!');
      }
    });
  }, []);

  const {
    data: djs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DJ[], Error>({
    queryKey: ["djs"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "dj")
        .order("artist_name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data ?? [];
    },
  });

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedDJ(null);
    }
  };

  const createDJMutation = useMutation({
    mutationFn: async (payload: DJFormValues) => {
      // Convert status to match database enum if present
      const dbPayload: any = { ...payload };
      if (dbPayload.status && typeof dbPayload.status === 'string') {
        const statusMap: Record<string, string> = {
          'ativo': 'ativo',
          'inativo': 'inativo',
          'ocupado': 'ocupado',
          'active': 'ativo',
          'inactive': 'inativo',
          'busy': 'ocupado'
        };
        const normalizedStatus = dbPayload.status.toLowerCase();
        dbPayload.status = statusMap[normalizedStatus] || 'ativo';
      }
      
      const dataWithRole = { ...dbPayload, role: 'dj' };
      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert([dataWithRole])
        .select()
        .single<DJ>();

      if (insertError) {
        throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["djs"] });
      handleDialogChange(false);
      toast({ title: "DJ cadastrado com sucesso!" });
    },
    onError: (mutationError: unknown) => {
      const description = mutationError instanceof Error ? mutationError.message : "Não foi possível concluir o cadastro.";
      toast({
        title: "Erro ao cadastrar DJ",
        description,
        variant: "destructive",
      });
    },
  });

  const updateDJMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & DJFormValues) => {
      // Convert status to match database enum if present
      const dbPayload: any = { ...payload };
      if (dbPayload.status && typeof dbPayload.status === 'string') {
        const statusMap: Record<string, string> = {
          'ativo': 'ativo',
          'inativo': 'inativo',
          'ocupado': 'ocupado',
          'active': 'ativo',
          'inactive': 'inativo',
          'busy': 'ocupado'
        };
        const normalizedStatus = dbPayload.status.toLowerCase();
        dbPayload.status = statusMap[normalizedStatus] || 'ativo';
      }
      
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(dbPayload)
        .eq("id", id)
        .eq("role", "dj")
        .select()
        .single<DJ>();

      if (updateError) {
        throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["djs"] });
      handleDialogChange(false);
      toast({ title: "DJ atualizado com sucesso!" });
    },
    onError: (mutationError: unknown) => {
      const description = mutationError instanceof Error ? mutationError.message : "Tente novamente mais tarde.";
      toast({
        title: "Erro ao atualizar DJ",
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parseBasePrice = () => {
      const basePrice = formData.get("base_price");
      if (!basePrice) {
        return null;
      }

      const numeric = Number(basePrice);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const payload: DJFormValues = {
      artist_name: (formData.get("artist_name")?.toString() ?? "").trim(),
      real_name: formData.get("real_name")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      phone: formData.get("phone")?.toString().trim() || null,
      bio: formData.get("bio")?.toString().trim() || null,
      genre: formData.get("genre")?.toString().trim() || null,
      base_price: parseBasePrice(),
      instagram_url: formData.get("instagram_url")?.toString().trim() || null,
      youtube_url: formData.get(
        "youtube_url",
      )?.toString().trim() || null,
      tiktok_url: formData.get("tiktok_url")?.toString().trim() || null,
      soundcloud_url: formData.get("soundcloud_url")?.toString().trim() || null,
      status: selectedDJ?.status ?? "Ativo",
      is_active: selectedDJ?.is_active ?? true,
    };

    if (selectedDJ) {
      updateDJMutation.mutate({ id: selectedDJ.id, ...payload });
    } else {
      createDJMutation.mutate({ ...payload, status: "Ativo", is_active: true });
    }
  };

  const filteredDJs = useMemo(() => {
    if (!searchTerm) {
      return djs;
    }

    const normalizedTerm = searchTerm.toLowerCase();

    return djs.filter((dj) => {
      const candidates = [dj.artist_name, dj.real_name, dj.genre, dj.email, dj.status];
      return candidates.some((value) => value?.toLowerCase?.().includes(normalizedTerm));
    });
  }, [djs, searchTerm]);

  const getGenreTags = (genre: string | null | undefined) => {
    if (!genre) return [];
    return genre.split(',').map(g => g.trim()).filter(Boolean).slice(0, 2);
  };

  const isSaving = createDJMutation.isPending || updateDJMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <Loading message="Carregando DJs..." className="min-h-[60vh]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
          <p className="text-lg font-semibold text-destructive">Não foi possível carregar os DJs.</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">

      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar DJs</h1>
            <p className="mt-1 text-muted-foreground">Cadastre e gerencie os DJs da assessoria</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setSelectedDJ(null)}
                className="bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-glow hover:opacity-95 border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo DJ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedDJ ? "Editar DJ" : "Cadastrar Novo DJ"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="artist_name">Nome Artístico *</Label>
                    <Input
                      id="artist_name"
                      name="artist_name"
                      defaultValue={selectedDJ?.artist_name ?? ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="real_name">Nome Real</Label>
                    <Input id="real_name" name="real_name" defaultValue={selectedDJ?.real_name ?? ""} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={selectedDJ?.email ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" defaultValue={selectedDJ?.phone ?? ""} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Gênero Musical</Label>
                    <Input id="genre" name="genre" defaultValue={selectedDJ?.genre ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Cachê Base (R$)</Label>
                    <Input
                      id="base_price"
                      name="base_price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedDJ?.base_price?.toString() ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea id="bio" name="bio" rows={3} defaultValue={selectedDJ?.bio ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input id="instagram_url" name="instagram_url" defaultValue={selectedDJ?.instagram_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input id="youtube_url" name="youtube_url" defaultValue={selectedDJ?.youtube_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input id="tiktok_url" name="tiktok_url" defaultValue={selectedDJ?.tiktok_url ?? ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soundcloud_url">SoundCloud URL</Label>
                  <Input id="soundcloud_url" name="soundcloud_url" defaultValue={selectedDJ?.soundcloud_url ?? ""} />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={isSaving} disabled={isSaving}>
                    {selectedDJ ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, gênero..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDJs.map((dj) => {
            const statusLabel = dj.status ?? (dj.is_active ? "Ativo" : "Inativo");
            const genreTags = getGenreTags(dj.genre);

            return (
              <Card 
                key={dj.id} 
                className="group relative overflow-hidden bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar with glow effect */}
                    <Link href={`/dj-profile/${dj.id}`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <Avatar className="relative w-24 h-24 cursor-pointer hover:scale-105 transition-transform border-4 border-primary/30">
                          <AvatarImage src={dj.avatar_url ?? undefined} alt={dj.artist_name} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                            {getInitials(dj.artist_name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </Link>

                    {/* Name section */}
                    <div className="space-y-1 w-full">
                      <Link href={`/dj-profile/${dj.id}`}>
                        <h3 className="font-bold text-lg cursor-pointer hover:text-primary transition-colors">
                          {dj.artist_name}
                        </h3>
                      </Link>
                      {dj.real_name && (
                        <p className="text-sm text-muted-foreground">{dj.real_name}</p>
                      )}
                    </div>

                    {/* Location */}
                    {dj.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{dj.location}</span>
                      </div>
                    )}

                    {/* Genre tags */}
                    {genreTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {genreTags.map((tag, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs bg-primary/20 hover:bg-primary/30 border-primary/30"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Social icons */}
                    {dj.instagram_url && (
                      <a
                        href={dj.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 transition-all"
                      >
                        <Instagram className="w-5 h-5 text-pink-500" />
                      </a>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 w-full pt-2">
                      <Link href={`/dj-profile/${dj.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDJ(dj);
                          handleDialogChange(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDJs.length === 0 && (
          <div className="py-12 text-center">
            <Music className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum DJ encontrado" : "Nenhum DJ cadastrado ainda"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DJsPage;
