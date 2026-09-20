import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
export const metadata: Metadata = { title:'Insta Slides Editor', description:'Continuous-text Instagram carousel editor' };
export default function RootLayout({children}:{children:ReactNode}){return <html lang="fa" dir="rtl"><body>{children}</body></html>}