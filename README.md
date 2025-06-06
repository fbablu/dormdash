<h1 align="center">
  <img src="./assets/icons/splash-icon-dark.png" alt="DormDash Icon" width="250"/>
  <br>
  <a href="https://github.com/fbablu/dormdash">DormDash</a> - <i>Campus food delivery by students, for students</i>
</h1>

<p align="center">
  <a href="https://reactnative.dev/" target="_blank"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://docs.expo.dev/" target="_blank"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://firebase.google.com/" target="_blank"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"></a>
  <a href="https://expressjs.com/" target="_blank"><img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"></a>
</p>

## 🚀 Overview

DormDash addresses the lack of direct delivery services to student dorms and the inability to pay with Commodore Cash (CC) for food delivery. For students living in Vanderbilt dorms who want to order from restaurants like Taco Mama, DormDash enables peer-to-peer delivery directly to dorm rooms while supporting Commodore Cash payments.

## 🎯 Project Scope

DormDash focuses on direct delivery services between Vanderbilt students. Initially targeting Vanderbilt's campus and surrounding Taste of Nashville (ToN) restaurants (40+ restaurants and 31 residential colleges), with future expansion plans to other campuses. The main goal is to foster a community of Peer2Peer deliveries, where students on campus can get convenient deliveries at their favorite campus card restaurants.

## ✨ Key Features

- **🍽️ Restaurant Browsing**: Browse all 40+ Taste of Nashville restaurants
- **🛒 Order Placement**: Place orders with accurate menu information
- **💳 Commodore Cash Integration**: Pay using Vanderbilt's Commodore Cash system
- **🚴 Peer Delivery**: Student-to-student delivery system
- **🔍 Real-time Tracking**: Track delivery status in real-time
- **⭐ Rating System**: Rate both deliverers and restaurants

## 🔧 Tech Stack

### Frontend

- **React Native with Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe code
- **AsyncStorage**: Local data persistence
- **Firebase Auth**: User authentication
- **Firebase Firestore**: Cloud database (with local fallback)

### Backend

- **Express.js**: RESTful API backend
- **MySQL**: Relational database for structured data
- **JSON Web Tokens**: Secure authentication

## 💻 Development Setup

### Prerequisites

- Local Express.js (v14+)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for mobile testing)

### iOS Development Setup

1. Install Xcode with the latest iOS simulator
   - XCode > Settings > Components > Ensure latest iOS version is installed
2. Run the following commands:

```bash
npm install
npx expo prebuild --clean
npx expo run:ios
```

### Android Development Setup

1. Install Android Studio: https://developer.android.com/studio
2. Configure environment variables:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

3. Reload your terminal:

```bash
source ~/.zshrc  # or source ~/.bash_profile
```

4. Run the app:

```bash
npm install
npx expo prebuild --clean
npx expo run:android
```


### Any platform Expo Go setup

1. Install the Expo Go app on the App or Google Play Store
2. After running `npx expo prebuild --clean `, you can run `npx expo start --clear --tunnel` to get a tunneled and secure build running
3. Press 's' to switch to development mode, and scan the QR code. Then click on 'Open with Expo Go' to get started.

   
## 📂 Project Structure

```
dormdash/
├── app/                  # Main application code
│   ├── context/          # React Context providers (Auth, Order, Payment)
│   ├── services/         # API and backend services
│   └── (tabs)/           # Main app tabs (Home, Deliver, Orders, Profile)
├── components/           # Reusable UI components
├── assets/               # Images and static resources
├── data/                 # Local data files
└── server/               # Backend Express.js server
```

## ✉️Support

Contact dormdash.vu@gmail.com for any questions!

## 📜 License

This project is licensed under the [MIT License](LICENSE)
