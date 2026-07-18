'use client';

import React, { useState, useEffect } from 'react';

// Structure exacte renvoyée par notre API Prisma hier
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
  children: SubCategory[]; // Contient déjà les enfants grâce au include de Prisma !
}

interface CategorySelectorProps {
  onSelectSubCategory: (id: string) => void;
}

export default function CategorySelector({ onSelectSubCategory }: CategorySelectorProps) {
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories`);
        
        if (!res.ok) throw new Error('Impossible de charger les catégories');
        
        const json = await res.json();
        if (json.success) {
          // L'API renvoie déjà les parents avec leurs sous-catégories imbriquées
          // On filtre pour ne prendre que les vrais parents (parentId === null)
          const parents = json.data.filter((cat: any) => cat.parentId === null);
          setParentCategories(parents);
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Changement de catégorie principale : aucun appel réseau, on lit dans le JSON déjà chargé !
  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    
    // Trouver le parent sélectionné dans notre tableau en mémoire
    const parentFound = parentCategories.find((cat) => cat.id === parentId);
    
    if (parentFound && parentFound.children) {
      setSubCategories(parentFound.children);
    } else {
      setSubCategories([]);
    }
    
    // Reset de la sous-catégorie sélectionnée
    onSelectSubCategory('');
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Chargement du catalogue...</div>;
  if (error) return <div className="text-sm text-red-500">❌ Erreur de connexion au serveur ({error})</div>;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* 1. Sélecteur de la Catégorie Principale */}
      <div className="flex flex-col space-y-2 flex-1">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          Catégorie Principale
        </label>
        <select
          onChange={(e) => handleParentChange(e.target.value)}
          className="p-3 border border-gray-200 rounded-xl text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
          value={selectedParentId}
        >
          <option value="">-- Choisir une section --</option>
          {parentCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Sélecteur de la Sous-Catégorie (Instantané, sans appel API !) */}
      {selectedParentId && (
        <div className="flex flex-col space-y-2 flex-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Sous-Catégorie
          </label>
          <select
            onChange={(e) => onSelectSubCategory(e.target.value)}
            className="p-3 border border-orange-200 rounded-xl text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
            defaultValue=""
            required
          >
            <option value="" disabled>-- Précisez le type de bien --</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}