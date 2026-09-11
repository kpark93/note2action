/** Error toast outlet, mounted once; mutation rollbacks toast here, views never do. */
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/lib/theme.store";

/** Sonner outlet; lives in components/app because it reads our theme store. */
export function Toaster(props: ToasterProps) {
  const theme = useTheme((state) => state.theme);
  return <Sonner theme={theme} position="bottom-right" richColors {...props} />;
}
