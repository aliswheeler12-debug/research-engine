export const metadata = {
  title: "EU Research Project Explorer",
  description: "Find active Horizon-funded research projects in Europe for Erasmus+ internships",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0, padding:0}}>{children}</body>
    </html>
  );
}
