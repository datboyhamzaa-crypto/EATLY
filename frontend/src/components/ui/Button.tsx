import { ActivityIndicator, Pressable, Text, View, ViewStyle } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Variant = "primary" | "secondary" | "ghost" | "dark";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  testID?: string;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  iconRight,
  fullWidth = true,
  testID,
  style,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
        ? styles.secondary
        : variant === "dark"
          ? styles.dark
          : styles.ghost;
  const fg =
    variant === "primary" || variant === "dark"
      ? colors.onBrandPrimary
      : variant === "secondary"
        ? colors.onBrandSecondary
        : colors.onSurface;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        bg,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
          {iconRight ? <Ionicons name={iconRight} size={18} color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  fullWidth: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontFamily: fonts.bold, fontSize: 16 },
  primary: { backgroundColor: colors.brandPrimary },
  secondary: { backgroundColor: colors.brandSecondary },
  dark: { backgroundColor: colors.surfaceInverse },
  ghost: { backgroundColor: "transparent" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
}));
