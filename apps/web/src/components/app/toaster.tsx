/** The app's error toast outlet, mounted once in providers.tsx — the mutation
 * hooks call toast.error() on rollback here; views never import it. */
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/lib/theme.store";

/** App-wide toast outlet (sonner). Lives in components/app (not ui/) because it
 * reads the theme store — shadcn's wrapper assumes next-themes. */
export function Toaster(props: ToasterProps) {
  const theme = useTheme((state) => state.theme);
  return <Sonner theme={theme} position="bottom-right" richColors {...props} />;
}
