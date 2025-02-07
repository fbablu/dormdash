# Resources to get started with here:

- [Expo Documentation](https://docs.expo.dev/)
- [Creating first app / starting project](https://docs.expo.dev/tutorial/create-your-first-app/)
  - ie `npx expo start`

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

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
