'use client';

import React, { useState, useEffect, Suspense } from 'react'; // 🔥 Ajout de Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { Search, SlidersHorizontal, X, ChevronRight, RotateCcw, Sparkles, Layers } from 'lucide-react';

interface Country { id: string; code: string; name: string; currency: string; }
interface City { id: string; name: string; }
interface Category { id: string; name: string; slug: string; }

interface Ad {
  id: string; title: string; description: string; price: number; currency: string;
  city: { name: string }; createdAt: string; images: string[];
  category: { name: string; slug: string }; 
  fieldValues: { field: { name: string; label: string }; value: string }[];
}

// 🔥 1. On isole le contenu qui utilise useSearchParams() dans un sous-composant
function GlobalSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('CM'); 
  const [selectedCityId, setSelectedCityId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedListingType, setSelectedListingType] = useState<'ALL' | 'OFFER' | 'DEMAND'>('ALL');

  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isMobileSlicerOpen, setIsMobileSlicerOpen] = useState(false);

  useEffect(() => { setSearchQuery(searchParams.get('q') || ''); }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const [countriesRes, categoriesRes] = await Promise.all([
        fetch(`${apiUrl}/countries`),
        fetch(`${apiUrl}/categories`)
      ]);
      if (countriesRes.ok) {
        const json = await countriesRes.json();
        setCountries(json.success ? json.data : json);
      }
      if (categoriesRes.ok) {
        const json = await categoriesRes.json();
        const dataList = json.success ? json.data : (json.data || json);
        if (Array.isArray(dataList)) {
          setCategories(dataList.filter((c: any) => c.parentId === null || !c.parent));
        }
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadCities() {
      if (!selectedCountryCode) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/countries/${selectedCountryCode}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.success ? json.data : json;
        setCities(data?.cities || []);
      }
    }
    loadCities();
  }, [selectedCountryCode]);

  const fetchGlobalAds = async () => {
    setLoadingAds(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const query = new URLSearchParams({
        countryCode: selectedCountryCode, 
        ...(selectedCityId && { cityId: selectedCityId }), 
        ...(searchQuery && { q: searchQuery }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(selectedListingType !== 'ALL' && { listingType: selectedListingType })
      });
      const res = await fetch(`${apiUrl}/listings?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAds(json.success ? json.data : []);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des annonces globales :", err);
    } finally { setLoadingAds(false); }
  };

  useEffect(() => { 
    fetchGlobalAds(); 
  }, [selectedCountryCode, selectedCityId, selectedListingType, searchParams]);

  const handleApplySearch = () => {
    router.replace(`/categories?q=${encodeURIComponent(searchQuery)}`);
    fetchGlobalAds();
    setIsMobileSlicerOpen(false);
  };

  const handleResetFilters = () => {
    setMinPrice(''); 
    setMaxPrice(''); 
    setSelectedCityId(''); 
    setSearchQuery('');
    setSelectedListingType('ALL');
  };

  const SlicerContent = () => (
    <div className="flex flex-col h-full bg-white text-left">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <span className="font-black text-xs uppercase tracking-wider text-slate-900">Filtres</span>
        <button onClick={handleResetFilters} className="text-xs text-slate-400 hover:text-red-500 font-bold flex items-center gap-1.5 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-none">
        <div className="space-y-2.5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
            Nature du flux
          </label>
          <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setSelectedListingType('ALL')}
              className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${
                selectedListingType === 'ALL' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Tout voir
            </button>
            <button
              type="button"
              onClick={() => setSelectedListingType('OFFER')}
              className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedListingType === 'OFFER' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 shrink-0" /> Offres
            </button>
            <button
              type="button"
              onClick={() => setSelectedListingType('DEMAND')}
              className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1 ${
                selectedListingType === 'DEMAND' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3 h-3 shrink-0" /> Demandes
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Localisation</label>
          <select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 font-bold text-slate-900 mb-2 outline-none focus:bg-white focus:border-slate-300 transition-colors">
            {countries.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
          </select>
          <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-300 transition-colors">
            <option value="">Toutes les villes</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Budget limite</label>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">Rayons</label>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => router.push(`/categories/${cat.slug}`)} className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-600 flex justify-between items-center transition-colors">
                <span>{cat.name}</span> <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button onClick={handleApplySearch} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3.5 rounded-xl transition-all">
          Appliquer les filtres
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans flex flex-col w-full antialiased">
      <div className="flex flex-1 w-full relative">
        <aside className="hidden lg:block w-80 shrink-0 sticky top-[125px] h-[calc(100vh-125px)] z-30 border-r border-slate-100">
          <SlicerContent />
        </aside>

        {isMobileSlicerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsMobileSlicerOpen(false)} />
            <div className="relative w-80 h-full bg-white z-10 border-r border-slate-100">
              <SlicerContent />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 bg-slate-50/50 p-4 sm:p-6 md:p-8 space-y-6">
          <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
            <button onClick={() => setIsMobileSlicerOpen(true)} className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-4 py-3 rounded-xl transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <div className="flex-1 relative flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0 absolute left-3" />
              <input type="text" placeholder="Rechercher par mot-clé..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()} className="w-full bg-transparent text-xs sm:text-sm rounded-xl pl-8 pr-4 py-3 outline-none font-semibold text-slate-900" />
            </div>
            <button onClick={handleApplySearch} className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl transition-all">Rechercher</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadingAds ? Array(6).fill(0).map((_, i) => <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-80 animate-pulse" />) :
              ads.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-semibold text-xs uppercase tracking-wide">
                Aucun arrivage ou prestation disponible pour ce pays.
              </div>
            ) :
              ads.map((ad) => <ListingCard key={ad.id} ad={ad} />)
            }
          </div>
        </main>
      </div>
    </div>
  );
}

// 🔥 2. EXPORT PAR DÉFAUT : On enveloppe le tout dans une barrière Suspense pour le build
export default function GlobalSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider animate-pulse">
        Chargement de l'espace marché...
      </div>
    }>
      <GlobalSearchContent />
    </Suspense>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import ListingCard from '@/components/ListingCard';
// import { Search, SlidersHorizontal, X, ChevronRight, RotateCcw, Sparkles, Layers } from 'lucide-react';

// interface Country { id: string; code: string; name: string; currency: string; }
// interface City { id: string; name: string; }
// interface Category { id: string; name: string; slug: string; }

// interface Ad {
//   id: string; title: string; description: string; price: number; currency: string;
//   city: { name: string }; createdAt: string; images: string[];
//   category: { name: string; slug: string }; 
//   fieldValues: { field: { name: string; label: string }; value: string }[];
// }

// export default function GlobalSearchPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
  
//   const [countries, setCountries] = useState<Country[]>([]);
//   const [cities, setCities] = useState<City[]>([]);
//   const [selectedCountryCode, setSelectedCountryCode] = useState('CM'); 
//   const [selectedCityId, setSelectedCityId] = useState('');
//   const [categories, setCategories] = useState<Category[]>([]);
  
//   // 🔥 État pour filtrer la nature du dépôt (ALL, OFFER ou DEMAND)
//   const [selectedListingType, setSelectedListingType] = useState<'ALL' | 'OFFER' | 'DEMAND'>('ALL');

//   const [ads, setAds] = useState<Ad[]>([]);
//   const [loadingAds, setLoadingAds] = useState(false);
//   const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
//   const [minPrice, setMinPrice] = useState('');
//   const [maxPrice, setMaxPrice] = useState('');
//   const [isMobileSlicerOpen, setIsMobileSlicerOpen] = useState(false);

//   useEffect(() => { setSearchQuery(searchParams.get('q') || ''); }, [searchParams]);

//   useEffect(() => {
//     async function loadData() {
//       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//       const [countriesRes, categoriesRes] = await Promise.all([
//         fetch(`${apiUrl}/countries`),
//         fetch(`${apiUrl}/categories`)
//       ]);
//       if (countriesRes.ok) {
//         const json = await countriesRes.json();
//         setCountries(json.success ? json.data : json);
//       }
//       if (categoriesRes.ok) {
//         const json = await categoriesRes.json();
//         // Vérification de sécurité sur c.parent / c.parentId selon ta structure API
//         const dataList = json.success ? json.data : (json.data || json);
//         if (Array.isArray(dataList)) {
//           setCategories(dataList.filter((c: any) => c.parentId === null || !c.parent));
//         }
//       }
//     }
//     loadData();
//   }, []);

//   useEffect(() => {
//     async function loadCities() {
//       if (!selectedCountryCode) return;
//       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//       const res = await fetch(`${apiUrl}/countries/${selectedCountryCode}`);
//       if (res.ok) {
//         const json = await res.json();
//         const data = json.success ? json.data : json;
//         setCities(data?.cities || []);
//       }
//     }
//     loadCities();
//   }, [selectedCountryCode]);

//   const fetchGlobalAds = async () => {
//     setLoadingAds(true);
//     try {
//       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//       const query = new URLSearchParams({
//         countryCode: selectedCountryCode, 
//         ...(selectedCityId && { cityId: selectedCityId }), 
//         ...(searchQuery && { q: searchQuery }),
//         ...(minPrice && { minPrice }),
//         ...(maxPrice && { maxPrice }),
//         // 🔥 Transmission du filtre de flux à l'API NestJS
//         ...(selectedListingType !== 'ALL' && { listingType: selectedListingType })
//       });
//       const res = await fetch(`${apiUrl}/listings?${query.toString()}`);
//       if (res.ok) {
//         const json = await res.json();
//         setAds(json.success ? json.data : []);
//       }
//     } catch (err) {
//       console.error("Erreur lors de la récupération des annonces globales :", err);
//     } finally { setLoadingAds(false); }
//   };

//   // 🔥 On recharge le flux dès que les critères structurés ou la nature changent
//   useEffect(() => { 
//     fetchGlobalAds(); 
//   }, [selectedCountryCode, selectedCityId, selectedListingType, searchParams]);

//   const handleApplySearch = () => {
//     router.replace(`/categories?q=${encodeURIComponent(searchQuery)}`);
//     fetchGlobalAds();
//     setIsMobileSlicerOpen(false);
//   };

//   const handleResetFilters = () => {
//     setMinPrice(''); 
//     setMaxPrice(''); 
//     setSelectedCityId(''); 
//     setSearchQuery('');
//     setSelectedListingType('ALL');
//   };

//   const SlicerContent = () => (
//     <div className="flex flex-col h-full bg-white text-left">
//       <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
//         <span className="font-black text-xs uppercase tracking-wider text-slate-900">Filtres</span>
//         <button onClick={handleResetFilters} className="text-xs text-slate-400 hover:text-red-500 font-bold flex items-center gap-1.5 transition-colors">
//           <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
//         </button>
//       </div>

//       <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-none">
        
//         {/* 🔥 BLOC INTEGRÉ : NATURE DU FLUX (OFFRE / DEMANDE) */}
//         <div className="space-y-2.5">
//           <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
//             Nature du flux
//           </label>
//           <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
//             <button
//               type="button"
//               onClick={() => setSelectedListingType('ALL')}
//               className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${
//                 selectedListingType === 'ALL' 
//                   ? 'bg-white text-slate-900 shadow-xs' 
//                   : 'text-slate-400 hover:text-slate-700'
//               }`}
//             >
//               Tout voir
//             </button>
//             <button
//               type="button"
//               onClick={() => setSelectedListingType('OFFER')}
//               className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1 ${
//                 selectedListingType === 'OFFER' 
//                   ? 'bg-slate-900 text-white shadow-xs' 
//                   : 'text-slate-400 hover:text-slate-700'
//               }`}
//             >
//               <Sparkles className="w-3 h-3 shrink-0" /> Offres
//             </button>
//             <button
//               type="button"
//               onClick={() => setSelectedListingType('DEMAND')}
//               className={`text-center py-2.5 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1 ${
//                 selectedListingType === 'DEMAND' 
//                   ? 'bg-slate-900 text-white shadow-xs' 
//                   : 'text-slate-400 hover:text-slate-700'
//               }`}
//             >
//               <Layers className="w-3 h-3 shrink-0" /> Demandes
//             </button>
//           </div>
//         </div>

//         {/* Localisation */}
//         <div className="border-t border-slate-100 pt-5">
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Localisation</label>
//           <select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 font-bold text-slate-900 mb-2 outline-none focus:bg-white focus:border-slate-300 transition-colors">
//             {countries.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
//           </select>
//           <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-300 transition-colors">
//             <option value="">Toutes les villes</option>
//             {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
//           </select>
//         </div>

//         {/* Paramétrage Budgétaire */}
//         <div className="border-t border-slate-100 pt-5">
//           <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Budget limite</label>
//           <div className="flex items-center gap-2">
//             <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
//             <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
//           </div>
//         </div>

//         {/* Rayons du catalogue */}
//         <div className="border-t border-slate-100 pt-5">
//           <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">Rayons</label>
//           <div className="space-y-1">
//             {categories.map((cat) => (
//               <button key={cat.id} onClick={() => router.push(`/categories/${cat.slug}`)} className="w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-600 flex justify-between items-center transition-colors">
//                 <span>{cat.name}</span> <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="p-4 border-t border-slate-100 bg-slate-50">
//         <button onClick={handleApplySearch} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3.5 rounded-xl transition-all">
//           Appliquer les filtres
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="bg-white min-h-screen text-slate-900 font-sans flex flex-col w-full antialiased">
//       <div className="flex flex-1 w-full relative">
//         <aside className="hidden lg:block w-80 shrink-0 sticky top-[125px] h-[calc(100vh-125px)] z-30 border-r border-slate-100">
//           <SlicerContent />
//         </aside>

//         {isMobileSlicerOpen && (
//           <div className="fixed inset-0 z-50 lg:hidden flex">
//             <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsMobileSlicerOpen(false)} />
//             <div className="relative w-80 h-full bg-white z-10 border-r border-slate-100">
//               <SlicerContent />
//             </div>
//           </div>
//         )}

//         <main className="flex-1 min-w-0 bg-slate-50/50 p-4 sm:p-6 md:p-8 space-y-6">
//           <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
//             <button onClick={() => setIsMobileSlicerOpen(true)} className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-4 py-3 rounded-xl transition-colors">
//               <SlidersHorizontal className="w-4 h-4" />
//             </button>
//             <div className="flex-1 relative flex items-center pl-3">
//               <Search className="w-4 h-4 text-slate-400 shrink-0 absolute left-3" />
//               <input type="text" placeholder="Rechercher par mot-clé..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()} className="w-full bg-transparent text-xs sm:text-sm rounded-xl pl-8 pr-4 py-3 outline-none font-semibold text-slate-900" />
//             </div>
//             <button onClick={handleApplySearch} className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl transition-all">Rechercher</button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//             {loadingAds ? Array(6).fill(0).map((_, i) => <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-80 animate-pulse" />) :
//               ads.length === 0 ? (
//               <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-semibold text-xs uppercase tracking-wide">
//                 Aucun arrivage ou prestation disponible pour ce pays.
//               </div>
//             ) :
//               ads.map((ad) => <ListingCard key={ad.id} ad={ad} />)
//             }
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }