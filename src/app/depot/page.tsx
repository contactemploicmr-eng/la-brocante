'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import CategorySelector from '@/components/CategorySelector';
import FormFieldsRender from '@/components/FormFieldsRender';
import { Loader2, AlertCircle, MapPin, DollarSign, Text, Layers, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface City { id: string; name: string; }
interface Country { id: string; name: string; code: string; cities: City[]; }

export default function DeposerAnnoncePage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // 🔥 ÉTAPE COMPORTEMENTALE INITIALE
  const [isStepSelected, setIsStepSelected] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState<'OFFER' | 'DEMAND'>('OFFER');
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  
  // États de Géolocalisation
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) router.push('/?auth=open');
  }, [token, router]);

  useEffect(() => {
    async function loadGeoData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/countries`);
        if (res.ok) {
          const json = await res.json();
          setCountries(json.success ? json.data : json);
        }
      } catch (err) {
        console.error('Erreur chargement localisations réelles:', err);
      }
    }
    if (token) loadGeoData();
  }, [token]);

  const handleCountryChange = (id: string) => {
    setCountryId(id);
    setCityId('');
    const matched = countries.find(c => c.id === id);
    setCities(matched && Array.isArray(matched.cities) ? matched.cities : []);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setErrorMsg('');
    setGeoLoading(true);

    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permissionStatus.state === 'denied') {
          setErrorMsg("Veuillez autoriser l'accès à la position dans les paramètres de votre navigateur.");
          setGeoLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Impossible de vérifier les permissions", error);
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGeoLoading(false);
        setErrorMsg('');
      },
      (error) => {
        if (error.code === error.TIMEOUT) {
          console.log("Le délai a expiré. Erreur masquée.");
          setGeoLoading(false);
          return;
        }

        console.warn("Info géolocalisation :", { code: error.code, message: error.message });
        setGeoLoading(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg("Veuillez autoriser l'accès à la position dans vos paramètres.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      }
    );
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryId || !cityId || !categoryId || !title.trim() || !description.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires marqués d’une astérisque (*).');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          price: price ? parseFloat(price) : undefined,
          listingType,
          countryId,
          cityId,
          categoryId,
          attributes,
          images: [],
          locationName: locationName.trim() || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Le serveur a refusé la publication.');

      router.push('/?success=true');
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de publier l’annonce.');
    } finally {
      setLoading(false);
    }
  };

  const selectInitialType = (type: 'OFFER' | 'DEMAND') => {
    setListingType(type);
    setIsStepSelected(true);
  };

  if (!user) return null;

  return (
    <div className="bg-white min-h-screen pb-24 text-left font-sans antialiased w-full">
      {/* En-tête globale */}
      <div className="border-b border-slate-100 bg-slate-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Nouvel Arrivage / Service
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Diffusez instantanément vos offres et demandes sur la plateforme globale.
              </p>
            </div>
            {isStepSelected && (
              <button 
                onClick={() => setIsStepSelected(false)}
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Changer d'intention
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2 mb-8 max-w-4xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 🔥 ÉTAPE 0 : LE SÉLECTEUR INITIAL SÉPARÉ D'INTENTION */}
        {!isStepSelected ? (
          <div className="max-w-4xl mx-auto py-8 animate-fadeIn space-y-8">
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1 : Déposer une annonce (Offre) */}
              <button
                type="button"
                onClick={() => selectInitialType('OFFER')}
                className="group border-2 border-slate-200/80 hover:border-slate-950 bg-slate-50/20 hover:bg-white p-8 rounded-2xl transition-all text-left flex flex-col justify-between space-y-12 h-64 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-950 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <Sparkles className="w-5 h-5 text-slate-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight pt-2">Je souhaite publier une Offre</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Vous vendez un produit (voiture, terrain), proposez un service de proximité (coiffure, cours) ou publiez une opportunité.</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  Continuer le dépôt <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Option 2 : Faire une demande */}
              <button
                type="button"
                onClick={() => selectInitialType('DEMAND')}
                className="group border-2 border-slate-200/80 hover:border-slate-950 bg-slate-50/20 hover:bg-white p-8 rounded-2xl transition-all text-left flex flex-col justify-between space-y-12 h-64 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-950 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <Layers className="w-5 h-5 text-slate-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight pt-2">Je souhaite soumettre une Demande</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Vous recherchez un produit spécifique à acheter, un prestataire disponible ou vous exprimez un besoin particulier.</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  Rédiger mon besoin <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* 🔥 ÉTAPE 2 : FORMULAIRE PRINCIPAL DÉROULÉ */
          <form onSubmit={handleSubmitListing} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start w-full animate-fadeIn">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Classification du bien</h3>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Titre descriptif de l'annonce <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder={listingType === 'OFFER' ? "Ex : Toyota Camry 2018 très propre" : "Ex : Recherche un développeur ou une voiture d'occasion"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/30 outline-none focus:bg-white focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rayon du catalogue <span className="text-red-500">*</span></label>
                  <CategorySelector onSelectSubCategory={(id) => setCategoryId(id)} />
                </div>
              </div>

              {categoryId && (
                <div className="animate-fadeIn">
                  <FormFieldsRender 
                    subCategoryId={categoryId} 
                    onChangeAttributes={(attrs) => setAttributes(attrs)} 
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Text className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Détails complémentaires</h3>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description de l'offre / demande <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Détaillez les garanties, l'état d'usure, la localisation précise du quartier..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/30 outline-none focus:bg-white focus:border-slate-400 resize-none leading-relaxed transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/40 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nature du dépôt</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setListingType('OFFER')}
                      className={`text-center py-2 text-xs font-black uppercase tracking-wide rounded-lg transition-all ${listingType === 'OFFER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      Offre
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingType('DEMAND')}
                      className={`text-center py-2 text-xs font-black uppercase tracking-wide rounded-lg transition-all ${listingType === 'DEMAND' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      Demande
                    </button>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-200/60 pt-4">
                  <div className="flex items-center gap-1.5 text-slate-900 font-black uppercase text-[10px] tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Localisation du bien
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <select
                      required
                      value={countryId}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="p-3 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none"
                    >
                      <option value="">-- Sélectionner le Pays * --</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <select
                      required
                      disabled={!countryId || cities.length === 0}
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      className="p-3 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none disabled:opacity-40 transition-colors"
                    >
                      <option value="">-- Préciser la Ville * --</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5 pt-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Point de repère / Quartier</label>
                    <input
                      type="text"
                      placeholder="Ex: Carrefour Jalipe, À côté de..."
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="p-3 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="w-full border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 font-bold text-[11px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 bg-white"
                    >
                      {geoLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          <span>Récupération GPS...</span>
                        </>
                      ) : latitude && longitude ? (
                      <span className="text-emerald-600 font-black">✓ Position GPS enregistrée</span>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Utiliser ma position actuelle</span>
                      </>
                    )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-200/60 pt-4">
                  <div className="flex items-center gap-1.5 text-slate-900 font-black uppercase text-[10px] tracking-wider mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Montant financier
                  </div>
                  
                  <div className="relative flex items-center w-full">
                    <input
                      type="number"
                      placeholder="Ex: 75000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none font-black text-slate-900 pr-14 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !countryId || !cityId || !categoryId || !title.trim()}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publication en cours...</span>
                      </>
                    ) : (
                      <span>Mettre l'annonce en ligne</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}