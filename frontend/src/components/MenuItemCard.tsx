import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { Stepper } from "@/src/components/ui/Stepper";
import { useCart } from "@/src/context/cart-context";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { MenuItem } from "@/src/types";
import { formatRupiah } from "@/src/utils/format";

export function MenuItemCard({
  item,
  restaurantId,
  restaurantName,
  onCustomize,
}: {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  onCustomize: (item: MenuItem) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { items, addItem, incrementLine, decrementLine } = useCart();

  const hasOptions = item.options.length > 0;
  const plainLine = items.find(
    (i) => i.menuItemId === item.id && i.options.length === 0 && i.notes === "",
  );
  const totalQty = items
    .filter((i) => i.menuItemId === item.id)
    .reduce((s, i) => s + i.quantity, 0);

  const addPlain = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      lineId: "",
      restaurantId,
      restaurantName,
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      unitPrice: item.price,
      quantity: 1,
      options: [],
      notes: "",
    });
  };

  const handleAdd = () => {
    if (hasOptions) onCustomize(item);
    else addPlain();
  };

  return (
    <View style={[styles.card, !item.available && styles.cardDisabled]} testID={`menu-item-${item.id}`}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        {item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 2).map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.price}>{formatRupiah(item.price)}</Text>
      </View>

      <View style={styles.right}>
        <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={200} />

        <View style={styles.control}>
          {!item.available ? (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>Habis</Text>
            </View>
          ) : plainLine && !hasOptions ? (
            <View style={styles.stepperWrap}>
              <Stepper
                testID={`menu-stepper-${item.id}`}
                value={plainLine.quantity}
                onIncrement={() => incrementLine(plainLine.lineId)}
                onDecrement={() => decrementLine(plainLine.lineId)}
                size="sm"
              />
            </View>
          ) : (
            <Pressable
              testID={`menu-add-${item.id}`}
              onPress={handleAdd}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.addText}>{totalQty > 0 ? `Tambah · ${totalQty}` : "Tambah"}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardDisabled: { opacity: 0.6 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface },
  desc: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, lineHeight: 17 },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  tag: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.onSurfaceTertiary },
  price: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.onSurface, marginTop: 4 },
  right: { width: 104, alignItems: "center" },
  image: { width: 104, height: 104, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  control: { marginTop: -18, minHeight: 34, justifyContent: "center" },
  stepperWrap: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
  addText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.onBrandPrimary },
  soldOut: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  soldOutText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.muted },
}));
