import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useCart } from "@/src/context/cart-context";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatRupiah } from "@/src/utils/format";

export function FloatingCart() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { count, subtotal } = useCart();

  if (count === 0) return null;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown}
      style={[styles.wrap, { bottom: insets.bottom + spacing.lg, pointerEvents: "box-none" }]}
    >
      <Pressable
        testID="floating-cart-bar"
        onPress={() => router.push("/cart")}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View style={styles.countCircle}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Lihat Keranjang</Text>
          <Text style={styles.total}>{formatRupiah(subtotal)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={colors.onBrandPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: "absolute", left: spacing.lg, right: spacing.lg },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  countCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.onBrandPrimary },
  label: { fontFamily: fonts.medium, fontSize: 12.5, color: "rgba(255,255,255,0.85)" },
  total: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.onBrandPrimary },
}));
