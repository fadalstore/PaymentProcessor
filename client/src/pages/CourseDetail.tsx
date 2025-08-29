import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Course } from "@shared/schema";
import { useLanguage } from "@/hooks/useLanguage";
import { getTranslation } from "@/lib/i18n";
import { PaymentModal } from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Star, ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const t = getTranslation(language);

  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: ['/api/courses', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <div className="w-full h-64 md:h-full bg-muted animate-pulse"></div>
                </div>
                <div className="p-8 md:w-2/3">
                  <div className="h-6 bg-muted rounded mb-4 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded mb-4 animate-pulse"></div>
                  <div className="h-20 bg-muted rounded mb-6 animate-pulse"></div>
                  <div className="h-32 bg-muted rounded mb-6 animate-pulse"></div>
                  <div className="flex justify-between">
                    <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-12 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Technology: "bg-primary/10 text-primary",
      Programming: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      Office: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      Marketing: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      Design: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
      Media: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" className="mb-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </header>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden" data-testid="course-detail">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img 
                  src={course.image} 
                  alt={course.title[language]}
                  className="w-full h-64 md:h-full object-cover"
                  data-testid="course-image"
                />
              </div>
              <div className="p-8 md:w-2/3">
                <div className="mb-6">
                  <Badge className={getCategoryColor(course.category)}>
                    {course.category}
                  </Badge>
                  <h1 
                    className="text-3xl font-bold mt-4 mb-3 text-card-foreground"
                    data-testid="course-title"
                  >
                    {course.title[language]}
                  </h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm text-muted-foreground">
                        {course.rating} rating
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">
                        {course.duration}
                      </span>
                    </div>
                  </div>
                  <p 
                    className="text-muted-foreground text-lg"
                    data-testid="course-description"
                  >
                    {course.description[language]}
                  </p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                    {language === 'so' ? 'Waxaad baran doonto:' : 
                     language === 'ar' ? 'ما ستتعلمه:' : 
                     'What you\'ll learn:'}
                  </h3>
                  <ul className="space-y-3" data-testid="course-curriculum">
                    {course.curriculum.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span 
                      className="text-3xl font-bold text-primary"
                      data-testid="course-price"
                    >
                      ${course.price}
                    </span>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold"
                    data-testid="button-purchase"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {t.courses.buyNow}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        course={course}
        language={language}
      />
    </div>
  );
}
