'use client';

import React, { useState, useEffect } from 'react';
import ListingCard from './ListingCard';

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

interface SimilarAdsProps {
  currentAdId: string;
  countryCode: string;
  subCategorySlug: string;
}

export default function SimilarAds({ currentAdId, countryCode, subCategorySlug }: SimilarAdsProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimilar() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // On réutilise ton excellente route filtrée globale
        const query = new URLSearchParams({
          countryCode: countryCode,
          subCategorySlug: subCategorySlug,
        });

        const res = await fetch(`${apiUrl}/listings?${query.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // 🔥 On filtre pour exclure l'annonce sur laquelle on se trouve actuellement !
            const filtered = json.data.filter((item: Ad) => item.id !== currentAdId);
            // On se limite aux 3 meilleures opportunités pour la grille
            setAds(filtered.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Erreur annonces similaires:', err);
      } finally {
        setLoading(false);
      }
    }

    if (subCategorySlug && countryCode) {
      loadSimilar();
    }
  }, [currentAdId, countryCode, subCategorySlug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 w-48 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Si aucun produit similaire n'est trouvé, on n'affiche rien pour rester sobre
  if (ads.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Ces opportunités pourraient vous intéresser
        </h2>
        <p className="text-xs text-slate-400 font-bold mt-1">
          D'autres annonces publiées dans le même rayon au pays.
        </p>
      </div>

      {/* Grille de cartes réutilisant ton ListingCard pro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <ListingCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
}