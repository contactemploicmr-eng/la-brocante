'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Briefcase, Home, Car, Tag, Sparkles } from 'lucide-react';

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

interface ListingCardProps {
  ad: Ad;
}

export default function ListingCard({ ad }: ListingCardProps) {
  const router = useRouter();
  const categorySlug = (ad.category?.slug || '').toLowerCase();
  const titleLower = (ad.title || '').toLowerCase();

  // 1. Détection logique fine des grandes familles d'annonces
  const isEmploi = 
    categorySlug.includes('emploi') || 
    categorySlug.includes('stage') || 
    categorySlug.includes('recrutement') ||
    titleLower.includes('recrute') ||
    titleLower.includes('embauche');

  const isImmo = 
    categorySlug.includes('immo') || 
    categorySlug.includes('logement') || 
    categorySlug.includes('studio') || 
    categorySlug.includes('appartement') ||
    categorySlug.includes('terrain');

  const isVehicule = 
    categorySlug.includes('vehicule') || 
    categorySlug.includes('voiture') || 
    categorySlug.includes('moto');

  // =========================================================================
  // 💼 CAS 1 : DESIGN RECRUTEMENT / OFFRES D'EMPLOI & STAGES (Look corporate)
  // =========================================================================
  if (isEmploi) {
    return (
      <div 
        onClick={() => router.push(`/annonces/${ad.id}`)}
        className="bg-white border-y border-r border-l-4 border-l-blue-600 border-slate-200/80 hover:border-slate-300 hover:shadow-lg rounded-2xl overflow-hidden flex flex-col h-[400px] transition-all duration-300 cursor-pointer group text-left p-5 justify-between relative"
      >
        {/* En-tête de l'offre */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
              {ad.category?.name || 'Emploi'}
            </span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
              {ad.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium line-clamp-4 leading-relaxed">
              {ad.description}
            </p>
          </div>
        </div>

        {/* Moteur de critères dynamique discret */}
        {ad.fieldValues && ad.fieldValues.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2 border-t border-dashed border-slate-100">
            {ad.fieldValues.slice(0, 2).map((fv, index) => (
              <div key={index} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold truncate max-w-full">
                <span className="text-slate-400">{fv.field.label}:</span> {fv.value}
              </div>
            ))}
          </div>
        )}

        {/* Pied de carte avec salaire/indemnité */}
        <div className="space-y-3 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-300" />
              <span className="truncate max-w-[130px]">{ad.city?.name || 'Local'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>{new Date(ad.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-sm font-black text-slate-950 uppercase">
              {ad.price && ad.price > 0 
                ? `${new Intl.NumberFormat('fr-FR').format(ad.price)} ${ad.currency}` 
                : 'Indemnité à discuter'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🏠🚗 CAS 2 & 3 : DESIGNS IMMOBILIER, VÉHICULES ET AUTRES (Look produit riche)
  // =========================================================================
  let badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
  let borderAccent = "hover:border-slate-300";
  let fallbackIcon = <Tag className="w-5 h-5 text-slate-300" />;

  if (isImmo) {
    badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-100";
    borderAccent = "hover:border-emerald-400";
    fallbackIcon = <Home className="w-5 h-5 text-slate-300" />;
  } else if (isVehicule) {
    badgeStyles = "bg-amber-50 text-amber-800 border-amber-100";
    borderAccent = "hover:border-amber-400";
    fallbackIcon = <Car className="w-5 h-5 text-slate-300" />;
  }

  return (
    <div 
      onClick={() => router.push(`/annonces/${ad.id}`)}
      className={`bg-white border border-slate-200/80 ${borderAccent} hover:shadow-lg rounded-2xl overflow-hidden flex flex-col h-[400px] transition-all duration-300 cursor-pointer group text-left relative`}
    >
      {/* Zone Image / Aperçu */}
      <div className="w-full h-44 bg-slate-50 relative shrink-0 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {ad.images && ad.images.length > 0 ? (
          <img 
            src={ad.images[0]} 
            alt={ad.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            {fallbackIcon}
            <span className="text-[11px] font-bold">Aucun visuel</span>
          </div>
        )}

        {/* Badge dynamique du rayon */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider shadow-xs border ${badgeStyles}`}>
            {ad.category?.name || 'Général'}
          </span>
        </div>
      </div>

      {/* Corps informatif */}
      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-2 leading-tight">
            {ad.title}
          </h3>
          <p className="text-xs text-slate-400 font-semibold line-clamp-2 leading-relaxed">
            {ad.description}
          </p>
        </div>

        {/* MOTEUR D'AFFICHAGE DYNAMIQUE SPECIFIQUE */}
        {ad.fieldValues && ad.fieldValues.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {ad.fieldValues.slice(0, 3).map((fv, index) => (
              <div 
                key={index} 
                className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold tracking-wide truncate max-w-full"
                title={`${fv.field.label} : ${fv.value}`}
              >
                <span className="text-slate-400 font-medium">{fv.field.label}:</span> {fv.value}
              </div>
            ))}
          </div>
        )}

        {/* Pied de carte unifié et épuré */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-300" />
              <span className="truncate max-w-[130px]">{ad.city?.name || 'Local'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>{new Date(ad.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-0.5 pt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900">
              {ad.price && ad.price > 0 
                ? new Intl.NumberFormat('fr-FR').format(ad.price) 
                : 'À discuter'}
            </span>
            {ad.price && ad.price > 0 && (
              <span className="text-[10px] font-black text-slate-500 uppercase ml-0.5">
                {ad.currency}
                {isImmo && '/mois'}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
// 'use client';

// import React from 'react';
// import { useRouter } from 'next/navigation';
// import { MapPin, Calendar, Tag } from 'lucide-react';

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

// interface ListingCardProps {
//   ad: Ad;
// }

// export default function ListingCard({ ad }: ListingCardProps) {
//   const router = useRouter();
//   const categorySlug = (ad.category?.slug || '').toLowerCase();

//   // Définition adaptative du style du badge de catégorie
//   let badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
//   if (categorySlug.includes('emploi') || categorySlug.includes('stage')) {
//     badgeStyles = "bg-blue-50 text-blue-700 border-blue-100";
//   } else if (categorySlug.includes('immo') || categorySlug.includes('logement')) {
//     badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-100";
//   } else if (categorySlug.includes('vehicule') || categorySlug.includes('voiture')) {
//     badgeStyles = "bg-amber-50 text-amber-800 border-amber-100";
//   }

//   return (
//     <div 
//       onClick={() => router.push(`/annonces/${ad.id}`)}
//       className="bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-lg rounded-2xl overflow-hidden flex flex-col h-[400px] transition-all duration-300 cursor-pointer group text-left relative"
//     >
//       {/* Zone Image / Aperçu */}
//       <div className="w-full h-44 bg-slate-50 relative shrink-0 overflow-hidden flex items-center justify-center border-b border-slate-100">
//         {ad.images && ad.images.length > 0 ? (
//           <img 
//             src={ad.images[0]} 
//             alt={ad.title} 
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//           />
//         ) : (
//           <div className="flex flex-col items-center gap-2 text-slate-300">
//             <Tag className="w-5 h-5 text-slate-300" />
//             <span className="text-[11px] font-bold">Aucun visuel</span>
//           </div>
//         )}

//         {/* Badge dynamique du rayon basé sur l'arborescence réelle */}
//         <div className="absolute top-3 left-3 z-10">
//           <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider shadow-xs border ${badgeStyles}`}>
//             {ad.category?.name || 'Général'}
//           </span>
//         </div>
//       </div>

//       {/* Corps informatif */}
//       <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
//         <div className="space-y-2">
//           <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
//             {ad.title}
//           </h3>
//           <p className="text-xs text-slate-400 font-semibold line-clamp-2 leading-relaxed">
//             {ad.description}
//           </p>
//         </div>

//         {/* 🔥 LE MOTEUR D'AFFICHAGE DYNAMIQUE SPECIFIQUE */}
//         {ad.fieldValues && ad.fieldValues.length > 0 && (
//           <div className="flex flex-wrap gap-1.5 py-1">
//             {ad.fieldValues.slice(0, 3).map((fv, index) => (
//               <div 
//                 key={index} 
//                 className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold tracking-wide truncate max-w-full"
//                 title={`${fv.field.label} : ${fv.value}`}
//               >
//                 <span className="text-slate-400 font-medium">{fv.field.label}:</span> {fv.value}
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Pied de carte unifié et épuré */}
//         <div className="space-y-2.5 pt-3 border-t border-slate-100 shrink-0">
//           <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
//             <span className="flex items-center gap-1">
//               <MapPin className="w-3.5 h-3.5 text-slate-300" />
//               <span className="truncate max-w-[130px]">{ad.city?.name || 'Local'}</span>
//             </span>
//             <span className="flex items-center gap-1">
//               <Calendar className="w-3.5 h-3.5 text-slate-300" />
//               <span>{new Date(ad.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
//             </span>
//           </div>

//           <div className="flex items-baseline gap-0.5 pt-0.5">
//             <span className="text-base sm:text-lg font-black text-slate-900">
//               {ad.price && ad.price > 0 
//                 ? new Intl.NumberFormat('fr-FR').format(ad.price) 
//                 : 'À discuter'}
//             </span>
//             {ad.price && ad.price > 0 && (
//               <span className="text-[10px] font-black text-slate-500 uppercase ml-0.5">
//                 {ad.currency}
//                 {(categorySlug.includes('immo') || categorySlug.includes('logement')) && '/mois'}
//               </span>
//             )}
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }