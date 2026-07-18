'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { Search, SlidersHorizontal, X, ChevronRight, RotateCcw, Sparkles, Layers } from 'lucide-react';

interface Country {
  id: string;
  code: string;
  name: string;
  currency: string;
}

interface City {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryField {
  id: string;
  name: string;
  label: string;
  fieldType: 'SELECT' | 'NUMBER' | 'TEXT';
  options?: string[];
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

export default function CategorySearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const parentSlug = params.parentSlug as string;
  const subQuerySlug = searchParams.get('sub');
  const urlQueryText = searchParams.get('q') || '';

  // Données géographiques
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('CM'); 
  const [selectedCityId, setSelectedCityId] = useState('');

  // 🔥 NOUVEAU : État pour filtrer la nature du dépôt (ALL = les deux, OFFER ou DEMAND)
  const [selectedListingType, setSelectedListingType] = useState<'ALL' | 'OFFER' | 'DEMAND'>('ALL');

  // Données catégories & critères
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [activeSubCat, setActiveSubCat] = useState<SubCategory | null>(null);
  const [dynamicFields, setDynamicFields] = useState<CategoryField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  
  // États de recherche et d'annonces
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQueryText);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const [isMobileSlicerOpen, setIsMobileSlicerOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(urlQueryText);
  }, [urlQueryText]);

  // 1. Charger la liste des pays d'accueil disponibles
  useEffect(() => {
    async function loadCountries() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/countries`); 
        if (res.ok) {
          const json = await res.json();
          const list = json.success ? json.data : json;
          setCountries(list || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCountries();
  }, []);

  // 2. Charger les villes du pays sélectionné
  useEffect(() => {
    async function loadCities() {
      if (!selectedCountryCode) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/countries/${selectedCountryCode}`);
        if (res.ok) {
          const json = await res.json();
          const countryData = json.success ? json.data : json;
          setCities(countryData?.cities || []);
          setSelectedCityId(''); 
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCities();
  }, [selectedCountryCode]);

  // 3. Charger les sous-catégories associées au parent
  useEffect(() => {
    async function fetchSubCategories() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const parent = json.data.find((cat: any) => cat.slug === parentSlug);
            if (parent && parent.children) {
              setSubCategories(parent.children);
              if (subQuerySlug) {
                const preselected = parent.children.find((child: any) => child.slug === subQuerySlug);
                if (preselected) {
                  setActiveSubCat(preselected);
                  return;
                }
              }
              setActiveSubCat(null);
              fetchAds(null);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (parentSlug) fetchSubCategories();
  }, [parentSlug, subQuerySlug]);

  // 4. Charger les critères getFields de la sous-catégorie active
  useEffect(() => {
    async function loadFields() {
      if (!activeSubCat) {
        setDynamicFields([]);
        fetchAds(null); 
        return;
      }
      setLoadingFields(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories/${activeSubCat.id}/fields`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setDynamicFields(json.data);
            setSelectedFilters({}); 
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFields(false);
      }
    }
    loadFields();
  }, [activeSubCat]);

  // 5. Récupérer les annonces
  const fetchAds = async (subCatOverride?: SubCategory | null) => {
    const targetSubCat = subCatOverride !== undefined ? subCatOverride : activeSubCat;
    setLoadingAds(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const query = new URLSearchParams({
        countryCode: selectedCountryCode, 
        ...(selectedCityId && { cityId: selectedCityId }), 
        categorySlug: parentSlug,
        ...(targetSubCat && { subCategorySlug: targetSubCat.slug }),
        ...(searchQuery && { q: searchQuery }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        // 🔥 MODIFICATION : On injecte le paramètre listingType au backend si on cible OFFRE ou DEMANDE
        ...(selectedListingType !== 'ALL' && { listingType: selectedListingType }),
        ...(Object.keys(selectedFilters).length > 0 && { filters: JSON.stringify(selectedFilters) })
      });

      const res = await fetch(`${apiUrl}/listings?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAds(json.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAds(false);
    }
  };

  // 🔥 Déclencher la recherche dès que le type change (Offre/Demande/Les deux)
  useEffect(() => {
    fetchAds();
  }, [selectedListingType]);

  const handleToggleSubCategory = (sub: SubCategory | null) => {
    const queryParams = new URLSearchParams();
    
    if (searchQuery.trim()) {
      queryParams.set('q', searchQuery.trim());
    }

    if (!sub || activeSubCat?.id === sub.id) {
      setActiveSubCat(null);
      const searchStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
      router.replace(`/categories/${parentSlug}${searchStr}`);
    } else {
      setActiveSubCat(sub);
      queryParams.set('sub', sub.slug);
      router.replace(`/categories/${parentSlug}?${queryParams.toString()}`);
    }
  };

  const handleFilterChange = (fieldName: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleApplySearch = () => {
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());
    if (activeSubCat) queryParams.set('sub', activeSubCat.slug);

    const searchStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
    router.replace(`/categories/${parentSlug}${searchStr}`);

    fetchAds();
    setIsMobileSlicerOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedFilters({}); 
    setMinPrice(''); 
    setMaxPrice(''); 
    setSelectedCityId(''); 
    setSelectedListingType('ALL'); // Réinitialise sur "Tout voir"
    handleToggleSubCategory(null);
  };

  const SlicerContent = () => (
    <div className="flex flex-col h-full bg-white text-left">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <span className="font-black text-xs uppercase tracking-wider text-slate-900">
          Filtres de recherche
        </span>
        <button 
          onClick={handleResetFilters}
          className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
        
        {/* 🔥 NOUVEAU COMPOSANT : FILTRE NATURE DU DÉPÔT (OFFRE / DEMANDE) */}
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

        {/* Zone géographique */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Pays de recherche</label>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 focus:bg-white focus:border-slate-300 transition-colors"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.code}>{c.name} ({c.currency})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Secteur / Ville</label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 focus:bg-white focus:border-slate-300 transition-colors"
            >
              <option value="">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Divisions par rayons sous-jacents */}
        <div className="border-t border-slate-100 pt-6">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Sous-rubriques</label>
          <div className="space-y-1">
            <button
              onClick={() => handleToggleSubCategory(null)}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeSubCat === null ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span>Tout voir dans la catégorie</span>
            </button>

            {subCategories.map((sub) => {
              const isSelected = activeSubCat?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleToggleSubCategory(sub)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="truncate pr-4">{sub.name}</span>
                  {isSelected && <X className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paramétrage Budgétaire */}
        <div className="border-t border-slate-100 pt-6">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Budget limite</label>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
          </div>
        </div>

        {/* Critères spécifiques injectés de CategoryField */}
        {activeSubCat && dynamicFields.length > 0 && (
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-wider text-amber-600">Critères spécifiques</label>
            {loadingFields ? (
              <div className="h-8 bg-slate-50 rounded-xl animate-pulse w-full" />
            ) : (
              dynamicFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">{field.label}</label>
                  {field.fieldType === 'SELECT' && field.options && (
                    <select
                      value={selectedFilters[field.name] || ''}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                      className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold focus:bg-white focus:border-slate-300 transition-all"
                    >
                      <option value="">Tout voir</option>
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button onClick={handleApplySearch} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3.5 rounded-xl transition-all">
          Appliquer les filtres
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans antialiased flex flex-col w-full">
      <div className="flex flex-1 w-full relative">
        
        {/* Slicer fixe à gauche sans ombrage */}
        <aside className="hidden lg:block w-80 shrink-0 sticky top-[125px] h-[calc(100vh-125px)] z-30 border-r border-slate-100">
          <SlicerContent />
        </aside>

        {/* Modal du slicer mobile */}
        {isMobileSlicerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsMobileSlicerOpen(false)} />
            <div className="relative w-80 max-w-[85vw] h-full bg-white flex flex-col z-10 border-r border-slate-100">
              <SlicerContent />
            </div>
          </div>
        )}

        {/* Grille principale des résultats */}
        <main className="flex-1 min-w-0 bg-slate-50/50 p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Fil d'Ariane épuré */}
          <nav className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-3 rounded-xl border border-slate-100">
            <span className="hover:text-amber-500 cursor-pointer transition-colors" onClick={() => router.push('/')}>Accueil</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-600 capitalize">{parentSlug.replace('-', ' ')}</span>
            {activeSubCat && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-900 font-black bg-amber-500/10 border border-amber-500/10 text-amber-800 px-2.5 py-0.5 rounded-md">{activeSubCat.name}</span>
              </>
            )}
          </nav>

          {/* Zone de recherche intégrée plat */}
          <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
            <button 
              onClick={() => setIsMobileSlicerOpen(true)} 
              className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            </button>
            <div className="flex-1 relative flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0 absolute left-3" />
              <input 
                type="text" 
                placeholder="Rechercher par mot-clé..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                className="w-full bg-transparent text-xs sm:text-sm rounded-xl pl-8 pr-4 py-3 outline-none font-semibold text-slate-900" 
              />
            </div>
            <button onClick={handleApplySearch} className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl transition-all">
              Rechercher
            </button>
          </div>

          {/* Grille responsive des cartes produits */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadingAds ? (
              [1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-slate-100 rounded-2xl p-5 h-80 flex flex-col justify-between animate-pulse" />
              ))
            ) : ads.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-semibold text-xs uppercase tracking-wide">
                Aucun arrivage ou prestation disponible pour ce pays.
              </div>
            ) : (
              ads.map((ad) => (
                <ListingCard key={ad.id} ad={ad} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useParams, useRouter, useSearchParams } from 'next/navigation';
// import ListingCard from '@/components/ListingCard';
// import { Search, SlidersHorizontal, X, ChevronRight, RotateCcw } from 'lucide-react';

// interface Country {
//   id: string;
//   code: string;
//   name: string;
//   currency: string;
// }

// interface City {
//   id: string;
//   name: string;
// }

// interface SubCategory {
//   id: string;
//   name: string;
//   slug: string;
// }

// interface CategoryField {
//   id: string;
//   name: string;
//   label: string;
//   fieldType: 'SELECT' | 'NUMBER' | 'TEXT';
//   options?: string[];
// }

// interface Ad {
//   id: string;
//   title: string;
//   description: string;
//   price: number;
//   currency: string;
//   city: { name: string };
//   createdAt: string;
//   images: string[];
//   category: { name: string; slug: string }; 
//   fieldValues: { field: { name: string; label: string }; value: string }[];
// }

// export default function CategorySearchPage() {
//   const params = useParams();
//   const searchParams = useSearchParams();
//   const router = useRouter();
  
//   const parentSlug = params.parentSlug as string;
//   const subQuerySlug = searchParams.get('sub');
//   const urlQueryText = searchParams.get('q') || '';

//   // Données géographiques
//   const [countries, setCountries] = useState<Country[]>([]);
//   const [cities, setCities] = useState<City[]>([]);
//   const [selectedCountryCode, setSelectedCountryCode] = useState('CM'); 
//   const [selectedCityId, setSelectedCityId] = useState('');

//   // Données catégories & critères
//   const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
//   const [activeSubCat, setActiveSubCat] = useState<SubCategory | null>(null);
//   const [dynamicFields, setDynamicFields] = useState<CategoryField[]>([]);
//   const [loadingFields, setLoadingFields] = useState(false);
  
//   // États de recherche et d'annonces
//   const [ads, setAds] = useState<Ad[]>([]);
//   const [loadingAds, setLoadingAds] = useState(false);
//   const [searchQuery, setSearchQuery] = useState(urlQueryText);
//   const [minPrice, setMinPrice] = useState('');
//   const [maxPrice, setMaxPrice] = useState('');
//   const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

//   const [isMobileSlicerOpen, setIsMobileSlicerOpen] = useState(false);

//   useEffect(() => {
//     setSearchQuery(urlQueryText);
//   }, [urlQueryText]);

//   // 1. Charger la liste des pays d'accueil disponibles
//   useEffect(() => {
//     async function loadCountries() {
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//         const res = await fetch(`${apiUrl}/countries`); 
//         if (res.ok) {
//           const json = await res.json();
//           const list = json.success ? json.data : json;
//           setCountries(list || []);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     loadCountries();
//   }, []);

//   // 2. Charger les villes du pays sélectionné
//   useEffect(() => {
//     async function loadCities() {
//       if (!selectedCountryCode) return;
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//         const res = await fetch(`${apiUrl}/countries/${selectedCountryCode}`);
//         if (res.ok) {
//           const json = await res.json();
//           const countryData = json.success ? json.data : json;
//           setCities(countryData?.cities || []);
//           setSelectedCityId(''); 
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     loadCities();
//   }, [selectedCountryCode]);

//   // 3. Charger les sous-catégories associées au parent
//   useEffect(() => {
//     async function fetchSubCategories() {
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//         const res = await fetch(`${apiUrl}/categories`);
//         if (res.ok) {
//           const json = await res.json();
//           if (json.success) {
//             const parent = json.data.find((cat: any) => cat.slug === parentSlug);
//             if (parent && parent.children) {
//               setSubCategories(parent.children);
//               if (subQuerySlug) {
//                 const preselected = parent.children.find((child: any) => child.slug === subQuerySlug);
//                 if (preselected) {
//                   setActiveSubCat(preselected);
//                   return;
//                 }
//               }
//               setActiveSubCat(null);
//               fetchAds(null);
//             }
//           }
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     if (parentSlug) fetchSubCategories();
//   }, [parentSlug, subQuerySlug]);

//   // 4. Charger les critères getFields de la sous-catégorie active
//   useEffect(() => {
//     async function loadFields() {
//       if (!activeSubCat) {
//         setDynamicFields([]);
//         fetchAds(null); 
//         return;
//       }
//       setLoadingFields(true);
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
//         const res = await fetch(`${apiUrl}/categories/${activeSubCat.id}/fields`);
//         if (res.ok) {
//           const json = await res.json();
//           if (json.success) {
//             setDynamicFields(json.data);
//             setSelectedFilters({}); 
//           }
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoadingFields(false);
//       }
//     }
//     loadFields();
//   }, [activeSubCat]);

//   // 5. Récupérer les annonces
//   const fetchAds = async (subCatOverride?: SubCategory | null) => {
//     const targetSubCat = subCatOverride !== undefined ? subCatOverride : activeSubCat;
//     setLoadingAds(true);
//     try {
//       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
//       const query = new URLSearchParams({
//         countryCode: selectedCountryCode, 
//         ...(selectedCityId && { cityId: selectedCityId }), 
//         categorySlug: parentSlug,
//         ...(targetSubCat && { subCategorySlug: targetSubCat.slug }),
//         ...(searchQuery && { q: searchQuery }),
//         ...(minPrice && { minPrice }),
//         ...(maxPrice && { maxPrice }),
//         ...(Object.keys(selectedFilters).length > 0 && { filters: JSON.stringify(selectedFilters) })
//       });

//       const res = await fetch(`${apiUrl}/listings?${query.toString()}`);
//       if (res.ok) {
//         const json = await res.json();
//         if (json.success) {
//           setAds(json.data);
//         }
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoadingAds(false);
//     }
//   };

//   useEffect(() => {
//     fetchAds();
//   }, [urlQueryText]);

//   // Gérer la sélection ou la désélection de la sous-catégorie
//   const handleToggleSubCategory = (sub: SubCategory | null) => {
//     const queryParams = new URLSearchParams();
    
//     if (searchQuery.trim()) {
//       queryParams.set('q', searchQuery.trim());
//     }

//     if (!sub || activeSubCat?.id === sub.id) {
//       setActiveSubCat(null);
//       const searchStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
//       router.replace(`/categories/${parentSlug}${searchStr}`);
//     } else {
//       setActiveSubCat(sub);
//       queryParams.set('sub', sub.slug);
//       router.replace(`/categories/${parentSlug}?${queryParams.toString()}`);
//     }
//   };

//   const handleFilterChange = (fieldName: string, value: string) => {
//     setSelectedFilters(prev => ({ ...prev, [fieldName]: value }));
//   };

//   const handleApplySearch = () => {
//     const queryParams = new URLSearchParams();
//     if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());
//     if (activeSubCat) queryParams.set('sub', activeSubCat.slug);

//     const searchStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
//     router.replace(`/categories/${parentSlug}${searchStr}`);

//     fetchAds();
//     setIsMobileSlicerOpen(false);
//   };

//   const handleResetFilters = () => {
//     setSelectedFilters({}); 
//     setMinPrice(''); 
//     setMaxPrice(''); 
//     setSelectedCityId(''); 
//     handleToggleSubCategory(null);
//   };

//   const SlicerContent = () => (
//     <div className="flex flex-col h-full bg-white text-left">
//       <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
//         <span className="font-black text-xs uppercase tracking-wider text-slate-900">
//           Filtres de recherche
//         </span>
//         <button 
//           onClick={handleResetFilters}
//           className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors flex items-center gap-1.5"
//         >
//           <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
//         </button>
//       </div>

//       <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
        
//         {/* Zone géographique */}
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Pays de recherche</label>
//             <select
//               value={selectedCountryCode}
//               onChange={(e) => setSelectedCountryCode(e.target.value)}
//               className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 focus:bg-white focus:border-slate-300 transition-colors"
//             >
//               {countries.map((c) => (
//                 <option key={c.id} value={c.code}>{c.name} ({c.currency})</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Secteur / Ville</label>
//             <select
//               value={selectedCityId}
//               onChange={(e) => setSelectedCityId(e.target.value)}
//               className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 focus:bg-white focus:border-slate-300 transition-colors"
//             >
//               <option value="">Toutes les villes</option>
//               {cities.map((city) => (
//                 <option key={city.id} value={city.id}>{city.name}</option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Divisions par rayons sous-jacents */}
//         <div className="border-t border-slate-100 pt-6">
//           <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Sous-rubriques</label>
//           <div className="space-y-1">
//             <button
//               onClick={() => handleToggleSubCategory(null)}
//               className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
//                 activeSubCat === null ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
//               }`}
//             >
//               <span>Tout voir dans la catégorie</span>
//             </button>

//             {subCategories.map((sub) => {
//               const isSelected = activeSubCat?.id === sub.id;
//               return (
//                 <button
//                   key={sub.id}
//                   onClick={() => handleToggleSubCategory(sub)}
//                   className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
//                     isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
//                   }`}
//                 >
//                   <span className="truncate pr-4">{sub.name}</span>
//                   {isSelected && <X className="w-3.5 h-3.5 shrink-0 opacity-70" />}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Paramétrage Budgétaire */}
//         <div className="border-t border-slate-100 pt-6">
//           <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Budget limite</label>
//           <div className="flex items-center gap-2">
//             <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
//             <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold" />
//           </div>
//         </div>

//         {/* Critères spécifiques injectés de CategoryField */}
//         {activeSubCat && dynamicFields.length > 0 && (
//           <div className="border-t border-slate-100 pt-6 space-y-4">
//             <label className="block text-[10px] font-black uppercase tracking-wider text-amber-600">Critères spécifiques</label>
//             {loadingFields ? (
//               <div className="h-8 bg-slate-50 rounded-xl animate-pulse w-full" />
//             ) : (
//               dynamicFields.map((field) => (
//                 <div key={field.id} className="space-y-1.5">
//                   <label className="block text-xs font-bold text-slate-600">{field.label}</label>
//                   {field.fieldType === 'SELECT' && field.options && (
//                     <select
//                       value={selectedFilters[field.name] || ''}
//                       onChange={(e) => handleFilterChange(field.name, e.target.value)}
//                       className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold focus:bg-white focus:border-slate-300 transition-all"
//                     >
//                       <option value="">Tout voir</option>
//                       {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
//                     </select>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>

//       <div className="p-4 border-t border-slate-100 bg-slate-50">
//         <button onClick={handleApplySearch} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs py-3.5 rounded-xl transition-all">
//           Appliquer les filtres
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="bg-white min-h-screen text-slate-900 font-sans antialiased flex flex-col w-full">
//       <div className="flex flex-1 w-full relative">
        
//         {/* Slicer fixe à gauche sans ombrage */}
//         <aside className="hidden lg:block w-80 shrink-0 sticky top-[125px] h-[calc(100vh-125px)] z-30 border-r border-slate-100">
//           <SlicerContent />
//         </aside>

//         {/* Modal du slicer mobile */}
//         {isMobileSlicerOpen && (
//           <div className="fixed inset-0 z-50 lg:hidden flex">
//             <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsMobileSlicerOpen(false)} />
//             <div className="relative w-80 max-w-[85vw] h-full bg-white flex flex-col z-10 border-r border-slate-100">
//               <SlicerContent />
//             </div>
//           </div>
//         )}

//         {/* Grille principale des résultats */}
//         <main className="flex-1 min-w-0 bg-slate-50/50 p-4 sm:p-6 md:p-8 space-y-6">
          
//           {/* Fil d'Ariane épuré */}
//           <nav className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-3 rounded-xl border border-slate-100">
//             <span className="hover:text-amber-500 cursor-pointer transition-colors" onClick={() => router.push('/')}>Accueil</span>
//             <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
//             <span className="text-slate-600 capitalize">{parentSlug.replace('-', ' ')}</span>
//             {activeSubCat && (
//               <>
//                 <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
//                 <span className="text-slate-900 font-black bg-amber-500/10 border border-amber-500/10 text-amber-800 px-2.5 py-0.5 rounded-md">{activeSubCat.name}</span>
//               </>
//             )}
//           </nav>

//           {/* Zone de recherche intégrée plat */}
//           <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
//             <button 
//               onClick={() => setIsMobileSlicerOpen(true)} 
//               className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5"
//             >
//               <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
//             </button>
//             <div className="flex-1 relative flex items-center pl-3">
//               <Search className="w-4 h-4 text-slate-400 shrink-0 absolute left-3" />
//               <input 
//                 type="text" 
//                 placeholder="Rechercher par mot-clé..." 
//                 value={searchQuery} 
//                 onChange={(e) => setSearchQuery(e.target.value)} 
//                 onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
//                 className="w-full bg-transparent text-xs sm:text-sm rounded-xl pl-8 pr-4 py-3 outline-none font-semibold text-slate-900" 
//               />
//             </div>
//             <button onClick={handleApplySearch} className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl transition-all">
//               Rechercher
//             </button>
//           </div>

//           {/* Grille responsive des cartes produits */}
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//             {loadingAds ? (
//               [1, 2, 3, 4, 5, 6].map((n) => (
//                 <div key={n} className="bg-white border border-slate-100 rounded-2xl p-5 h-80 flex flex-col justify-between animate-pulse" />
//               ))
//             ) : ads.length === 0 ? (
//               <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-semibold text-xs uppercase tracking-wide">
//                 Aucun arrivage ou prestation disponible pour ce pays.
//               </div>
//             ) : (
//               ads.map((ad) => (
//                 <ListingCard key={ad.id} ad={ad} />
//               ))
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

