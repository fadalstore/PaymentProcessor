
import React, { useEffect } from 'react';

interface GoogleAdsenseProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

export function GoogleAdsense({ 
  slot, 
  format = 'auto', 
  style = {}, 
  className = '' 
}: GoogleAdsenseProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-0000000000000000" // Replace with your AdSense publisher ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Different ad formats
export function SidebarAd() {
  return (
    <GoogleAdsense
      slot="1234567890"
      format="vertical"
      style={{ width: '300px', height: '600px' }}
      className="sidebar-ad"
    />
  );
}

export function BannerAd() {
  return (
    <GoogleAdsense
      slot="0987654321"
      format="horizontal"
      style={{ width: '100%', height: '90px' }}
      className="banner-ad"
    />
  );
}

export function SquareAd() {
  return (
    <GoogleAdsense
      slot="1122334455"
      format="rectangle"
      style={{ width: '300px', height: '250px' }}
      className="square-ad"
    />
  );
}

export function ResponsiveAd() {
  return (
    <GoogleAdsense
      slot="5566778899"
      format="auto"
      style={{ display: 'block' }}
      className="responsive-ad"
    />
  );
}
