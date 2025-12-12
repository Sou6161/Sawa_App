import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { otpService } from "../../src/services/otp.service";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalizeMobile = (mobile: string): string => {
    return mobile.replace(/[\s\-\(\)]/g, "");
  };

  const handleSendOTP = async () => {
    const normalizedMobile = normalizeMobile(mobile);
    
    if (!normalizedMobile || normalizedMobile.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number");
      return;
    }

    console.log("📱 Sending OTP to:", normalizedMobile);
    setIsSendingOTP(true);
    try {
      const response = await otpService.sendOTP({ mobile: normalizedMobile });
      
      console.log("📥 OTP Response:", JSON.stringify(response, null, 2));
      
      if (response.success) {
        setOtpSent(true);
        Alert.alert(
          "OTP Sent",
          `OTP has been sent to ${normalizedMobile}. Check the backend terminal for the OTP code.`
        );
      } else {
        const errorMsg = response.error?.message || "Failed to send OTP";
        console.error("❌ OTP Error:", errorMsg);
        Alert.alert(
          "Error",
          errorMsg + "\n\nIf this persists, check:\n• Backend server is running\n• Correct API URL configured\n• Check console logs for details"
        );
      }
    } catch (error: any) {
      console.error("❌ OTP Exception:", error);
      const errorMsg = error.message || "Failed to send OTP";
      Alert.alert(
        "Network Error",
        errorMsg + "\n\nTroubleshooting:\n• Ensure backend is running on port 3001\n• Check API URL: http://192.168.1.2:3001\n• Verify same Wi-Fi network\n• Check console logs for details"
      );
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const normalizedMobile = normalizeMobile(mobile);
      const response = await otpService.verifyOTP({
        mobile: normalizedMobile,
        code: otp,
      });

      if (response.success) {
        setIsOTPVerified(true);
        Alert.alert("Success", "Mobile number verified successfully!");
      } else {
        Alert.alert("Error", response.error?.message || "Invalid OTP");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    const normalizedMobile = normalizeMobile(mobile);
    setIsSendingOTP(true);
    try {
      const response = await otpService.resendOTP({ mobile: normalizedMobile });
      
      if (response.success) {
        setOtp("");
        setIsOTPVerified(false);
        Alert.alert(
          "OTP Resent",
          `New OTP has been sent to ${normalizedMobile}. Check the backend terminal.`
        );
      } else {
        Alert.alert("Error", response.error?.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleSignUp = async () => {
    if (!isOTPVerified) {
      Alert.alert("Error", "Please verify your mobile number first");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedMobile = normalizeMobile(mobile);
      await signUp(email.trim(), password, normalizedMobile, name.trim() || undefined);
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileChange = (text: string) => {
    setMobile(text);
    if (!isOTPVerified) {
      setOtpSent(false);
      setIsOTPVerified(false);
      setOtp("");
    }
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleaned);
  };

  const isButtonDisabled = isLoading || !isOTPVerified || !email.trim() || !password.trim() || !confirmPassword.trim();
  const canSendOTP = !isSendingOTP && mobile.trim().length >= 10 && !isOTPVerified;
  const canVerifyOTP = !isVerifyingOTP && otp.length === 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={["#522EE8", "#4527C3", "#381F9E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started with Sawa App</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={styles.mobileContainer}>
                <View
                  style={[
                    styles.inputContainer,
                    styles.mobileInput,
                    isOTPVerified && styles.inputContainerVerified,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="+1234567890"
                    placeholderTextColor="#A3A3A3"
                    value={mobile}
                    onChangeText={handleMobileChange}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoComplete="tel"
                    editable={!isSendingOTP && !isOTPVerified}
                  />
                  {isOTPVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={!canSendOTP}
                  style={[
                    styles.otpButton,
                    !canSendOTP && styles.otpButtonDisabled,
                    isOTPVerified && styles.otpButtonVerified,
                  ]}
                  activeOpacity={0.7}
                >
                  {isSendingOTP ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.otpButtonText}>
                      {isOTPVerified ? "Verified" : "Send OTP"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Include country code (e.g., +1 for US)
              </Text>
              {isOTPVerified && (
                <View style={styles.successMessage}>
                  <View style={styles.successDot} />
                  <Text style={styles.successText}>Mobile number verified</Text>
                </View>
              )}
            </View>

            {otpSent && !isOTPVerified && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Enter OTP sent to {normalizeMobile(mobile)}
                </Text>
                <View style={styles.otpInputContainer}>
                  <View style={[styles.inputContainer, styles.otpInput]}>
                    <TextInput
                      style={styles.otpTextInput}
                      placeholder="000000"
                      placeholderTextColor="#A3A3A3"
                      value={otp}
                      onChangeText={handleOtpChange}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isVerifyingOTP}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleVerifyOTP}
                    disabled={!canVerifyOTP}
                    style={[
                      styles.verifyButton,
                      !canVerifyOTP && styles.verifyButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                  >
                    {isVerifyingOTP ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Check the backend terminal for the OTP code
                </Text>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={isSendingOTP}
                  style={styles.resendButton}
                  activeOpacity={0.7}
                >
                  {isSendingOTP ? (
                    <ActivityIndicator color="#522EE8" size="small" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Name (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#A3A3A3"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#A3A3A3"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#A3A3A3"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeButtonText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A3A3A3"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeButtonText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isButtonDisabled}
              style={[
                styles.primaryButton,
                isButtonDisabled && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {!isOTPVerified ? "Verify Mobile Number First" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/signin")}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#1e1e1e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputContainerVerified: {
    borderColor: "#c4f582",
    backgroundColor: "#EEFCDC",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e1e1e",
    paddingVertical: 14,
  },
  mobileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mobileInput: {
    flex: 1,
    marginRight: 12,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#c4f582",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  verifiedText: {
    color: "#1e1e1e",
    fontSize: 12,
    fontWeight: "700",
  },
  otpButton: {
    backgroundColor: "#522EE8",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  otpButtonDisabled: {
    backgroundColor: "#A3A3A3",
    shadowOpacity: 0,
    elevation: 0,
  },
  otpButtonVerified: {
    backgroundColor: "#c4f582",
    shadowColor: "#c4f582",
  },
  otpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: "#7D7D7D",
    marginTop: 6,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#c4f582",
    marginRight: 8,
  },
  successText: {
    fontSize: 12,
    color: "#47582F",
    fontWeight: "600",
  },
  otpInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpInput: {
    flex: 1,
    marginRight: 12,
  },
  otpTextInput: {
    flex: 1,
    fontSize: 24,
    color: "#1e1e1e",
    paddingVertical: 12,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
  },
  verifyButton: {
    backgroundColor: "#522EE8",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: "#A3A3A3",
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  resendButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#522EE8",
  },
  eyeButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  eyeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#522EE8",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#522EE8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: "#A3A3A3",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#7D7D7D",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#522EE8",
  },
});
