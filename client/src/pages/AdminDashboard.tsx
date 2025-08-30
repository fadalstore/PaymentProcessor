import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  BookOpen, 
  DollarSign, 
  Users, 
  Edit, 
  Trash2, 
  Plus,
  BarChart3,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const courseFormSchema = z.object({
  title: z.object({
    so: z.string().min(1, "Somali title waa loo baahan yahay"),
    en: z.string().min(1, "English title waa loo baahan yahay"),
    ar: z.string().min(1, "Arabic title waa loo baahan yahay"),
  }),
  description: z.object({
    so: z.string().min(1, "Somali description waa loo baahan yahay"),
    en: z.string().min(1, "English description waa loo baahan yahay"),
    ar: z.string().min(1, "Arabic description waa loo baahan yahay"),
  }),
  category: z.string().min(1, "Category waa loo baahan yahay"),
  price: z.string().min(1, "Price waa loo baahan yahay"),
  duration: z.string().min(1, "Duration waa loo baahan yahay"),
  rating: z.string().optional(),
  image: z.string().min(1, "Image URL waa loo baahan yahay"),
  fileUrl: z.string().min(1, "File URL waa loo baahan yahay"),
  curriculum: z.array(z.string()).min(1, "Curriculum waa loo baahan yahay"),
});

type CourseForm = z.infer<typeof courseFormSchema>;

type AuthResponse = {
  isLoggedIn: boolean;
  admin?: {
    id: string;
    username: string;
  };
};

type Course = {
  id: string;
  title: { so: string; en: string; ar: string };
  description: { so: string; en: string; ar: string };
  category: string;
  price: string;
  duration: string;
  rating: string;
  image: string;
  fileUrl: string;
  curriculum: string[];
  createdAt: string;
};

type Payment = {
  id: string;
  courseId: string;
  phone: string;
  amount: string;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  createdAt: string;
};

type Analytics = {
  totalCourses: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: string;
  paymentsByMethod: Record<string, number>;
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/admin/check"],
  });

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: authData?.isLoggedIn,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: authData?.isLoggedIn,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      setLocation("/admin/login");
      toast({
        title: "Logged out",
        description: "Waa ku baxay admin panel",
      });
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "La tirtiray!",
        description: "Course-ka waa la tirtiray",
      });
    },
  });

  // Course form for adding/editing
  const form = useForm<CourseForm>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: { so: "", en: "", ar: "" },
      description: { so: "", en: "", ar: "" },
      category: "",
      price: "0.50",
      duration: "",
      rating: "4.5",
      image: "",
      fileUrl: "",
      curriculum: [""],
    },
  });

  // Add/Edit course mutation
  const courseMutation = useMutation({
    mutationFn: async (data: CourseForm) => {
      const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : "/api/admin/courses";
      const method = editingCourse ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditingCourse(null);
      setIsAddingCourse(false);
      form.reset();
      toast({
        title: "Guul!",
        description: editingCourse ? "Course waa la cusboonaysiiyay" : "Course cusub waa la sameeyay",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authData?.isLoggedIn) {
      setLocation("/admin/login");
    }
  }, [authLoading, authData?.isLoggedIn, setLocation]);

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!authData?.isLoggedIn) {
    return null;
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      duration: course.duration,
      rating: course.rating,
      image: course.image,
      fileUrl: course.fileUrl,
      curriculum: course.curriculum,
    });
    setIsAddingCourse(true);
  };

  const handleAddNewCourse = () => {
    setEditingCourse(null);
    form.reset({
      title: { so: "", en: "", ar: "" },
      description: { so: "", en: "", ar: "" },
      category: "",
      price: "0.50",
      duration: "",
      rating: "4.5",
      image: "",
      fileUrl: "",
      curriculum: [""],
    });
    setIsAddingCourse(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                CourseHub Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Maamul website-ka iyo courses-ka
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Ku soo galay: {authData.admin?.username}
              </span>
              <Button
                data-testid="button-logout"
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Button data-testid="button-add-course" onClick={handleAddNewCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Course Cusub Dar
              </Button>
            </div>

            {coursesLoading ? (
              <div>Loading courses...</div>
            ) : (
              <div className="grid gap-4">
                {courses.map((course: any) => (
                  <Card key={course.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {course.title.so}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            {course.description.so.substring(0, 100)}...
                          </p>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="secondary">{course.category}</Badge>
                            <Badge variant="outline">${course.price}</Badge>
                            <Badge variant="outline">{course.duration}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            data-testid={`button-edit-${course.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`button-delete-${course.id}`}
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(course.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="text-2xl font-bold">Payment History</h2>
            {paymentsLoading ? (
              <div>Loading payments...</div>
            ) : (
              <div className="grid gap-4">
                {payments.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Wali ma jiraan payments
                    </AlertDescription>
                  </Alert>
                ) : (
                  payments.map((payment: any) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{payment.phone}</p>
                            <p className="text-sm text-gray-600">Course: {payment.courseId}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString('so-SO')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${payment.amount}</p>
                            <Badge 
                              variant={payment.status === "completed" ? "default" : 
                                     payment.status === "failed" ? "destructive" : "secondary"}
                            >
                              {payment.status}
                            </Badge>
                            <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            {analyticsLoading ? (
              <div>Loading analytics...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalCourses || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics?.totalRevenue || "0.00"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.completedPayments || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalPayments || 0}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Course Dialog */}
      <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Wax ka baddal Course-ka" : "Course Cusub Dar"}
            </DialogTitle>
            <DialogDescription>
              Buuxi macluumaadka course-ka
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => courseMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title.so"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Somali)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-title-so" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (English)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-title-en" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Arabic)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-title-ar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="description.so"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Somali)</FormLabel>
                      <FormControl>
                        <Textarea data-testid="textarea-description-so" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (English)</FormLabel>
                      <FormControl>
                        <Textarea data-testid="textarea-description-en" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Arabic)</FormLabel>
                      <FormControl>
                        <Textarea data-testid="textarea-description-ar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input data-testid="input-category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-price" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input data-testid="input-duration" placeholder="e.g., 12 saac" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input data-testid="input-rating" type="number" min="1" max="5" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input data-testid="input-image" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL</FormLabel>
                      <FormControl>
                        <Input data-testid="input-file-url" placeholder="/courses/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  data-testid="button-cancel-course"
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingCourse(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-save-course"
                  type="submit"
                  disabled={courseMutation.isPending}
                >
                  {courseMutation.isPending ? "Ku keydinayaa..." : 
                   editingCourse ? "Cusboonaysii" : "Samee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}