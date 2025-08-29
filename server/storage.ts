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
          so: "Web Development Buuxa",
          en: "Complete Web Development",
          ar: "تطوير الويب الكامل"
        },
        description: {
          so: "HTML, CSS, JavaScript iyo React. Wax ku ool ah oo aad ku dhisi karto websiteyo casri ah.",
          en: "HTML, CSS, JavaScript and React. Everything you need to build modern websites.",
          ar: "HTML و CSS و JavaScript و React. كل ما تحتاجه لبناء مواقع ويب حديثة."
        },
        category: "Technology",
        price: "0.50",
        duration: "8 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/web-development.zip",
        curriculum: [
          "HTML5 iyo CSS3 fundamentals",
          "JavaScript ES6+ programming",
          "React.js component development",
          "Responsive design principles"
        ],
        createdAt: new Date()
      },
      {
        id: "python-basics",
        title: {
          so: "Python Asaasiga",
          en: "Python Basics",
          ar: "أساسيات بايثون"
        },
        description: {
          so: "Baro Python programming oo aad ku dhisi karto applications iyo automation tools.",
          en: "Learn Python programming to build applications and automation tools.",
          ar: "تعلم برمجة بايثون لبناء التطبيقات وأدوات الأتمتة."
        },
        category: "Programming",
        price: "0.50",
        duration: "6 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/python-basics.zip",
        curriculum: [
          "Python syntax and basics",
          "Data structures and algorithms",
          "Object-oriented programming",
          "File handling and APIs"
        ],
        createdAt: new Date()
      },
      {
        id: "ms-office",
        title: {
          so: "Microsoft Office",
          en: "Microsoft Office",
          ar: "مايكروسوفت أوفيس"
        },
        description: {
          so: "Word, Excel, PowerPoint - dhammaan waxaad u baahan tahay xafiiska casriga ah.",
          en: "Word, Excel, PowerPoint - everything you need for modern office work.",
          ar: "Word و Excel و PowerPoint - كل ما تحتاجه للعمل المكتبي الحديث."
        },
        category: "Office",
        price: "0.50",
        duration: "5 saac",
        rating: "4.7",
        image: "https://images.unsplash.com/photo-1586717799252-bd134ad00e26?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/ms-office.zip",
        curriculum: [
          "Microsoft Word advanced features",
          "Excel formulas and data analysis",
          "PowerPoint presentation design",
          "Office integration and collaboration"
        ],
        createdAt: new Date()
      },
      {
        id: "digital-marketing",
        title: {
          so: "Digital Marketing",
          en: "Digital Marketing",
          ar: "التسويق الرقمي"
        },
        description: {
          so: "Social Media, SEO, Google Ads - xirfadaha suuq-geynta casriga ah.",
          en: "Social Media, SEO, Google Ads - modern marketing skills.",
          ar: "وسائل التواصل الاجتماعي وSEO وإعلانات Google - مهارات التسويق الحديثة."
        },
        category: "Marketing",
        price: "0.50",
        duration: "7 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/digital-marketing.zip",
        curriculum: [
          "Social media strategy",
          "Search engine optimization",
          "Google Ads and PPC",
          "Analytics and measurement"
        ],
        createdAt: new Date()
      },
      {
        id: "graphic-design",
        title: {
          so: "Graphic Design",
          en: "Graphic Design",
          ar: "التصميم الجرافيكي"
        },
        description: {
          so: "Canva, Photoshop - samee sawiro qurux badan oo xirfad leh.",
          en: "Canva, Photoshop - create beautiful and professional graphics.",
          ar: "Canva و Photoshop - إنشاء رسومات جميلة واحترافية."
        },
        category: "Design",
        price: "0.50",
        duration: "6 saac",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/graphic-design.zip",
        curriculum: [
          "Design principles and theory",
          "Canva for quick designs",
          "Photoshop advanced techniques",
          "Brand identity design"
        ],
        createdAt: new Date()
      },
      {
        id: "video-editing",
        title: {
          so: "Video Editing",
          en: "Video Editing",
          ar: "تحرير الفيديو"
        },
        description: {
          so: "CapCut, Premiere Pro - samee fiidiyoowyin xirfad leh oo soo jiidaya.",
          en: "CapCut, Premiere Pro - create professional and engaging videos.",
          ar: "CapCut و Premiere Pro - إنشاء مقاطع فيديو احترافية وجذابة."
        },
        category: "Media",
        price: "0.50",
        duration: "7 saac",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
        fileUrl: "/courses/video-editing.zip",
        curriculum: [
          "Video editing fundamentals",
          "CapCut mobile editing",
          "Adobe Premiere Pro workflow",
          "Color grading and audio"
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
