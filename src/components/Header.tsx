'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import AuthModal from './AuthModal';
import { LogIn, LogOut, User as UserIcon, PlusCircle, Compass } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface ParentCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: SubCategory[];
}

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // On récupère le slug de la catégorie parente depuis l'URL actuelle (ex: /categories/informatique)
  const currentParentSlug = params.parentSlug as string;

  // Connexion à ton contexte d'authentification
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [categories, setCategories] = useState<ParentCategory[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<ParentCategory | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Garder la valeur de recherche locale
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Synchroniser l'input si la recherche est mise à jour depuis l'URL externe
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Récupérer les initiales de l'utilisateur connecté de manière sécurisée
  const getInitials = () => {
    if (!user || !user.name) return 'CF';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Défilement horizontal des boutons rayons
  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 250;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Désactivation dynamique des flèches selon la position du scroll
  const checkScrollLimits = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const btnLeft = document.getElementById('btn-scroll-left') as HTMLButtonElement;
    const btnRight = document.getElementById('btn-scroll-right') as HTMLButtonElement;

    if (btnLeft) {
      btnLeft.disabled = container.scrollLeft <= 0;
    }
    if (btnRight) {
      const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
      btnRight.disabled = isAtEnd;
    }
  };

  useEffect(() => {
    checkScrollLimits();
    window.addEventListener('resize', checkScrollLimits);
    return () => window.removeEventListener('resize', checkScrollLimits);
  }, [categories, loading]);

  // Chargement initial des catégories depuis l'API
  useEffect(() => {
    async function loadMenuCategories() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const parents = json.data.filter((cat: any) => cat.parentId === null);
            setCategories(parents);
          }
        }
      } catch (err) {
        console.error('Erreur rubriques:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenuCategories();
  }, []);

  // Fermeture du menu profil au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Soumission du formulaire de recherche globale ou filtrée
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const queryStr = searchQuery.trim() ? `q=${encodeURIComponent(searchQuery.trim())}` : '';

    if (currentParentSlug) {
      const sub = searchParams.get('sub');
      const paramsList = [];
      if (sub) paramsList.push(`sub=${sub}`);
      if (queryStr) paramsList.push(queryStr);
      
      const searchStr = paramsList.length > 0 ? `?${paramsList.join('&')}` : '';
      router.push(`/categories/${currentParentSlug}${searchStr}`);
    } else {
      router.push(`/categories${queryStr ? '?' + queryStr : ''}`);
    }
  };

  // Redirection avec préservation des mots-clés de recherche existants
  const handleCategoryNav = (parentSlug: string, childSlug?: string) => {
    setHoveredCategory(null);
    const queryParams = new URLSearchParams();
    
    if (searchQuery.trim()) {
      queryParams.set('q', searchQuery.trim());
    }
    if (childSlug) {
      queryParams.set('sub', childSlug);
    }

    const searchStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
    router.push(`/categories/${parentSlug}${searchStr}`);
  };

  return (
    <header 
      className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 text-slate-800 font-sans"
      onMouseLeave={() => setHoveredCategory(null)}
    >
      {/* 1. Barre principale supérieure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Nom de la marque */}
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => router.push('/')}>
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
            La <span className="text-amber-500">Brocante</span>
          </span>
        </div>

        {/* Barre de recherche centrale connectée */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Que recherchez-vous ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-4 pr-10 py-2.5 sm:py-3 border border-slate-200 focus:outline-none focus:bg-white focus:border-amber-500 transition-all text-slate-900 font-semibold"
          />
          <button type="submit" className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 bg-slate-950 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
            </svg>
          </button>
        </form>

        {/* Actions & Profil complet */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          
          {/* Bouton Dépôt sécurisé */}
          <button 
            onClick={() => user ? router.push('/depot') : setIsAuthModalOpen(true)}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-sm shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">Déposer une annonce</span>
          </button>

          {/* Accès rapides PC uniquement */}
          <button className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 items-center justify-center text-slate-600 hover:text-amber-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </button>

          <button className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 items-center justify-center text-slate-600 hover:text-amber-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />

          {/* Zone adaptative d'authentification */}
          {user ? (
            <div 
              className="relative pl-2 sm:pl-4 flex items-center" 
              ref={menuRef}
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none group py-2"
              >
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                  <div className="w-full h-full bg-slate-900 text-white font-bold rounded-full border border-slate-800 flex items-center justify-center text-xs sm:text-sm group-hover:border-amber-500 transition-all">
                    {getInitials()}
                  </div>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                </div>

                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors truncate max-w-[100px]">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">{user.phone}</span>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 transition-all">
                  <div className="px-4 py-2 border-b border-slate-50 md:hidden">
                    <p className="text-xs text-slate-400">Profil connecté</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-600 font-medium">
                    <li>
                      <button 
                        onClick={() => { router.push('/mes-annonces'); setIsProfileOpen(false); }}
                        type="button" 
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center space-x-2 text-slate-700"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Mes Annonces</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => { router.push('/dashboard'); setIsProfileOpen(false); }}
                        type="button" 
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700"
                      >
                        Tableau de bord
                      </button>
                    </li>
                    <li className="border-t border-slate-50 mt-1 pt-1">
                      <button 
                        onClick={() => { logout(); setIsProfileOpen(false); }}
                        type="button" 
                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </button>
          )}

        </div>
      </div>

      {/* 2. Barre des rayons horizontaux avec flèches de défilement Premium */}
      <div className="border-t border-slate-100 bg-white w-full relative group/nav flex items-center">
        
        {/* Flèche Gauche */}
        <div className="absolute left-4 z-20 pointer-events-none group-hover/nav:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="pointer-events-auto bg-white text-slate-800 hover:bg-slate-950 hover:text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
            id="btn-scroll-left"
            title="Précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Conteneur des Catégories */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScrollLimits}
          className="max-w-7xl mx-auto px-16 overflow-x-auto scrollbar-none flex items-center space-x-6 h-12 whitespace-nowrap snap-x scroll-smooth w-full"
        >
          {loading ? (
            <span className="text-slate-300 animate-pulse text-xs font-bold uppercase">Ouverture...</span>
          ) : (
            <>
              {/* 🔥 CORRECTION DE LA LOGIQUE JAUNE : Basée sur l'URL (!currentParentSlug) et le survol */}
              <span
                onMouseEnter={() => setHoveredCategory(null)}
                onClick={() => router.push('/categories')}
                className={`py-3.5 transition-all cursor-pointer border-b-2 tracking-wide uppercase text-[11px] font-black shrink-0 snap-origin-start ${
                  (hoveredCategory === null && !currentParentSlug) || (hoveredCategory === null && hoveredCategory === null)
                    ? (!currentParentSlug && !hoveredCategory) || (hoveredCategory === null && !hoveredCategory && !currentParentSlug)
                      ? 'border-amber-500 text-slate-900' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
                // Condition simplifiée ci-dessous pour plus de propreté dans le rendu réel
                style={{
                  borderBottomColor: (!hoveredCategory && !currentParentSlug) || (hoveredCategory === null && hoveredCategory === null && !currentParentSlug) ? '#f59e0b' : 'transparent',
                  color: (!hoveredCategory && !currentParentSlug) ? '#0f172a' : ''
                }}
              >
                Tout voir
              </span>

              {/* TES CATÉGORIES VENUES DE LA BD */}
              {categories.map((parent) => {
                // La catégorie est active soit si elle est survolée, soit si elle correspond à la page actuelle (quand rien d'autre n'est survolé)
                const isCurrentRoute = currentParentSlug === parent.slug;
                const isYellow = hoveredCategory ? hoveredCategory.id === parent.id : isCurrentRoute;

                return (
                  <span
                    key={parent.id}
                    onMouseEnter={() => setHoveredCategory(parent)}
                    onClick={() => handleCategoryNav(parent.slug)}
                    className={`py-3.5 transition-all cursor-pointer border-b-2 tracking-wide uppercase text-[11px] font-bold shrink-0 snap-origin-start ${
                      isYellow ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {parent.name}
                  </span>
                );
              })}
            </>
          )}
        </div>

        {/* Flèche Droite */}
        <div className="absolute right-4 z-20 pointer-events-none group-hover/nav:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="pointer-events-auto bg-white text-slate-800 hover:bg-slate-950 hover:text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
            id="btn-scroll-right"
            title="Suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

      </div>

      {/* 3. Méga-Menu interactif */}
      {hoveredCategory && (
        <div 
          className="absolute left-0 right-0 top-[125px] w-full bg-white shadow-xl border-b border-slate-100 z-40 max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[240px]">
            
            <div className="w-full md:w-72 bg-slate-50/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col justify-between items-center md:items-start gap-4">
              <div className="space-y-2 text-left">
                <div className="inline-flex items-center justify-center p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-wider">{hoveredCategory.name}</h3>
              </div>
              <span 
                onClick={() => handleCategoryNav(hoveredCategory.slug)}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer transition-colors whitespace-nowrap"
              >
                Tout explorer &rarr;
              </span>
            </div>

            <div className="flex-1 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 text-left">
              {hoveredCategory.children && hoveredCategory.children.length > 0 ? (
                hoveredCategory.children.map((child) => (
                  <div 
                    key={child.id} 
                    onClick={() => handleCategoryNav(hoveredCategory.slug, child.slug)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-amber-500 transition-colors block">
                      {child.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Prérégler les filtres
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic col-span-full">Aucun sous-rayon disponible.</div>
              )}
            </div>

          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </header>
  );
}