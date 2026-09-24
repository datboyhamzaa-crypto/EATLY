import { Text, View } from "react-native";

import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tone = "success" | "warning" | "error" | "neutral" | "brand";

const AVAILABILITY: Record<string, { label: string; tone: Tone; dot: boolean }> = {
  available: { label: "Tersedia", tone: "success", dot: true },
  limited: { label: "Terbatas", tone: "warning", dot: true },
  full: { label: "Penuh", tone: "error", dot: true },
  closed: { label: "Tutup", tone: "error", dot: true },
};

export function StatusPill({
  availability,
  testID,
}: {
  availability: string;
  testID?: string;
}) {
  const cfg = AVAILABILITY[availability] ?? AVAILABILITY.available;
  return <Pill label={cfg.label} tone={cfg.tone} dot={cfg.dot} testID={testID} />;
}

export function OpenPill({ open }: { open: boolean }) {
  return <Pill label={open ? "Buka" : "Tutup"} tone={open ? "success" : "error"} dot />;
}

export function Pill({
  label,
  tone = "neutral",
  dot = false,
  testID,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const bg =
    tone === "success"
      ? colors.success
      : tone === "warning"
        ? colors.warning
        : tone === "error"
          ? colors.error
          : tone === "brand"
            ? colors.brandTertiary
            : colors.surfaceTertiary;
  const fg =
    tone === "success"
      ? colors.onSuccess
      : tone === "warning"
        ? colors.onWarning
        : tone === "error"
          ? colors.onError
          : tone === "brand"
            ? colors.onBrandTertiary
            : colors.onSurfaceTertiary;
  const dotColor =
    tone === "success" ? colors.successSolid : tone === "warning" ? colors.warningSolid : colors.errorSolid;

  return (
    <View testID={testID} style={[styles.pill, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 0.2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignSelf: "flex-start",
  },
  chipLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceTertiary },
}));
