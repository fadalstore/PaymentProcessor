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
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      data-testid={`course-card-${course.id}`}
    >
      <img 
        src={course.image} 
        alt={course.title[language]}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getCategoryColor(course.category)}>
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
          className="text-xl font-semibold mb-2 text-card-foreground"
          data-testid={`course-title-${course.id}`}
        >
          {course.title[language]}
        </h3>
        
        <p 
          className="text-muted-foreground mb-4 line-clamp-2"
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid={`button-purchase-${course.id}`}
          >
            {t.courses.buyNow}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
