export type AppLanguage = 'english' | 'urdu' | 'hindi';

export interface Translations {
  nav: {
    overview: string;
    committees: string;
    payments: string;
    agentActivity: string;
    members: string;
    decisions: string;
    settings: string;
    help: string;
  };
  topbar: {
    agentActive: string;
    monitoring: string;
    attentionNeeded: string;
    agentOffline: string;
    notifications: string;
    markAllRead: string;
    noNotifications: string;
  };
  organizerRole: string;
  settingsPage: {
    title: string;
    subtitle: string;
    sections: {
      profile: string;
      notifications: string;
      agent: string;
      language: string;
      security: string;
    };
  };
}

/**
 * Translations for the app's persistent chrome — sidebar navigation, top bar,
 * and the Settings page's own labels. This intentionally does NOT cover every
 * string on every page (dashboard cards, committee details, etc.) — that
 * would mean translating the entire app's content, which is a much larger
 * task. This covers what's visible everywhere, all the time, so switching
 * languages has an immediate, visible effect as promised on the Language
 * settings page.
 *
 * Urdu is written right-to-left. Components that render translated Urdu text
 * should set dir="rtl" on that text's container — see Sidebar.tsx and
 * TopBar.tsx for the pattern.
 */
export const translations: Record<AppLanguage, Translations> = {
  english: {
    nav: {
      overview: 'Overview',
      committees: 'Committees',
      payments: 'Payments',
      agentActivity: 'Agent Activity',
      members: 'Members',
      decisions: 'Decisions',
      settings: 'Settings',
      help: 'Help & Support',
    },
    topbar: {
      agentActive: 'Agent Active',
      monitoring: 'Monitoring',
      attentionNeeded: 'Attention needed',
      agentOffline: 'Agent offline',
      notifications: 'Notifications',
      markAllRead: 'Mark all read',
      noNotifications: 'No notifications',
    },
    organizerRole: 'Organizer',
    settingsPage: {
      title: 'Settings',
      subtitle: 'Manage your preferences and account.',
      sections: {
        profile: 'Profile',
        notifications: 'Notifications',
        agent: 'Agent preferences',
        language: 'Language',
        security: 'Security & trust',
      },
    },
  },
  urdu: {
    nav: {
      overview: 'جائزہ',
      committees: 'کمیٹیاں',
      payments: 'ادائیگیاں',
      agentActivity: 'ایجنٹ کی سرگرمی',
      members: 'اراکین',
      decisions: 'فیصلے',
      settings: 'ترتیبات',
      help: 'مدد',
    },
    topbar: {
      agentActive: 'ایجنٹ فعال ہے',
      monitoring: 'نگرانی جاری ہے',
      attentionNeeded: 'توجہ درکار ہے',
      agentOffline: 'ایجنٹ آف لائن ہے',
      notifications: 'اطلاعات',
      markAllRead: 'سب پڑھا ہوا نشان زد کریں',
      noNotifications: 'کوئی اطلاع نہیں',
    },
    organizerRole: 'منتظم',
    settingsPage: {
      title: 'ترتیبات',
      subtitle: 'اپنی ترجیحات اور اکاؤنٹ کا انتظام کریں۔',
      sections: {
        profile: 'پروفائل',
        notifications: 'اطلاعات',
        agent: 'ایجنٹ کی ترجیحات',
        language: 'زبان',
        security: 'حفاظت اور بھروسہ',
      },
    },
  },
  hindi: {
    nav: {
      overview: 'अवलोकन',
      committees: 'कमेटियाँ',
      payments: 'भुगतान',
      agentActivity: 'एजेंट गतिविधि',
      members: 'सदस्य',
      decisions: 'निर्णय',
      settings: 'सेटिंग्स',
      help: 'सहायता',
    },
    topbar: {
      agentActive: 'एजेंट सक्रिय है',
      monitoring: 'निगरानी जारी है',
      attentionNeeded: 'ध्यान देने की आवश्यकता है',
      agentOffline: 'एजेंट ऑफ़लाइन है',
      notifications: 'सूचनाएं',
      markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
      noNotifications: 'कोई सूचना नहीं',
    },
    organizerRole: 'आयोजक',
    settingsPage: {
      title: 'सेटिंग्स',
      subtitle: 'अपनी प्राथमिकताएं और खाता प्रबंधित करें।',
      sections: {
        profile: 'प्रोफ़ाइल',
        notifications: 'सूचनाएं',
        agent: 'एजेंट प्राथमिकताएं',
        language: 'भाषा',
        security: 'सुरक्षा और भरोसा',
      },
    },
  },
};

/** True for languages written right-to-left, so components know to set dir="rtl". */
export function isRtl(language: AppLanguage): boolean {
  return language === 'urdu';
}
