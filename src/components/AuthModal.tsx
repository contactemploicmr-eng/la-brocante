'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, Lock, User as UserIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CountryConfig {
  code: string;
  name: string;
  prefix: string;
  flag: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
  validateRegex: RegExp;
}

const countries: Record<string, CountryConfig> = {
  CM: {
    code: 'CM',
    name: 'Cameroun',
    prefix: '+237',
    flag: '🇨🇲',
    minLength: 9,
    maxLength: 9,
    placeholder: '690000000',
    validateRegex: /^[6]/,
  },
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    prefix: '+225',
    flag: '🇨🇮',
    minLength: 10,
    maxLength: 10,
    placeholder: '0700000000',
    validateRegex: /^[0]/,
  },
  SN: {
    code: 'SN',
    name: 'Sénégal',
    prefix: '+221',
    flag: '🇸🇳',
    minLength: 9,
    maxLength: 9,
    placeholder: '770000000',
    validateRegex: /^[7]/,
  },
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();
  
  // Basculer entre le mode 'LOGIN' (Connexion) et 'REGISTER' (Inscription)
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Champs de saisie communs et spécifiques
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('CM');

  // États de validation et UI
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentCountry = countries[countryCode];

  // Validation dynamique du numéro de téléphone
  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 0) {
      setIsPhoneValid(false);
      return;
    }
    const hasCorrectLength = digits.length >= currentCountry.minLength && digits.length <= currentCountry.maxLength;
    const matchesPattern = currentCountry.validateRegex.test(digits);
    setIsPhoneValid(hasCorrectLength && matchesPattern);
  }, [phone, countryCode, currentCountry]);

  if (!isOpen) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '');
    if (cleanValue.length <= currentCountry.maxLength) {
      setPhone(cleanValue);
    }
  };

  // Soumission unique gérant l'appel selon le mode sélectionné
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setErrorMsg(`Le numéro saisi n'est pas valide pour le ${currentCountry.name}.`);
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const internationalPhone = `${currentCountry.prefix}${phone}`;
    const endpoint = authMode === 'LOGIN' ? '/auth/login' : '/auth/register';

    const bodyPayload = authMode === 'LOGIN' 
      ? { phone: internationalPhone, password }
      : { 
          phone: internationalPhone, 
          password, 
          countryCode, 
          name: fullName.trim() || `Utilisateur_${phone.slice(-4)}` 
        };

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Identifiants invalides ou erreur de traitement.");
      }

      if (json.success) {
        setSuccessMsg(json.message || 'Authentification réussie !');
        login(json.accessToken, json.user);
        
        // Reset des états et fermeture de la modal
        setPhone('');
        setPassword('');
        setFullName('');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl relative z-10 overflow-hidden text-left p-6 sm:p-8 mx-4 transition-all">
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-950 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-950 tracking-tight">
              {authMode === 'LOGIN' ? 'Connexion à La Brocante' : 'Créer un compte'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {authMode === 'LOGIN' 
                ? 'Saisissez vos identifiants pour accéder à votre espace.' 
                : 'Rejoignez la marketplace en renseignant vos informations.'
              }
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Champ Nom (Uniquement en mode inscription) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Votre Nom Complet</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="Ex: Collins Fono"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-3 border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Téléphone & Pays */}
            <div className="flex gap-2.5">
              <div className="w-28 shrink-0">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Pays</label>
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setPhone('');
                  }}
                  className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-800 focus:bg-white focus:border-slate-300 transition-colors"
                >
                  {Object.values(countries).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Téléphone ({currentCountry.prefix})</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="tel"
                    placeholder={currentCountry.placeholder}
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full bg-slate-50 text-xs sm:text-sm rounded-xl pl-9 pr-10 py-3 border outline-none font-bold text-slate-900 transition-all ${
                      phone.length > 0 
                        ? isPhoneValid 
                          ? 'border-green-500 focus:bg-white focus:border-green-600' 
                          : 'border-red-400 focus:bg-white focus:border-red-500'
                        : 'border-slate-200 focus:bg-white focus:border-slate-300'
                    }`}
                  />
                  {phone.length > 0 && (
                    <div className="absolute right-3 flex items-center">
                      {isPhoneValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Saisie du mot de passe */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-3 border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPhoneValid || password.length < 4}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : authMode === 'LOGIN' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {/* Séparateur et changement de mode */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              {authMode === 'LOGIN' 
                ? "Pas encore de compte ? S'inscrire" 
                : "Déjà un compte ? Se connecter"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}