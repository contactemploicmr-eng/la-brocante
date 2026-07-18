'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Calendar, Phone, ArrowLeft, Tag, ShieldCheck, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';
import SimilarAds from '@/components/SimilarAds';

const MiniMapDetail = dynamic(() => import('@/components/MiniMapDetail'), {
  ssr: false,
  loading: () => <div className="h-48 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">Chargement de la zone géographique...</div>
});

interface AdDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  createdAt: string;
  images: string[];
  category: { name: string; slug: string };
  city: { name: string };
  user: { name: string; phone: string };
  fieldValues: { field: { name: string; label: string }; value: string }[];
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export default function AnnonceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;

  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    async function loadAdDetail() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/listings/${adId}`);
        if (res.ok) {
          const json = await res.json();
          setAd(json.success ? json.data : json);
        }
      } catch (err) {
        console.error('Erreur chargement détails annonce:', err);
      } finally {
        setLoading(false);
      }
    }
    if (adId) loadAdDetail();
  }, [adId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-8">
        <div className="h-6 bg-slate-200 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[400px] bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-500 font-bold">Cette annonce n'existe plus ou a été retirée.</p>
        <button onClick={() => router.push('/categories')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
          Retourner aux recherches
        </button>
      </div>
    );
  }

  const categorySlug = ad.category?.slug || '';

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
              <div className="w-full h-[320px] sm:h-[450px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                {ad.images && ad.images.length > 0 ? (
                  <img src={ad.images[activeImageIdx]} alt={ad.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <Tag className="w-12 h-12" />
                    <span className="text-xs font-bold">Aucune image disponible</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                  {ad.category?.name}
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">{ad.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-300" /> {ad.city?.name}</span>
                  <span>•</span>
                  <span>Publiée le {new Date(ad.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Description</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">{ad.description}</p>
              </div>

              {ad.fieldValues && ad.fieldValues.length > 0 && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Critères & Spécifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ad.fieldValues.map((fv, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold">{fv.field.label}</span>
                        <span className="text-xs text-slate-900 font-black">{fv.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION GÉOGRAPHIQUE INJECTÉE EN BAS */}
              {(ad.locationName || (ad.latitude && ad.longitude)) && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Emplacement du bien</h2>
                  {ad.locationName && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-semibold bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Zone : <strong className="text-slate-950 font-black">{ad.locationName}</strong> ({ad.city?.name})</span>
                    </div>
                  )}
                  {ad.latitude && ad.longitude && (
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200/80 shadow-xs relative z-0">
                      <MiniMapDetail latitude={ad.latitude} longitude={ad.longitude} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-extrabold uppercase">Montant proposé</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {ad.price && ad.price > 0 ? new Intl.NumberFormat('fr-FR').format(ad.price) : 'À discuter'}
                  </span>
                  {ad.price > 0 && <span className="text-xs font-black text-slate-500 uppercase">{ad.currency}</span>}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-900 text-white font-extrabold rounded-full flex items-center justify-center text-sm shadow-sm shrink-0">
                  {ad.user?.name ? ad.user.name.substring(0, 2).toUpperCase() : 'CF'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-extrabold uppercase leading-none">Annonceur</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{ad.user?.name || 'Inconnu'}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {showPhone ? (
                  <a href={`tel:${ad.user?.phone}`} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-sm py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> {ad.user?.phone}
                  </a>
                ) : (
                  <button onClick={() => setShowPhone(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Voir le numéro
                  </button>
                )}
                <button className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 text-slate-400" /> Ajouter à mes favoris
                </button>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 text-left space-y-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-black text-amber-800 uppercase tracking-wide">Conseils de sécurité</span>
              </div>
              <ul className="text-[11px] text-slate-600 font-semibold space-y-2 list-disc pl-4">
                <li>Ne payez jamais d'avance (frais de dossier, caution, réservation) avant de visiter.</li>
                <li>Exigez de voir le produit et de rencontrer le vendeur dans un lieu public et sécurisé.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-12">
          <SimilarAds currentAdId={ad.id} countryCode="CM" subCategorySlug={categorySlug} />
        </div>
      </div>
    </div>
  );
}