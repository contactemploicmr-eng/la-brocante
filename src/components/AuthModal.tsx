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
    name: 'Côte d’Ivoire',
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
  const [step, setStep] = useState<1 | 2>(1);

  // Champs de saisie
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('CM');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');

  // États de validation et UI
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const currentCountry = countries[countryCode];

  // Validation dynamique en temps réel du numéro de téléphone
  useEffect(() => {
    // Nettoyer tous les caractères non numériques pour la validation
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

  // Gestion du changement de saisie du téléphone avec limitation stricte
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // On ne garde que les chiffres pour éviter les caractères farfelus
    const cleanValue = e.target.value.replace(/\D/g, '');
    
    // Limitation stricte de la longueur selon la configuration du pays
    if (cleanValue.length <= currentCountry.maxLength) {
      setPhone(cleanValue);
    }
  };

  // 1. Soumettre la demande d'OTP (Étape 1)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setErrorMsg(`Le numéro saisi n'est pas un numéro valide pour le ${currentCountry.name}.`);
      return;
    }

    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const internationalPhone = `${currentCountry.prefix}${phone}`;

      const res = await fetch(`${apiUrl}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: internationalPhone,
          countryCode 
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Erreur lors de l'envoi de l'OTP.");
      }

      setInfoMsg(json.message || 'Code envoyé avec succès !');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Vérifier l'OTP et valider la connexion (Étape 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const internationalPhone = `${currentCountry.prefix}${phone}`;

      const res = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: internationalPhone,
          code: otpCode, 
          countryCode, 
          ...(fullName.trim() && { name: fullName.trim() }) 
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Code de vérification invalide.');
      }

      if (json.success) {
        login(json.accessToken, json.user);
        onClose();
        // Reset
        setStep(1);
        setPhone('');
        setOtpCode('');
        setFullName('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Arrière-plan flouté ultra-sobre */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Conteneur de la Modal */}
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl relative z-10 overflow-hidden text-left p-6 sm:p-8 mx-4 transition-all">
        
        {/* Bouton Fermer */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-950 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-950 tracking-tight">
              {step === 1 ? 'Rejoindre La Brocante' : 'Validation du numéro'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {step === 1 
                ? 'Saisissez votre numéro de téléphone pour vous connecter ou créer un compte.' 
                : `Saisissez le code de vérification à 4 chiffres envoyé par SMS.`
              }
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* ========================================== */}
          {/* ÉTAPE 1 : ENVOI DU TÉLÉPHONE */}
          {/* ========================================== */}
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="flex gap-2.5">
                {/* Sélecteur de pays */}
                <div className="w-32 shrink-0">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Pays</label>
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setPhone(''); // On vide pour éviter des incohérences de taille
                    }}
                    className="w-full bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-800 focus:bg-white focus:border-slate-300 transition-colors"
                  >
                    {Object.values(countries).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Numéro de téléphone */}
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Numéro de téléphone</label>
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
                    {/* Indicateur visuel de statut de validation */}
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

              {/* Petit rappel de longueur dynamique discret */}
              <div className="text-[10px] text-slate-400 font-bold text-right">
                Longueur requise : <span className="text-slate-600">{currentCountry.maxLength} chiffres</span>
              </div>

              <button
                type="submit"
                disabled={loading || !isPhoneValid}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recevoir le code d’accès'}
              </button>
            </form>
          ) : (
            /* ========================================== */
            /* ÉTAPE 2 : VÉRIFICATION OTP + FORMULAIRE NOM */
            /* ========================================== */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {/* Saisie de l'OTP */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Code à 4 chiffres</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 1234"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Uniquement des chiffres
                    className="w-full bg-slate-50 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-3 border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-black text-slate-900 tracking-widest"
                  />
                </div>
              </div>

              {/* Saisie facultative du nom */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Votre Nom ou Pseudo (Facultatif)</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Collins Fono"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-3 border border-slate-200 outline-none focus:bg-white focus:border-slate-300 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-4 rounded-xl transition-all"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider et se connecter'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}