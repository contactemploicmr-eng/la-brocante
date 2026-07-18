'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 text-xs py-12 mt-auto border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        
        {/* Colonne 1 : À propos */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">
            La <span className="text-amber-500">Brocante</span>
          </h4>
          <ul className="space-y-2">
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Qui sommes-nous ?</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">L'esprit de notre marketplace</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Espace Presse</li>
          </ul>
        </div>

        {/* Colonne 2 : Guide utilisateur */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] tracking-wide">
            Acheter & Vendre
          </h4>
          <ul className="space-y-2">
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Comment publier un objet ?</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Conseils pour vendre en sécurité</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Guide des tailles et catégories</li>
          </ul>
        </div>

        {/* Colonne 3 : Support */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] tracking-wide">
            Centre d'aide
          </h4>
          <ul className="space-y-2">
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Aide & Contact</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Règles de diffusion</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Signaler un problème</li>
          </ul>
        </div>

        {/* Colonne 4 : Légal */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] tracking-wide">
            Informations légales
          </h4>
          <ul className="space-y-2">
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Conditions Générales d'Utilisation</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Politique de Confidentialité</li>
            <li className="hover:text-amber-500 cursor-pointer transition-colors">Gestion des Cookies</li>
          </ul>
        </div>

      </div>

      {/* Barre de copyright inférieure */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} La Brocante Inc. Tous droits réservés.
        </div>
        <div className="flex space-x-4 text-[11px]">
          <span className="hover:underline cursor-pointer">Cameroun</span>
          <span className="text-slate-700">|</span>
          <span className="hover:underline cursor-pointer">Afrique</span>
        </div>
      </div>
    </footer>
  );
}