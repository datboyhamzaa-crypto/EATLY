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

export default function RegisterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const { show } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Lengkapi semua kolom");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message ?? "Gagal mendaftar");
      show(e?.message ?? "Gagal mendaftar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8} testID="register-back">
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>

        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.subtitle}>Daftar untuk mulai memesan di Eatly</Text>

        <View style={styles.form}>
          <TextField
            label="Nama Lengkap"
            icon="person-outline"
            testID="register-name"
            placeholder="Andi Prasetyo"
            value={name}
            onChangeText={setName}
          />
          <TextField
            label="Email"
            icon="mail-outline"
            testID="register-email"
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
            testID="register-password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={setPassword}
            errorText={error}
          />
          <Button label="Daftar" onPress={submit} loading={loading} testID="register-submit" iconRight="arrow-forward" />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Pressable onPress={() => router.replace("/auth/login")} testID="go-login" hitSlop={8}>
            <Text style={styles.footerLink}>Masuk</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.onSurface, marginTop: spacing.xl },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  form: { gap: spacing.lg, marginTop: spacing["2xl"] },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.xl },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brandPrimary },
}));
