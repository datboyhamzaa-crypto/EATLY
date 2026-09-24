import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Props = TextInputProps & {
  label: string;
  icon?: string;
  secure?: boolean;
  errorText?: string;
  testID?: string;
};

export function TextField({ label, icon, secure, errorText, testID, ...rest }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.focused, !!errorText && styles.errorField]}>
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.brandPrimary : colors.muted} /> : null}
        <TextInput
          testID={testID}
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} testID={`${testID}-toggle`}>
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  focused: { borderColor: colors.brandPrimary },
  errorField: { borderColor: colors.errorSolid },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.onSurface, height: "100%" },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: colors.errorSolid },
}));
