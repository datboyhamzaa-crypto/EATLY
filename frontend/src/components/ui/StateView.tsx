import { Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { Button } from "@/src/components/ui/Button";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function StateView({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: {
  icon: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={colors.brandPrimary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} variant="secondary" testID={testID ? `${testID}-action` : undefined} />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"], paddingHorizontal: spacing.xl, gap: spacing.sm },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.onSurface, textAlign: "center" },
  message: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
  action: { marginTop: spacing.md },
}));
