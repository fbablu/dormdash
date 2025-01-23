# DormDash  

DormDash addresses the lack of direct delivery services to student dorms and the inability to pay with Commodore Cash (CC) for food delivery. For instance, a student living in the Village at Vanderbilt who wants to order from I Love Sushi on Elliston Place either has to walk a mile to pick up their food and pay with CC, or use a third-party app that doesn’t support CC or direct dorm delivery. DormDash solves this problem by enabling students to deliver food directly to dorm rooms, all while using CC, making the process faster, more convenient, and student-friendly.  

## Project Scope  
The focus of this project is on direct delivery services, as navigating Vanderbilt's strict VUDACS regulations for CC approval is a time-consuming process. Initially, DormDash will focus on Vanderbilt's campus and its surrounding ToN restaurants (40 restaurants and 31 residential colleges), with plans to expand to other campuses across the U.S. in the future.  

## Tech Stack  

### **Frontend**  

#### **CUSTOM REEM Stack**
- R: React Native with Expo (Frontend development and cross-platform support)
- E: Express.js (Backend framework for RESTful APIs)
- E: EAS (Expo Application Services for deployment pipeline)
- M: MySQL (Relational database for structured data)

##### More Info:
- **React Native with Expo**:  
  - Provides a cross-platform codebase for iOS and Android, reducing development time and complexity.  
  - Simplified testing and deployment pipeline through Expo EAS.  

### **Backend**  
- **TypeScript**:  
  - Ensures type safety and consistency across the full stack.  
  - Reduces runtime errors and integrates well with chosen frameworks.  
- **Express.js**:  
  - Lightweight and flexible framework for RESTful API development.  
  - Supported by robust middleware and extensive documentation.  
- **MySQL**:  
  - A relational database offering strong performance for handling DormDash's structured data needs.  

### **Development Tools**  
- **GitHub Actions**:  
  - Streamlines version control, collaborative development, and implements an automated CI/CD pipeline for testing and deployment.  
- **TestFlight and Google Play Console**:  
  - Enables testing and demoing on various iOS and Android devices before deployment.  

### **Documentation**  
- **Docusaurus**:  
  - Provides clear, organized, and easily editable technical documentation.  
