import { Info, Shield, Image, Code } from 'lucide-react';

export const SETTINGS_TABS = [
  {
    id: 'general',
    label: 'General',
    icon: Info,
    description: 'Basic event information and status'
  },
  {
    id: 'security',
    label: 'URL & Security',
    icon: Shield,
    description: 'URL strategies and access control'
  },
  {
    id: 'media',
    label: 'Media & Storage',
    icon: Image,
    description: 'Google Drive and external media links'
  },
  {
    id: 'scan-page',
    label: 'Scan Page',
    icon: Code,
    description: 'Custom HTML template for QR scan page'
  }
] as const;

export type TabId = (typeof SETTINGS_TABS)[number]['id'];
