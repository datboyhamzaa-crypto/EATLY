import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StateView } from "@/src/components/ui/StateView";
import { fonts } from "@/src/fonts";
import { makeStyles, spacing } from "@/src/theme";

export default function PesananScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Pesanan</Text>
      </View>
      <View style={styles.body}>
        <StateView
          testID="pesanan-empty"
          icon="receipt-outline"
          title="Belum ada pesanan"
          message="Riwayat pesanan dine-in kamu akan muncul di sini setelah kamu memesan."
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.onSurface },
  body: { flex: 1, justifyContent: "center" },
}));
