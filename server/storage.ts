import { type Course, type InsertCourse, type Payment, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Course methods
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Payment | undefined>;
  getPaymentsByPhone(phone: string): Promise<Payment[]>;
  getCompletedPaymentForCourse(courseId: string, phone: string): Promise<Payment | undefined>;
}

export class MemStorage implements IStorage {
  private courses: Map<string, Course>;
  private payments: Map<string, Payment>;

  constructor() {
    this.courses = new Map();
    this.payments = new Map();
    this.initializeCourses();
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
      ...insertCourse,
      id,
      price: insertCourse.price || "0.50",
      rating: insertCourse.rating || "4.5",
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
}

export const storage = new MemStorage();
