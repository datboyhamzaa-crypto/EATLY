import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Reel } from "@/src/types";
import { formatCount } from "@/src/utils/format";

export function ReelCard({ reel }: { reel: Reel }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      testID={`reel-card-${reel.id}`}
      onPress={() => router.push(`/restaurant/${reel.restaurant_id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.media}>
        <Image source={{ uri: reel.thumb }} style={styles.image} contentFit="cover" transition={200} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{reel.duration}</Text>
        </View>
        <View style={styles.playBtn}>
          <Ionicons name="play" size={22} color={colors.onSurface} />
        </View>
        <View style={styles.viewsBadge}>
          <Ionicons name="play" size={10} color="#FFFFFF" />
          <Text style={styles.viewsText}>{formatCount(reel.views)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.userRow}>
          <Image source={{ uri: reel.user_avatar }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {reel.user_name}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              {reel.user_handle}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={colors.star} />
            <Text style={styles.ratingText}>{reel.rating}</Text>
          </View>
        </View>
        <Text style={styles.caption} numberOfLines={2}>
          {reel.caption}
        </Text>
        <View style={styles.restoRow}>
          <Ionicons name="location" size={12} color={colors.brandPrimary} />
          <Text style={styles.restoName} numberOfLines={1}>
            {reel.restaurant_name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    width: 250,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pressed: { opacity: 0.95 },
  media: { height: 190, backgroundColor: colors.surfaceTertiary },
  image: { width: "100%", height: "100%" },
  durationBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 10.5 },
  playBtn: {
    position: "absolute",
    alignSelf: "center",
    top: "42%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewsBadge: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  viewsText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 10.5 },
  body: { padding: spacing.md, gap: spacing.sm },
  userRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceTertiary },
  userName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface },
  handle: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.muted },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontFamily: fonts.bold, fontSize: 12, color: colors.onSurface },
  caption: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurface, lineHeight: 18 },
  restoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandSecondary,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  restoName: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.onBrandSecondary, maxWidth: 170 },
}));
