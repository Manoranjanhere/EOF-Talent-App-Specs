import { Text, type TextProps, type TextStyle } from "react-native";
import { fonts } from "../theme/typography";

type Variant = "display" | "title" | "subtitle" | "body" | "label" | "meta" | "caption";

const variants: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.serifBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    fontWeight: "700"
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
    fontWeight: "700"
  },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500"
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700"
  },
  meta: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500"
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17
  }
};

export function AppText({
  variant = "body",
  style,
  ...props
}: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[variants[variant], style]} />;
}
