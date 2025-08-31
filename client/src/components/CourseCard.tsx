import { type Course } from "@shared/schema";
import { type Language, getTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface CourseCardProps {
  course: Course;
  language: Language;
  onPurchase: (course: Course) => void;
}

export function CourseCard({ course, language, onPurchase }: CourseCardProps) {
  const t = getTranslation(language);

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
    <Card 
      className="overflow-hidden modern-card glass-effect border-0 cursor-pointer group relative"
      data-testid={`course-card-${course.id}`}
    >
      <div className="relative overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title[language]}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Badge className={`${getCategoryColor(course.category)} px-3 py-1 text-xs font-medium rounded-full`}>
            {course.category}
          </Badge>
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="ml-1 text-sm text-muted-foreground">
              {course.rating}
            </span>
          </div>
        </div>
        
        <h3 
          className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition-colors duration-300"
          data-testid={`course-title-${course.id}`}
        >
          {course.title[language]}
        </h3>
        
        <p 
          className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed"
          data-testid={`course-description-${course.id}`}
        >
          {course.description[language]}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span 
              className="text-2xl font-bold text-primary"
              data-testid={`course-price-${course.id}`}
            >
              ${course.price}
            </span>
            <span 
              className="text-sm text-muted-foreground"
              data-testid={`course-duration-${course.id}`}
            >
              {course.duration}
            </span>
          </div>
          <Button 
            onClick={() => onPurchase(course)}
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white transform hover:scale-105 transition-all duration-300 shadow-lg"
            data-testid={`button-purchase-${course.id}`}
          >
            {t.courses.buyNow}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
