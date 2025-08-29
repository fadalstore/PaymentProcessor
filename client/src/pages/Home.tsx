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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center space-x-2" data-testid="logo">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">CourseHub</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-home">
                  {t.navigation.home}
                </a>
                <a href="#courses" className="text-foreground hover:text-primary transition-colors" data-testid="nav-courses">
                  {t.navigation.courses}
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-about">
                  {t.navigation.about}
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-contact">
                  {t.navigation.contact}
                </a>
              </nav>
            </div>
            
            {/* Language Selector & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 rounded-md hover:bg-accent"
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
      <section className="relative bg-gradient-to-r from-primary to-blue-600 text-primary-foreground py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              {t.hero.title} <br className="hidden sm:block" />
              <span className="text-yellow-300">$0.5 kaliya</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90" data-testid="hero-subtitle">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={scrollToCourses}
                className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 px-8 py-4 text-lg font-semibold"
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

      {/* Features Section */}
      <section className="py-16 bg-secondary">
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
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-mobile">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.features.mobile.title}</h3>
              <p className="text-muted-foreground">{t.features.mobile.description}</p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-instant">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.features.instant.title}</h3>
              <p className="text-muted-foreground">{t.features.instant.description}</p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-quality">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.features.quality.title}</h3>
              <p className="text-muted-foreground">{t.features.quality.description}</p>
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

      {/* Testimonials Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="testimonials-title">
              {t.testimonials.title}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6" data-testid={`testimonial-${index}`}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4 text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic mb-3">
                  "{testimonial.comment}"
                </p>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6" data-testid="cta-title">
            {t.cta.title}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto" data-testid="cta-subtitle">
            {t.cta.subtitle}
          </p>
          <Button 
            onClick={scrollToCourses}
            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 px-8 py-4 text-lg font-semibold"
            data-testid="button-cta"
          >
            <Rocket className="w-5 h-5 mr-2" />
            {t.cta.cta}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-card-foreground">CourseHub Somalia</span>
              </div>
              <p className="text-muted-foreground mb-4" data-testid="footer-description">
                {t.footer.description}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Instagram</span>
                  📸
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Telegram</span>
                  ✈️
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">{t.footer.courses.title}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.courses.webdev}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.courses.python}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.courses.office}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.courses.marketing}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">{t.footer.support.title}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.support.help}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.support.contact}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.support.faq}</a></li>
              </ul>
              
              <div className="mt-6">
                <h5 className="font-medium text-card-foreground mb-2">Bixin:</h5>
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
          
          <div className="border-t border-border pt-8 mt-8 text-center">
            <p className="text-muted-foreground" data-testid="footer-copyright">
              {t.footer.copyright}
            </p>
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
