/**
 * Metadata used to live here because the guide page was a client component.
 * It is a server component now and generates its own, in the language the
 * visitor asked for, so this only passes children through.
 */
export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
