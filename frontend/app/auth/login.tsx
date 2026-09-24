import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { useAuth } from "@/src/context/auth-context";
import { useToast } from "@/src/context/toast-context";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { show } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Isi email dan kata sandi");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message ?? "Gagal masuk");
      show(e?.message ?? "Gagal masuk", "error");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("andi@eatly.com");
    setPassword("password123");
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing["2xl"], paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/images/eatly-logo.png")}
          style={styles.logoImg}
          contentFit="contain"
          testID="login-logo"
        />
        <Text style={styles.tagline}>Temukan & pesan tempat makan favoritmu</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Masuk</Text>
          <Text style={styles.subtitle}>Selamat datang kembali 👋</Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              icon="mail-outline"
              testID="login-email"
              placeholder="nama@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Kata Sandi"
              icon="lock-closed-outline"
              secure
              testID="login-password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              errorText={error}
            />
            <Button label="Masuk" onPress={submit} loading={loading} testID="login-submit" iconRight="arrow-forward" />
            <Pressable onPress={fillDemo} testID="login-demo" style={styles.demo}>
              <Ionicons name="sparkles" size={14} color={colors.onBrandSecondary} />
              <Text style={styles.demoText}>Gunakan akun demo</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun?</Text>
          <Pressable onPress={() => router.push("/auth/register")} testID="go-register" hitSlop={8}>
            <Text style={styles.footerLink}>Daftar</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg, alignItems: "center" },
  logoImg: { width: 210, height: 82, marginBottom: spacing.xs },
  brand: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.onSurface, marginTop: spacing.md },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4, textAlign: "center" },
  card: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.onSurface },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  demo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.sm },
  demoText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onBrandSecondary },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xl },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brandPrimary },
}));
