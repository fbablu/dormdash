import { doc, setDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase.config";

async function uploadImage(userId: string) {
  // Request permission to access media library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Sorry, we need camera roll permissions to make this work!");
    return;
  }

  // Pick an image
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    const response = await fetch(result.assets[0].uri);
    const blob = await response.blob();

    const userDocRef = doc(db, "users", userId);
    // Create a reference to the file you want to upload
    const storageRef = ref(
      storage,
      `profileImages/${Date.now()}-${result.assets[0].uri.split("/").pop()}`,
    );

    // Upload the file
    uploadBytes(storageRef, blob)
      .then((snapshot) => {
        console.log("Uploaded a blob or file!");
        // Get the download URL
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          console.log("File available at", downloadURL);
          // You can now save this URL to your database
          setDoc(userDocRef, { profileImageUrl: downloadURL }, { merge: true });
        });
      })
      .catch((error) => {
        console.error("Error uploading file: ", error);
      });
  }
}

async function getUserProfileImage(userId: string) {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.profileImageUrl; // Return the image URL
  } else {
    console.log("No such document!");
    return null;
  }
}

export default uploadImage;
