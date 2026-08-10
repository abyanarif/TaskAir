import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Airlangga TaskFlow - HEBAT Elearning Assignment Tracker",
  description:
    "Aplikasi pemantau tugas HEBAT Elearning untuk mahasiswa Universitas Airlangga. Bebas ribet, aman, dan modern.",
  keywords: ["Airlangga TaskFlow", "UNAIR", "HEBAT Elearning", "Cybercampus", "Universitas Airlangga"],
  authors: [{ name: "Airlangga TaskFlow Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-slate-950"
      >
        {children}
      </body>
    </html>
  );
}
