
import React from 'react';
import { SidebarAd } from './GoogleAdsense';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { getTranslation } from '@/lib/i18n';

export function AdSidebar() {
  const { language } = useLanguage();
  const t = getTranslation(language);

  return (
    <div className="hidden xl:block fixed right-4 top-20 w-80 z-40">
      <div className="space-y-6">
        {/* Main Ad */}
        <SidebarAd />
        
        {/* Quick Links Card */}
        <Card className="glass-effect border-0">
          <CardHeader>
            <CardTitle className="text-lg text-center">
              {language === 'so' ? 'Xiriirka Degdegga ah' : 
               language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="#courses" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              📚 {t.navigation.courses}
            </a>
            <a href="/premium" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              ⭐ Premium
            </a>
            <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              📞 {t.navigation.contact}
            </a>
            <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              ❓ {t.footer.support.faq}
            </a>
          </CardContent>
        </Card>

        {/* Small Banner Ad */}
        <div className="adsense-container">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '300px', height: '100px' }}
            data-ad-client="ca-pub-0000000000000000"
            data-ad-slot="9988776655"
            data-ad-format="horizontal"
          />
        </div>

        {/* Stats Card */}
        <Card className="glass-effect border-0 text-center">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground">
                {language === 'so' ? 'Ardayda' : 
                 language === 'ar' ? 'طلاب' : 'Students'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
