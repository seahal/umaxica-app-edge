/** @jsxImportSource hono/jsx */

type FooterProps = {
  brandName?: string;
};

export function Footer({ brandName = 'UMAXICA' }: FooterProps) {
  const currentYear = new Date().getUTCFullYear();
  return (
    <footer class="bg-white mt-auto shadow-sm bg-gray-50">
      <div class="max-w-7xl mx-auto px-8 py-8">
        <p class="text-center text-sm text-gray-600">
          &copy; {currentYear} {brandName}
        </p>
      </div>
    </footer>
  );
}
