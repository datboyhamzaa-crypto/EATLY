// Plus Jakarta Sans loaded via expo-font (static weights in assets/fonts).
export const fontAssets = {
  Jakarta: require("@/assets/fonts/PJS-400.ttf"),
  JakartaMedium: require("@/assets/fonts/PJS-500.ttf"),
  JakartaSemiBold: require("@/assets/fonts/PJS-600.ttf"),
  JakartaBold: require("@/assets/fonts/PJS-700.ttf"),
  JakartaExtraBold: require("@/assets/fonts/PJS-800.ttf"),
};

export const fonts = {
  regular: "Jakarta",
  medium: "JakartaMedium",
  semibold: "JakartaSemiBold",
  bold: "JakartaBold",
  extrabold: "JakartaExtraBold",
} as const;
