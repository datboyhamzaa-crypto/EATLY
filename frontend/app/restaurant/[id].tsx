import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { CustomizeSheet } from "@/src/components/CustomizeSheet";
import { FloatingCart } from "@/src/components/FloatingCart";
import { MenuItemCard } from "@/src/components/MenuItemCard";
import { Chip, OpenPill, Pill } from "@/src/components/ui/Pill";
import { StateView } from "@/src/components/ui/StateView";
import {
  fetchFavoriteIds,
  fetchMenu,
  fetchRestaurant,
  toggleFavorite,
} from "@/src/api/restaurants";
import { useAuth } from "@/src/context/auth-context";
import { useCart } from "@/src/context/cart-context";
import { useToast } from "@/src/context/toast-context";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { MenuItem } from "@/src/types";

const TABS = ["Menu", "Ulasan", "Info"] as const;

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { show } = useToast();
  const { count } = useCart();

  const [tab, setTab] = useState<(typeof TABS)[number]>("Menu");
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);

  const restaurantQuery = useQuery({ queryKey: ["restaurant", id], queryFn: () => fetchRestaurant(id) });
  const menuQuery = useQuery({ queryKey: ["menu", id], queryFn: () => fetchMenu(id) });
  const favIdsQuery = useQuery({ queryKey: ["favoriteIds"], queryFn: fetchFavoriteIds, enabled: !!user });

  const isFavorite = (favIdsQuery.data ?? []).includes(id);

  const favMutation = useMutation({
    mutationFn: () => toggleFavorite(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["favoriteIds"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      show(res.favorited ? "Ditambahkan ke favorit" : "Dihapus dari favorit", "success");
    },
    onError: () => show("Gagal memperbarui favorit", "error"),
  });

  const restaurant = restaurantQuery.data;
  const menu = menuQuery.data ?? [];

  const categories = useMemo(() => {
    const order: string[] = [];
    menu.forEach((m) => {
      if (!order.includes(m.category)) order.push(m.category);
    });
    return order.sort((a, b) => (a === "Paling Populer" ? -1 : b === "Paling Populer" ? 1 : 0));
  }, [menu]);

  const shareRestaurant = async () => {
    if (!restaurant) return;
    try {
      await Share.share({ message: `Cobain ${restaurant.name} di Eatly! ${restaurant.cuisine} · ⭐ ${restaurant.rating}` });
    } catch {
      // dismissed
    }
  };

  if (restaurantQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  if (restaurantQuery.isError || !restaurant) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + spacing.xl }}>
          <StateView
            icon="cloud-offline-outline"
            title="Gagal memuat restoran"
            actionLabel="Coba Lagi"
            onAction={() => restaurantQuery.refetch()}
          />
        </View>
      </View>
    );
  }

  const contentBottom = insets.bottom + (count > 0 ? 96 : spacing.xl);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: contentBottom }}
      >
        {/* Hero + overlapping card */}
        <View>
          <Image source={{ uri: restaurant.hero_image }} style={styles.hero} contentFit="cover" transition={250} />
          <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent"]} style={styles.heroTopFade} />

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Image source={{ uri: restaurant.avatar_image }} style={styles.cardAvatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{restaurant.name}</Text>
                <Text style={styles.cardCuisine}>
                  {restaurant.cuisine} · {restaurant.price_level}
                </Text>
              </View>
              {restaurant.halal ? <Pill label="HALAL" tone="success" /> : null}
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color={colors.star} />
              <Text style={styles.ratingValue}>{restaurant.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({restaurant.review_count.toLocaleString("id-ID")})</Text>
              <View style={{ width: spacing.sm }} />
              <OpenPill open={restaurant.status === "buka"} />
            </View>

            <Text style={styles.description}>{restaurant.description}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {restaurant.tags.map((t) => (
                <Chip key={t} label={t} />
              ))}
            </ScrollView>

            <View style={styles.infoRow}>
              <InfoCell icon="time-outline" label="Estimasi" value={`${restaurant.estimate_min}-${restaurant.estimate_max} mnt`} />
              <View style={styles.infoDivider} />
              <InfoCell icon="location-outline" label="Jarak" value={`${restaurant.distance_km.toFixed(1).replace(".", ",")} km`} />
              <View style={styles.infoDivider} />
              <InfoCell icon="restaurant-outline" label="Kapasitas" value={`${restaurant.capacity_tables} meja`} />
            </View>
          </View>
        </View>

        {/* Sticky tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = tab === t;
            const label = t === "Ulasan" ? `Ulasan (${(restaurant.review_count / 1000).toFixed(1)}k)` : t;
            return (
              <Pressable key={t} onPress={() => setTab(t)} style={styles.tabItem} testID={`tab-${t}`}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
                {active ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {tab === "Menu" ? (
            menuQuery.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
            ) : menu.length === 0 ? (
              <StateView icon="fast-food-outline" title="Menu belum tersedia" />
            ) : (
              categories.map((cat) => (
                <View key={cat} style={styles.menuSection}>
                  <Text style={styles.menuCategory}>{cat}</Text>
                  <View style={styles.menuList}>
                    {menu
                      .filter((m) => m.category === cat)
                      .map((m) => (
                        <MenuItemCard
                          key={m.id}
                          item={m}
                          restaurantId={restaurant.id}
                          restaurantName={restaurant.name}
                          onCustomize={setCustomizeItem}
                        />
                      ))}
                  </View>
                </View>
              ))
            )
          ) : tab === "Ulasan" ? (
            <StateView
              icon="chatbubble-ellipses-outline"
              title="Ulasan segera hadir"
              message="Fitur ulasan pelanggan akan tersedia setelah kamu menyelesaikan pesanan pertama."
            />
          ) : (
            <View style={styles.infoPanel}>
              <InfoLine icon="information-circle-outline" title="Tentang" value={restaurant.description} />
              <InfoLine icon="pricetags-outline" title="Suasana" value={restaurant.tags.join(" · ")} />
              <InfoLine icon="time-outline" title="Estimasi Saji" value={`${restaurant.estimate_min}-${restaurant.estimate_max} menit`} />
              <InfoLine icon="restaurant-outline" title="Kapasitas" value={`${restaurant.capacity_tables} meja dine-in`} />
              <InfoLine icon="navigate-outline" title="Jarak" value={`${restaurant.distance_km.toFixed(1).replace(".", ",")} km dari lokasimu`} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating top buttons */}
      <View style={[styles.topButtons, { top: insets.top + spacing.sm, pointerEvents: "box-none" }]}>
        <CircleButton icon="arrow-back" onPress={() => router.back()} testID="detail-back" />
        <View style={styles.topRight}>
          <CircleButton
            icon={isFavorite ? "heart" : "heart-outline"}
            iconColor={isFavorite ? colors.errorSolid : undefined}
            onPress={() => (user ? favMutation.mutate() : show("Masuk untuk menyimpan favorit", "info"))}
            testID="detail-favorite"
          />
          <CircleButton icon="share-outline" onPress={shareRestaurant} testID="detail-share" />
        </View>
      </View>

      <FloatingCart />

      <CustomizeSheet
        item={customizeItem}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        onClose={() => setCustomizeItem(null)}
      />
    </View>
  );
}

function CircleButton({
  icon,
  onPress,
  iconColor,
  testID,
}: {
  icon: string;
  onPress: () => void;
  iconColor?: string;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.8 }]} testID={testID} hitSlop={6}>
      <Ionicons name={icon} size={20} color={iconColor ?? colors.onSurface} />
    </Pressable>
  );
}

function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoCell}>
      <Ionicons name={icon} size={16} color={colors.brandPrimary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoLine({ icon, title, value }: { icon: string; title: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoLine}>
      <View style={styles.infoLineIcon}>
        <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLineTitle}>{title}</Text>
        <Text style={styles.infoLineValue}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  hero: { width: "100%", height: 280, backgroundColor: colors.surfaceTertiary },
  heroTopFade: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.lg,
    marginTop: -48,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardAvatar: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  cardName: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.onSurface },
  cardCuisine: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
  ratingCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  description: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.onSurfaceTertiary, lineHeight: 20 },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: 2,
  },
  infoCell: { flex: 1, alignItems: "center", gap: 3 },
  infoDivider: { width: 1, height: 34, backgroundColor: colors.border },
  infoLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  infoValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.onSurface },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tabItem: { paddingVertical: spacing.md, marginRight: spacing.xl, alignItems: "center" },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  tabLabelActive: { color: colors.brandPrimary, fontFamily: fonts.bold },
  tabIndicator: { height: 3, width: "100%", backgroundColor: colors.brandPrimary, borderRadius: 2, marginTop: 6, position: "absolute", bottom: 0, left: 0, right: 0 },
  tabContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  menuSection: { marginBottom: spacing.lg, gap: spacing.md },
  menuCategory: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.onSurface },
  menuList: { gap: spacing.md },
  infoPanel: { gap: spacing.md },
  infoLine: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  infoLineIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" },
  infoLineTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
  infoLineValue: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 19 },
  topButtons: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", justifyContent: "space-between" },
  topRight: { flexDirection: "row", gap: spacing.sm },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
}));
