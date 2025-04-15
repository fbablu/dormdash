// app/login.tsx
// Contributors: @Fardeen Bablu
// Time spent: 1.5 hours

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { Color } from "@/GlobalStyles";

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Test account buttons for demo purposes
  const loginAsOwner = () => {
    setEmail("blenzbowls.vu@gmail.com");
    setPassword("12345678");
  };

  const loginAsUser = () => {
    setEmail("john.doe@vanderbilt.edu");
    setPassword("123456789");
  };

  const handleLogin = async () => {
    console.log("Login attempt with:", email, password.replace(/./g, "*"));

    setIsLoading(true);
    try {
      console.log("Calling signIn function");
      await signIn(email, password);
      console.log("SignIn function completed successfully");
      // On success, the AuthContext will handle navigation
    } catch (error: any) {
      console.error("Login error:", error);

      // Provide more specific error messages
      let errorMessage = error.message || "Failed to login";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        errorMessage.includes("Invalid email or password")
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Too many failed login attempts. Please try again later or reset your password.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to reset your password",
      );
      return;
    }

    setIsResetLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        "Password Reset Email Sent",
        "Check your inbox for instructions to reset your password",
      );
    } catch (error: any) {
      console.error("Reset password error:", error);

      // Provide more specific error messages
      let errorMessage = error.message || "Failed to send reset email";
      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome Back</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          <Text style={styles.subtitle}>Sign in to your DormDash account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.visibilityToggle}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            disabled={isResetLoading}
          >
            {isResetLoading ? (
              <ActivityIndicator size="small" color={Color.colorBurlywood} />
            ) : (
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            )}
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Demo Account Buttons */}
          <View style={styles.demoAccountsContainer}>
            <Text style={styles.demoAccountsTitle}>Demo Accounts:</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={[styles.demoButton, styles.ownerButton]}
                onPress={() => {
                  loginAsOwner();
                  // Automatically log in when pressing the demo button
                  setTimeout(() => handleLogin(), 500);
                }}
              >
                <Text style={styles.demoButtonText}>Sign in as Owner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoButton, styles.userButton]}
                onPress={() => {
                  loginAsUser();
                  // Automatically log in when pressing the demo button
                  setTimeout(() => handleLogin(), 500);
                }}
              >
                <Text style={styles.demoButtonText}>Sign in as User</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  visibilityToggle: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Color.colorBurlywood,
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: Color.colorBurlywood,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#666",
  },
  registerLink: {
    fontSize: 16,
    color: Color.colorBurlywood,
    fontWeight: "bold",
    marginLeft: 5,
  },
  demoAccountsContainer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 20,
  },
  demoAccountsTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  demoButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  demoButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  ownerButton: {
    backgroundColor: "#4CAF50",
  },
  userButton: {
    backgroundColor: "#2196F3",
  },
  demoButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
