'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { 
  Home as HomeIcon, 
  Car, 
  Briefcase, 
  Shirt, 
  Wrench, 
  Smartphone, 
  Sprout,
  Search,
  Compass,
  ArrowRight
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: { name: string };
  createdAt: string;
  images: string[];
  category: { name: string; slug: string }; 
  fieldValues: { field: { name: string; label: string }; value: string }[];
}

// Mapping des icônes correspondant exactement à ton nouveau seed.ts
const categoryIcons: Record<string, React.ReactNode> = {
  'immobilier': <HomeIcon className="w-4 h-4" />,
  'vehicules': <Car className="w-4 h-4" />,
  'electronique': <Smartphone className="w-4 h-4" />,
  'mode-vetements': <Shirt className="w-4 h-4" />,
  'services-prestations': <Wrench className="w-4 h-4" />,
  'emploi-recrutement': <Briefcase className="w-4 h-4" />,
  'agro-alimentaire': <Sprout className="w-4 h-4" />,
};

export default function Home() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  // 1. Charger les catégories parentes racine
  useEffect(() => {
    async function loadHomeCategories() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const parents = json.data.filter((c: any) => c.parentId === null);
            setCategories(parents);
          }
        }
      } catch (err) {
        console.error('Erreur rubriques au démarrage:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadHomeCategories();
  }, []);

  // 2. Charger les dernières opportunités (Cameroun par défaut)
  useEffect(() => {
    async function loadRecentAds() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/listings?countryCode=CM`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setRecentAds(json.data.slice(0, 6));
          }
        }
      } catch (err) {
        console.error('Erreur annonces au démarrage:', err);
      } finally {
        setLoadingAds(false);
      }
    }
    loadRecentAds();
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) return;
    router.push(`/categories?q=${encodeURIComponent(heroSearch.trim())}`);
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans antialiased flex flex-col w-full pb-24">
      
      {/* 🌟 HERO SECTION MODERNE — COMPACTE & SOBRE */}
      <section className="w-full bg-slate-50/50 border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Trouvez des arrivages et prestations de confiance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bold max-w-xl leading-relaxed">
              La plateforme d'opportunités locales de proximité : de l'immobilier aux services d'artisans au quartier.
            </p>
          </div>

          {/* Barre de recherche flat et épurée */}
          <form 
            onSubmit={handleHeroSearchSubmit}
            className="bg-white p-2 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row gap-2 max-w-2xl w-full"
          >
            <div className="flex-1 relative flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher par mot-clé (ex: Toyota Camry, Studio, Coiffeuse...)"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full bg-transparent py-2 pl-2 pr-4 text-slate-900 placeholder-slate-400 font-semibold outline-none text-xs sm:text-sm"
              />
            </div>
            <button 
              type="submit"
              className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              Rechercher
            </button>
          </form>

          {/* Mots-clés suggérés */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-black uppercase tracking-wider">
            <span>Populaire :</span>
            <button type="button" className="hover:text-amber-500 transition-colors" onClick={() => router.push('/categories?q=Studio')}>Studios</button>
            <span className="opacity-30">•</span>
            <button type="button" className="hover:text-amber-500 transition-colors" onClick={() => router.push('/categories?q=Coiffure')}>Coiffure</button>
            <span className="opacity-30">•</span>
            <button type="button" className="hover:text-amber-500 transition-colors" onClick={() => router.push('/categories?q=Toyota')}>Voitures</button>
          </div>
        </div>
      </section>

      {/* ZONE DE CONTENU PRINCIPALE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 w-full space-y-20">

        {/* 📦 EXPLORATION DES CATÉGORIES SOUVERAINES */}
        <section className="space-y-8 text-left">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase">
              Explorer par rayons d'opportunités
            </h2>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => router.push(`/categories/${cat.slug}`)}
                  className="bg-white border border-slate-200/80 hover:border-slate-350 rounded-2xl p-4 flex flex-col justify-between h-28 cursor-pointer transition-all group text-left"
                >
                  <div className="w-8 h-8 bg-slate-50 text-slate-500 group-hover:text-slate-950 group-hover:bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-transparent transition-colors">
                    {categoryIcons[cat.slug] || <Compass className="w-4 h-4" />}
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
                    {cat.name}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🛍️ GRILLE DES DERNIÈRES OPPORTUNITÉS */}
        <section className="space-y-8 text-left">
          <div className="flex justify-between items-end border-b border-slate-100 pb-4">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase">
              Derniers arrivages & prestations
            </h2>
            <button 
              onClick={() => router.push('/categories')}
              className="text-[10px] font-black text-amber-600 hover:text-amber-700 transition-colors shrink-0 uppercase tracking-wider flex items-center gap-1"
            >
              Voir tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingAds ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl h-80 animate-pulse" />
              ))
            ) : recentAds.length === 0 ? (
              <div className="col-span-full bg-slate-50/50 border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wide">
                Aucun arrivage publié récemment dans cette zone.
              </div>
            ) : (
              recentAds.map((ad) => (
                <ListingCard key={ad.id} ad={ad} />
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}