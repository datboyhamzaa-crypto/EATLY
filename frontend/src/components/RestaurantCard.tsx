import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { StatusPill } from "@/src/components/ui/Pill";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Restaurant } from "@/src/types";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      testID={`restaurant-card-${restaurant.id}`}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: restaurant.avatar_image }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.distance}>{restaurant.distance_km.toFixed(1).replace(".", ",")} km</Text>
        </View>
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({restaurant.review_count})</Text>
          <Text style={styles.dotSep}>·</Text>
          <Ionicons name="time-outline" size={13} color={colors.muted} />
          <Text style={styles.est}>
            {restaurant.estimate_min}-{restaurant.estimate_max} mnt
          </Text>
          <View style={{ flex: 1 }} />
          <StatusPill availability={restaurant.availability} />
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  image: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  info: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 15.5, color: colors.onSurface },
  distance: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  cuisine: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  rating: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.onSurface },
  reviews: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  dotSep: { color: colors.muted, marginHorizontal: 2, fontSize: 12 },
  est: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
}));
