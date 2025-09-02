import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Course } from "@shared/schema";
import { useLanguage } from "@/hooks/useLanguage";
import { getTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CourseCard } from "@/components/CourseCard";
import { PaymentModal } from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Star, Smartphone, Download, Award, Rocket, Menu } from "lucide-react";
import { Link } from "wouter";
import { BannerAd, SquareAd, ResponsiveAd } from "@/components/GoogleAdsense";
import { AdSidebar } from "@/components/AdSidebar";

export default function Home() {
  const { language } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = getTranslation(language);

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const handlePurchase = (course: Course) => {
    setSelectedCourse(course);
    setIsPaymentModalOpen(true);
  };

  const scrollToCourses = () => {
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMobileMenuOpen(false);
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const testimonials = [
    {
      name: "Ahmed Ali",
      role: "Web Developer",
      comment: language === 'so' 
        ? "Koorsadan ayaa badashay noloshayda. Hadda waxaan ahaay web developer xirfad leh."
        : language === 'ar'
        ? "هذه الدورة غيرت حياتي. الآن أنا مطور ويب ماهر."
        : "This course changed my life. Now I'm a skilled web developer.",
      avatar: "👨‍💻"
    },
    {
      name: "Fadumo Omar", 
      role: "Digital Marketer",
      comment: language === 'so'
        ? "Qiimo jaban, adeeg fiican. Waxaan kobciyey xirfadayda marketing-ka."
        : language === 'ar'
        ? "سعر منخفض، خدمة جيدة. طورت مهاراتي في التسويق."
        : "Low price, good service. I developed my marketing skills.",
      avatar: "👩‍💼"
    },
    {
      name: "Mohamed Hassan",
      role: "Graphic Designer", 
      comment: language === 'so'
        ? "Fudud bay u ahayd in aan baro. Hadda waxaan ku shaqeeyaa design company."
        : language === 'ar'
        ? "كان من السهل التعلم. الآن أعمل في شركة تصميم."
        : "It was easy to learn. Now I work at a design company.",
      avatar: "🎨"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Ad Sidebar */}
      <AdSidebar />
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center space-x-3" data-testid="logo">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">CourseHub</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105 relative group" data-testid="nav-home">
                  {t.navigation.home}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#courses" className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105 relative group" data-testid="nav-courses">
                  {t.navigation.courses}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <Link href="/premium" className="text-amber-600 hover:text-amber-700 transition-all duration-300 font-medium hover:scale-105 relative group flex items-center space-x-1" data-testid="nav-premium">
                  <Star className="w-4 h-4" />
                  <span>Premium</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <a href="#" className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105 relative group" data-testid="nav-about">
                  {t.navigation.about}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105 relative group" data-testid="nav-contact">
                  {t.navigation.contact}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </nav>
            </div>
            
            {/* Language Selector & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-3 rounded-xl glass-effect hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border" data-testid="mobile-menu">
              <nav className="flex flex-col space-y-2">
                <a href="#" className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors">
                  {t.navigation.home}
                </a>
                <a href="#courses" className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors">
                  {t.navigation.courses}
                </a>
                <a href="#" className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors">
                  {t.navigation.about}
                </a>
                <a href="#" className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors">
                  {t.navigation.contact}
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative gradient-animate text-primary-foreground py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full float-animation" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-lg rotate-45 float-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full float-animation" style={{animationDelay: '4s'}}></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
              {t.hero.title} <br className="hidden sm:block" />
              <span className="text-gradient bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">$0.5 kaliya</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90" data-testid="hero-subtitle">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={scrollToCourses}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold pulse-glow transform hover:scale-105 transition-all duration-300 shadow-lg"
                data-testid="button-hero-cta"
              >
                <Rocket className="w-5 h-5 mr-2" />
                {t.hero.cta}
              </Button>
              <div className="flex items-center space-x-4 text-primary-foreground/80">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span data-testid="stats-students">1,200+ {t.hero.students}</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  <span data-testid="stats-rating">4.9/5 {t.hero.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Ad */}
      <div className="py-4 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd />
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="features-title">
              {t.features.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="features-subtitle">
              {t.features.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 modern-card glass-effect border-0 relative overflow-hidden" data-testid="feature-mobile">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t.features.mobile.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.mobile.description}</p>
              </div>
            </Card>
            
            <Card className="text-center p-8 modern-card glass-effect border-0 relative overflow-hidden" data-testid="feature-instant">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Download className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t.features.instant.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.instant.description}</p>
              </div>
            </Card>
            
            <Card className="text-center p-8 modern-card glass-effect border-0 relative overflow-hidden" data-testid="feature-quality">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{t.features.quality.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.quality.description}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 bg-background" id="courses">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="courses-title">
              {t.courses.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="courses-subtitle">
              {t.courses.subtitle}
            </p>
          </div>
          
          {/* Square Ad */}
          <div className="flex justify-center mb-8">
            <SquareAd />
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="w-full h-48 bg-muted animate-pulse"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                    <div className="h-6 bg-muted rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded mb-4 animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="courses-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  language={language}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Responsive Ad */}
      <div className="py-4 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ResponsiveAd />
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="testimonials-title">
              {t.testimonials.title}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 modern-card glass-effect border-0 relative overflow-hidden" data-testid={`testimonial-${index}`}>
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-blue-600"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mr-4 text-2xl shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-card-foreground text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic mb-4 leading-relaxed text-base">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-animate text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full float-animation" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-lg rotate-12 float-animation" style={{animationDelay: '3s'}}></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6" data-testid="cta-title">
            {t.cta.title}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto" data-testid="cta-subtitle">
            {t.cta.subtitle}
          </p>
          <Button 
            onClick={scrollToCourses}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-10 py-5 text-xl font-bold pulse-glow transform hover:scale-105 transition-all duration-300 shadow-xl"
            data-testid="button-cta"
          >
            <Rocket className="w-6 h-6 mr-3" />
            {t.cta.cta}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">CourseHub Somalia</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg" data-testid="footer-description">
                {t.footer.description}
              </p>
              <div className="flex space-x-6">
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 transform hover:scale-110 text-xl">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 transform hover:scale-110 text-xl">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 transform hover:scale-110 text-xl">
                  <span className="sr-only">Instagram</span>
                  📸
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 transform hover:scale-110 text-xl">
                  <span className="sr-only">Telegram</span>
                  ✈️
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">{t.footer.courses.title}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.courses.webdev}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.courses.python}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.courses.office}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.courses.marketing}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">{t.footer.support.title}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.support.help}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.support.contact}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2">{t.footer.support.faq}</a></li>
              </ul>
              
              <div className="mt-6">
                <h5 className="font-bold text-white mb-3 text-base">Bixin:</h5>
                <div className="flex space-x-2">
                  <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">E</span>
                  </div>
                  <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">Z</span>
                  </div>
                  <div className="w-8 h-5 bg-orange-500 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 mt-8 text-center">
            <p className="text-gray-300 text-lg" data-testid="footer-copyright">
              {t.footer.copyright}
            </p>
            <div className="mt-4">
              <Link href="/admin/login">
                <span className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors duration-300">
                  Admin
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        course={selectedCourse}
        language={language}
      />
    </div>
  );
}
