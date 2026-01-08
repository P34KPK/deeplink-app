'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'en' | 'fr' | 'es';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [isClient, setIsClient] = useState(false);

    // Define dictionary within function scope to avoid module-level immutability issues in HMR
    const dictionary: Record<Language, Record<string, string>> = {
        en: {
            'dashboard': 'Dashboard',
            'analytics': 'Analytics',
            'settings': 'Settings',
            'my_links': 'My Links',
            'create_link': 'Create Link',
            'logout': 'Logout',
            'admin': 'Admin',
            'total_clicks': 'Total Clicks',
            'top_locations': 'Top Locations',
            'devices': 'Devices',
            'browsers': 'Browsers',
            'traffic_trend': 'Traffic Trend',
            'copy': 'Copy',
            'copied': 'Copied!',
            'delete': 'Delete',
            'edit': 'Edit',
            'save': 'Save',
            'cancel': 'Cancel',
            'dark_mode': 'Dark Mode',
            'light_mode': 'Light Mode',
            'language': 'Language',
            'affiliate_program': 'Affiliate Program',
            'clicks': 'Clicks',
            'sales': 'Sales',
            'earned': 'Earned',
            'pro_user_only': 'Pro User Only',
            'unlock': 'Unlock',
            'manage_subscription': 'Manage Subscription',
            'last_activity': 'Last Activity',
            'welcome': 'Welcome',
            'view_deal': 'View Deal',
            'generate': 'Generate',
            'magic': 'Magic',
            'viral_studio': 'Viral Studio',
            'qr_studio': 'QR Studio',
            'favorites': 'Favoris',
            'no_data': 'No data yet',
            'top_day': 'Top Day',
            'market_trends': 'Market Trends',
            'top_sources': 'Top Sources',
        },
        fr: {
            'dashboard': 'Tableau de bord',
            'analytics': 'Données',
            'settings': 'Paramètres',
            'my_links': 'Mes Liens',
            'create_link': 'Créer un lien',
            'logout': 'Déconnexion',
            'admin': 'Admin',
            'total_clicks': 'Clics Totaux',
            'top_locations': 'Top Lieux',
            'devices': 'Appareils',
            'browsers': 'Navigateurs',
            'traffic_trend': 'Trafic',
            'copy': 'Copier',
            'copied': 'Copié !',
            'delete': 'Supprimer',
            'edit': 'Modifier',
            'save': 'Enregistrer',
            'cancel': 'Annuler',
            'dark_mode': 'Mode Sombre',
            'light_mode': 'Mode Clair',
            'language': 'Langue',
            'affiliate_program': 'Programme d\'affiliation',
            'clicks': 'Clics',
            'sales': 'Ventes',
            'earned': 'Gagné',
            'pro_user_only': 'Pro Seulement',
            'unlock': 'Débloquer',
            'manage_subscription': 'Gérer l\'abonnement',
            'last_activity': 'Dernière activité',
            'welcome': 'Bienvenue',
            'view_deal': 'Voir l\'offre',
            'generate': 'Générer',
            'magic': 'Magie',
            'viral_studio': 'Studio Viral',
            'qr_studio': 'Studio QR',
            'favorites': 'Favoris',
            'no_data': 'Pas de données',
            'top_day': 'Meilleur Jour',
            'market_trends': 'Tendances',
            'top_sources': 'Top Sources',
        },
        es: {
            'dashboard': 'Tablero',
            'analytics': 'Analítica',
            'settings': 'Configuración',
            'my_links': 'Mis Enlaces',
            'create_link': 'Crear Enlace',
            'logout': 'Cerrar Sesión',
            'admin': 'Admin',
            'total_clicks': 'Clics Totales',
            'top_locations': 'Ubicaciones',
            'devices': 'Dispositivos',
            'browsers': 'Navegadores',
            'traffic_trend': 'Tráfico',
            'copy': 'Copiar',
            'copied': '¡Copiado!',
            'delete': 'Eliminar',
            'edit': 'Editar',
            'save': 'Guardar',
            'cancel': 'Cancelar',
            'dark_mode': 'Modo Oscuro',
            'light_mode': 'Modo Claro',
            'language': 'Idioma',
            'affiliate_program': 'Afiliados',
            'clicks': 'Clics',
            'sales': 'Ventas',
            'earned': 'Ganado',
            'pro_user_only': 'Solo Pro',
            'unlock': 'Desbloquear',
            'manage_subscription': 'Gestionar Suscripción',
            'last_activity': 'Última actividad',
            'welcome': 'Bienvenido',
            'view_deal': 'Ver Oferta',
            'generate': 'Generar',
            'magic': 'Magia',
            'viral_studio': 'Estudio Viral',
            'qr_studio': 'Estudio QR',
            'favorites': 'Favoritos',
            'no_data': 'Sin datos',
            'top_day': 'Mejor Día',
            'market_trends': 'Tendencias',
            'top_sources': 'Fuentes',
        }
    };

    useEffect(() => {
        setIsClient(true);
        try {
            const savedLang = localStorage.getItem('deeplink-lang');
            if (savedLang && (savedLang === 'en' || savedLang === 'fr' || savedLang === 'es')) {
                setLanguage(savedLang as Language);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        try {
            localStorage.setItem('deeplink-lang', lang);
        } catch (e) {
            // ignore
        }
    };

    const t = useCallback((key: string): string => {
        const langData = dictionary[language] || dictionary['en'];
        return langData[key] || dictionary['en'][key] || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
