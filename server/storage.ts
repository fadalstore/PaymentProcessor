import { type Course, type InsertCourse, type Payment, type InsertPayment, type AdminUser, type InsertAdminUser, type Subscription, type InsertSubscription, type UserProfile, type InsertUserProfile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Course methods
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined>;
  getPaymentsByPhone(phone: string): Promise<Payment[]>;
  getCompletedPaymentForCourse(courseId: string, phone: string): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  
  // Admin methods
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAllAdmins(): Promise<AdminUser[]>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: string, status: string, periodStart?: Date, periodEnd?: Date): Promise<Subscription | undefined>;
  cancelSubscription(id: string, cancelAt?: Date): Promise<Subscription | undefined>;
  
  // User profile methods
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  updateUserProfile(userId: string, profileUpdate: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
}

export class MemStorage implements IStorage {
  private courses: Map<string, Course>;
  private payments: Map<string, Payment>;
  private adminUsers: Map<string, AdminUser>;
  private subscriptions: Map<string, Subscription>;
  private userProfiles: Map<string, UserProfile>;

  constructor() {
    this.courses = new Map();
    this.payments = new Map();
    this.adminUsers = new Map();
    this.subscriptions = new Map();
    this.userProfiles = new Map();
    this.initializeCourses();
    this.initializeAdminUser();
  }

  private initializeCourses() {
    const defaultCourses: Course[] = [
      {
        id: "web-development",
        title: {
          so: "Web Development Master Course",
          en: "Complete Full-Stack Web Development",
          ar: "دورة تطوير الويب الشاملة"
        },
        description: {
          so: "Koorso buuxa oo ka kooban HTML5, CSS3, JavaScript, Node.js, MongoDB iyo React. Waxaad baran doontaa sidaad u dhisato websites iyo web applications oo casri ah.",
          en: "Comprehensive course covering HTML5, CSS3, JavaScript, Node.js, MongoDB and React. Learn to build modern websites and full-stack web applications from scratch.",
          ar: "دورة شاملة تغطي HTML5 و CSS3 و JavaScript و Node.js و MongoDB و React. تعلم بناء مواقع الويب وتطبيقات الويب الكاملة من البداية."
        },
        category: "Programming",
        price: "0.50",
        duration: "12 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/web-development-complete.pdf",
        curriculum: [
          "HTML5 & CSS3 Advanced Techniques",
          "JavaScript ES6+ & DOM Manipulation", 
          "React.js Components & State Management",
          "Node.js & Express Server Development",
          "MongoDB Database Integration",
          "RESTful API Development",
          "Authentication & Security",
          "Deployment & Production Setup"
        ],
        createdAt: new Date()
      },
      {
        id: "python-complete",
        title: {
          so: "Python Master Class - Asaasiga ilaa Xirfadda",
          en: "Python Complete Course - From Beginner to Advanced",
          ar: "دورة بايثون الشاملة - من المبتدئ إلى المتقدم"
        },
        description: {
          so: "Koorso buuxa oo Python programming ah oo ka bilaaban syntax asaasiga ah ilaa advanced topics sida data science, machine learning, iyo web development Django.",
          en: "Complete Python programming course from basic syntax to advanced topics including data science, machine learning, automation, and web development with Django.",
          ar: "دورة برمجة بايثون الشاملة من الصيغة الأساسية إلى المواضيع المتقدمة بما في ذلك علم البيانات والتعلم الآلي والأتمتة وتطوير الويب باستخدام Django."
        },
        category: "Programming",
        price: "0.50",
        duration: "15 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/python-complete-mastery.pdf",
        curriculum: [
          "Python Fundamentals & Syntax",
          "Data Types, Variables & Control Flow",
          "Functions, Modules & Packages", 
          "Object-Oriented Programming",
          "File Handling & Exception Management",
          "Libraries: NumPy, Pandas, Matplotlib",
          "Data Analysis & Visualization",
          "Web Scraping with BeautifulSoup",
          "Django Web Framework Basics",
          "API Development & Integration",
          "Automation Scripts & Tools",
          "Introduction to Machine Learning"
        ],
        createdAt: new Date()
      },
      {
        id: "microsoft-office-2024",
        title: {
          so: "Microsoft Office 2024 Professional",
          en: "Microsoft Office 2024 Complete Mastery",
          ar: "إتقان مايكروسوفت أوفيس 2024 الكامل"
        },
        description: {
          so: "Koorso Professional ah oo ku saabsan Microsoft Office 2024: Word, Excel, PowerPoint, Outlook, OneNote. Waxaad baran doontaa advanced techniques, automation, iyo business applications.",
          en: "Professional Microsoft Office 2024 training: Word, Excel, PowerPoint, Outlook, OneNote. Master advanced techniques, automation, macros, and business applications for maximum productivity.",
          ar: "تدريب احترافي على مايكروسوفت أوفيس 2024: Word و Excel و PowerPoint و Outlook و OneNote. إتقان التقنيات المتقدمة والأتمتة والماكرو وتطبيقات الأعمال لتحقيق أقصى إنتاجية."
        },
        category: "Office Productivity",
        price: "0.50",
        duration: "10 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1586717799252-bd134ad00e26?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/microsoft-office-2024-professional.pdf",
        curriculum: [
          "Word 2024: Advanced Document Formatting & Templates",
          "Excel 2024: Formulas, Functions & Data Analysis",
          "PowerPoint 2024: Professional Presentation Design",
          "Outlook 2024: Email Management & Calendar Optimization",
          "OneNote 2024: Advanced Note Organization",
          "Office Integration & Collaboration Tools",
          "Macros & Automation for Productivity",
          "Data Visualization & Charts",
          "Mail Merge & Document Automation",
          "SharePoint Integration & Cloud Collaboration"
        ],
        createdAt: new Date()
      },
      {
        id: "digital-marketing-mastery",
        title: {
          so: "Digital Marketing Mastery 2024",
          en: "Complete Digital Marketing Certification Course",
          ar: "دورة شهادة التسويق الرقمي الشاملة"
        },
        description: {
          so: "Koorso buuxa oo Digital Marketing ah oo la mid ah Google Certificate. Waxaad baran doontaa SEO, Google Ads, Facebook Marketing, Email Marketing, Content Strategy, iyo Analytics.",
          en: "Complete Digital Marketing course equivalent to Google Digital Marketing Certificate. Master SEO, Google Ads, Facebook Marketing, Email Marketing, Content Strategy, Analytics and more.",
          ar: "دورة التسويق الرقمي الشاملة المعادلة لشهادة جوجل للتسويق الرقمي. أتقن SEO وإعلانات Google والتسويق عبر Facebook والتسويق بالبريد الإلكتروني واستراتيجية المحتوى والتحليلات وأكثر."
        },
        category: "Digital Marketing",
        price: "0.50",
        duration: "20 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/digital-marketing-mastery-2024.pdf",
        curriculum: [
          "Digital Marketing Fundamentals & Strategy",
          "Search Engine Optimization (SEO) Mastery",
          "Google Ads & PPC Campaign Management", 
          "Facebook & Instagram Marketing",
          "Email Marketing & Automation",
          "Content Marketing & Strategy",
          "Social Media Management",
          "Google Analytics & Data Analysis",
          "Conversion Rate Optimization",
          "Affiliate Marketing Basics",
          "E-commerce Marketing",
          "Marketing Automation Tools",
          "ROI Measurement & Reporting",
          "Brand Building & Online Reputation"
        ],
        createdAt: new Date()
      },
      {
        id: "graphic-design",
        title: {
          so: "Graphic Design Mastery",
          en: "Professional Graphic Design Course", 
          ar: "دورة التصميم الجرافيكي المحترف"
        },
        description: {
          so: "Koorso buuxa oo Graphic Design ah: Canva, Photoshop, Illustrator. Waxaad baran doontaa logo design, brand identity, marketing materials, iyo digital graphics.",
          en: "Complete Graphic Design course: Canva, Photoshop, Illustrator. Learn logo design, brand identity, marketing materials, and professional digital graphics creation.",
          ar: "دورة التصميم الجرافيكي الشاملة: Canva و Photoshop و Illustrator. تعلم تصميم الشعارات والهوية التجارية والمواد التسويقية والرسومات الرقمية المحترفة."
        },
        category: "Creative Design",
        price: "0.50",
        duration: "8 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/graphic-design-mastery.pdf",
        curriculum: [
          "Design Principles and Color Theory",
          "Canva Pro Mastery for Quick Designs",
          "Adobe Photoshop Advanced Techniques", 
          "Adobe Illustrator Vector Graphics",
          "Brand Identity and Logo Design",
          "Marketing Materials Creation",
          "Social Media Graphics Design",
          "Print Design and Preparation"
        ],
        createdAt: new Date()
      },
      {
        id: "video-editing",
        title: {
          so: "Professional Video Editing",
          en: "Complete Video Production & Editing",
          ar: "إنتاج وتحرير الفيديو الشامل"
        },
        description: {
          so: "Koorso buuxa oo Video Editing ah: CapCut, Premiere Pro, After Effects. Waxaad baran doontaa video production, color grading, motion graphics, iyo social media content creation.",
          en: "Complete Video Editing course: CapCut, Premiere Pro, After Effects. Learn video production, color grading, motion graphics, and social media content creation from scratch.",
          ar: "دورة تحرير الفيديو الشاملة: CapCut و Premiere Pro و After Effects. تعلم إنتاج الفيديو وتدرج الألوان ورسومات الحركة وإنشاء محتوى وسائل التواصل الاجتماعي من البداية."
        },
        category: "Video Production",
        price: "0.50",
        duration: "10 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/video-editing-professional.pdf",
        curriculum: [
          "Video Editing Fundamentals",
          "CapCut Mobile and Desktop Mastery",
          "Adobe Premiere Pro Professional Workflow",
          "Color Grading and Audio Mixing",
          "Motion Graphics and Text Animation",
          "Social Media Video Creation",
          "YouTube Content Production",
          "Commercial Video Production"
        ],
        createdAt: new Date()
      },
      {
        id: "business-management",
        title: {
          so: "Business Management Essentials",
          en: "Complete Business Management Course",
          ar: "دورة إدارة الأعمال الشاملة"
        },
        description: {
          so: "Koorso buuxa oo Business Management ah: Leadership, Finance, Marketing, Operations, HR. Waxaad baran doontaa sidaad u maamuusho ganacsiga yar iyo weyn.",
          en: "Complete Business Management course covering Leadership, Finance, Marketing, Operations, HR. Learn to manage small and large businesses effectively with real-world strategies.",
          ar: "دورة إدارة الأعمال الشاملة تغطي القيادة والمالية والتسويق والعمليات والموارد البشرية. تعلم إدارة الأعمال الصغيرة والكبيرة بفعالية مع استراتيجيات العالم الحقيقي."
        },
        category: "Business",
        price: "0.50",
        duration: "14 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/business-management-essentials.pdf",
        curriculum: [
          "Business Fundamentals & Strategy",
          "Leadership and Team Management",
          "Financial Planning & Budgeting",
          "Marketing & Customer Acquisition",
          "Operations and Supply Chain",
          "Human Resources Management",
          "Project Management Essentials",
          "Digital Transformation for Business",
          "Risk Management & Compliance",
          "Growth Strategies & Scaling"
        ],
        createdAt: new Date()
      }
    ];

    defaultCourses.forEach(course => {
      this.courses.set(course.id, course);
    });
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = {
      id,
      title: insertCourse.title,
      description: insertCourse.description,
      category: insertCourse.category,
      price: insertCourse.price || "0.50",
      duration: insertCourse.duration,
      rating: insertCourse.rating || "4.5",
      image: insertCourse.image,
      fileUrl: insertCourse.fileUrl,
      curriculum: Array.isArray(insertCourse.curriculum) ? insertCourse.curriculum as string[] : [],
      createdAt: new Date(),
    };
    this.courses.set(id, course);
    return course;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...insertPayment,
      id,
      status: "pending",
      transactionId: null,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (payment) {
      payment.status = status;
      if (transactionId) {
        payment.transactionId = transactionId;
      }
      this.payments.set(id, payment);
      return payment;
    }
    return undefined;
  }

  async getPaymentsByPhone(phone: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.phone === phone);
  }

  async getCompletedPaymentForCourse(courseId: string, phone: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      p => p.courseId === courseId && p.phone === phone && p.status === "completed"
    );
  }

  async updateCourse(id: string, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (course) {
      const updatedCourse: Course = { 
        ...course, 
        ...courseUpdate,
        curriculum: courseUpdate.curriculum ? (Array.isArray(courseUpdate.curriculum) ? courseUpdate.curriculum as string[] : []) : course.curriculum
      };
      this.courses.set(id, updatedCourse);
      return updatedCourse;
    }
    return undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  private async initializeAdminUser() {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const defaultAdmin: AdminUser = {
      id: randomUUID(),
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      phone: '252634844506',
      createdAt: new Date()
    };
    
    this.adminUsers.set(defaultAdmin.username, defaultAdmin);
  }

  async createAdminUser(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    
    const admin: AdminUser = {
      id: randomUUID(),
      username: insertAdmin.username,
      password: hashedPassword,
      name: insertAdmin.name,
      phone: insertAdmin.phone,
      createdAt: new Date()
    };
    
    this.adminUsers.set(admin.username, admin);
    return admin;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(username);
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return Array.from(this.adminUsers.values());
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      stripeCustomerId: insertSubscription.stripeCustomerId || null,
      stripeSubscriptionId: insertSubscription.stripeSubscriptionId || null,
      plan: insertSubscription.plan,
      status: insertSubscription.status || "active",
      currentPeriodStart: insertSubscription.currentPeriodStart || null,
      currentPeriodEnd: insertSubscription.currentPeriodEnd || null,
      cancelAtPeriodEnd: insertSubscription.cancelAtPeriodEnd || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(s => s.stripeSubscriptionId === stripeSubscriptionId);
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(s => s.userId === userId && s.status === "active");
  }

  async updateSubscriptionStatus(id: string, status: string, periodStart?: Date, periodEnd?: Date): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.status = status;
      subscription.updatedAt = new Date();
      if (periodStart) subscription.currentPeriodStart = periodStart;
      if (periodEnd) subscription.currentPeriodEnd = periodEnd;
      this.subscriptions.set(id, subscription);
      return subscription;
    }
    return undefined;
  }

  async cancelSubscription(id: string, cancelAt?: Date): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.status = "cancelled";
      subscription.cancelAtPeriodEnd = cancelAt || new Date();
      subscription.updatedAt = new Date();
      this.subscriptions.set(id, subscription);
      return subscription;
    }
    return undefined;
  }

  async updateSubscription(id: string, updateData: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      const updated: Subscription = {
        ...subscription,
        ...updateData,
        updatedAt: new Date()
      };
      this.subscriptions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // User profile methods
  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const id = randomUUID();
    const profile: UserProfile = {
      id,
      userId: insertProfile.userId,
      name: insertProfile.name || null,
      email: insertProfile.email || null,
      phone: insertProfile.phone || null,
      subscriptionId: insertProfile.subscriptionId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.set(insertProfile.userId, profile);
    return profile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }

  async updateUserProfile(userId: string, profileUpdate: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      const updatedProfile: UserProfile = {
        ...profile,
        ...profileUpdate,
        updatedAt: new Date(),
      };
      this.userProfiles.set(userId, updatedProfile);
      return updatedProfile;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
