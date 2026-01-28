import type { Metadata } from "next";
import "./globals.css";

// Commented out until real font files are uploaded to public/fonts/
// import localFont from "next/font/local";
// const editorial = localFont({
//   src: "../public/fonts/PPEditorialNew-Regular.woff2",
//   variable: "--font-editorial",
// });

export const metadata: Metadata = {
  title: "Erik Goldhar Master",
  description: "Personal website of Erik Goldhar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased selection:bg-white selection:text-black`}
        style={{ "--font-editorial": "serif" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
