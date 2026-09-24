import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RestaurantCard } from "@/src/components/RestaurantCard";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { StateView } from "@/src/components/ui/StateView";
import { fetchFavorites } from "@/src/api/restaurants";
import { fonts } from "@/src/fonts";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function FavoritScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const favQuery = useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites });
  const favorites = favQuery.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Favorit</Text>
        <Text style={styles.subtitle}>{favorites.length} restoran tersimpan</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing["2xl"] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={favQuery.isRefetching} onRefresh={() => favQuery.refetch()} tintColor={colors.brandPrimary} />
        }
      >
        {favQuery.isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 88, borderRadius: radius.lg, marginBottom: spacing.md }} />)
        ) : favQuery.isError ? (
          <StateView icon="cloud-offline-outline" title="Gagal memuat favorit" actionLabel="Coba Lagi" onAction={() => favQuery.refetch()} />
        ) : favorites.length === 0 ? (
          <StateView
            testID="favorit-empty"
            icon="heart-outline"
            title="Belum ada favorit"
            message="Simpan restoran favoritmu dengan menekan ikon hati di halaman restoran."
            actionLabel="Jelajahi Restoran"
            onAction={() => router.push("/(tabs)")}
          />
        ) : (
          <View style={styles.list}>
            {favorites.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.onSurface },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  content: { padding: spacing.lg },
  list: { gap: spacing.md },
}));
