// app/utils/googleSignIn.ts
// Contributor: @Fardeen Bablu
// Time spent: 15 minutes

import { GoogleSignin } from "@react-native-google-signin/google-signin";

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    iosClientId:
      "895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com",
    webClientId:
      "895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com",
  });
};

export default GoogleSignin;
