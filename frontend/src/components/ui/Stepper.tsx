import * as Haptics from "expo-haptics";
import { Platform, Pressable, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { fonts } from "@/src/fonts";
import { makeStyles, radius, useTheme } from "@/src/theme";

type Props = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
  testID?: string;
};

export function Stepper({ value, onIncrement, onDecrement, size = "md", testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const dim = size === "sm" ? 28 : 32;

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        testID={testID ? `${testID}-dec` : undefined}
        onPress={() => {
          haptic();
          onDecrement();
        }}
        style={({ pressed }) => [styles.btn, { width: dim, height: dim }, pressed && styles.pressed]}
        hitSlop={6}
      >
        <Ionicons name="remove" size={18} color={colors.onBrandPrimary} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        testID={testID ? `${testID}-inc` : undefined}
        onPress={() => {
          haptic();
          onIncrement();
        }}
        style={({ pressed }) => [styles.btn, { width: dim, height: dim }, pressed && styles.pressed]}
        hitSlop={6}
      >
        <Ionicons name="add" size={18} color={colors.onBrandPrimary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  btn: {
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
  value: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface, minWidth: 18, textAlign: "center" },
}));
