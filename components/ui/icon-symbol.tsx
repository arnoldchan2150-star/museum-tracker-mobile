import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "book.closed.fill": "menu-book",
  "building.2.fill": "account-balance",
  "person.crop.circle.fill": "account-circle",
  "plus": "add",
  "magnifyingglass": "search",
  "slider.horizontal.3": "tune",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "location.fill": "location-on",
  "calendar": "calendar-today",
  "star.fill": "star",
  "arrow.up.right": "north-east",
  "checkmark": "check",
  "xmark": "close",
} as IconMapping;

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
