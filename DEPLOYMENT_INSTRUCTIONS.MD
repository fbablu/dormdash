# These instructions are also listed in the README.md

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

5. To run the app under Expo Go:

```bash
npm i
npx expo prebuild --clean
npx expo start --clear --tunnel
Press \'s\' on keyboard
Scan the QR Code
Select \'Open in Expo Go\'
```

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
