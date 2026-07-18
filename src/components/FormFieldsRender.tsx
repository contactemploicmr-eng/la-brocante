'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface CategoryField {
  id: string;
  name: string;
  label: string;
  fieldType: 'SELECT' | 'NUMBER' | 'TEXT' | 'BOOLEAN' | string;
  required: boolean;
  options: any; // Stocké sous forme de tableau JSON ex: ["Toyota", "Kia"]
}

interface FormFieldsRenderProps {
  subCategoryId: string;
  onChangeAttributes: (attributes: Record<string, any>) => void;
}

export default function FormFieldsRender({ subCategoryId, onChangeAttributes }: FormFieldsRenderProps) {
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFields() {
      if (!subCategoryId) {
        setFields([]);
        return;
      }
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/categories/${subCategoryId}/fields`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setFields(json.data);
            // Réinitialiser les attributs pour la nouvelle catégorie
            const initialValues: Record<string, any> = {};
            json.data.forEach((f: CategoryField) => {
              initialValues[f.name] = f.fieldType === 'BOOLEAN' ? false : '';
            });
            setAttributes(initialValues);
            onChangeAttributes(initialValues);
          }
        }
      } catch (err) {
        console.error('Erreur champs dynamiques:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFields();
  }, [subCategoryId]);

  const handleValueChange = (name: string, value: any, type: string) => {
    let processedValue = value;
    if (type === 'NUMBER') processedValue = value === '' ? '' : parseFloat(value);
    if (type === 'BOOLEAN') processedValue = value;

    const updated = { ...attributes, [name]: processedValue };
    setAttributes(updated);
    onChangeAttributes(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement des critères du rayon...</span>
      </div>
    );
  }

  if (fields.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-xl space-y-4 text-left">
      <div className="border-b border-slate-200 pb-2">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Critères spécifiques de l'annonce</h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const allowedOptions = Array.isArray(field.options) ? field.options as string[] : [];

          return (
            <div key={field.id} className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {/* Rendu SELECT */}
              {field.fieldType === 'SELECT' && (
                <select
                  required={field.required}
                  value={attributes[field.name] || ''}
                  onChange={(e) => handleValueChange(field.name, e.target.value, field.fieldType)}
                  className="p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
                >
                  <option value="">-- Sélectionner --</option>
                  {allowedOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* Rendu NUMBER */}
              {field.fieldType === 'NUMBER' && (
                <input
                  type="number"
                  required={field.required}
                  placeholder="Ex: 12000"
                  value={attributes[field.name] ?? ''}
                  onChange={(e) => handleValueChange(field.name, e.target.value, field.fieldType)}
                  className="p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
                />
              )}

              {/* Rendu BOOLEAN (Case à cocher) */}
              {field.fieldType === 'BOOLEAN' && (
                <div className="flex items-center h-full pt-1">
                  <label className="relative flex items-center cursor-pointer gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={!!attributes[field.name]}
                      onChange={(e) => handleValueChange(field.name, e.target.checked, field.fieldType)}
                      className="w-4 h-4 rounded-sm border-slate-300 text-slate-900 accent-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-700">Oui, disponible</span>
                  </label>
                </div>
              )}

              {/* Rendu TEXT classique */}
              {field.fieldType === 'TEXT' && (
                <input
                  type="text"
                  required={field.required}
                  placeholder="Précisez ici..."
                  value={attributes[field.name] || ''}
                  onChange={(e) => handleValueChange(field.name, e.target.value, field.fieldType)}
                  className="p-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}