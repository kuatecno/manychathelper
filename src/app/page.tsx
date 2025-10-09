export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Manychat Helper API</h1>
      <p className="text-xl text-gray-600">Service is running</p>

      <div className="mt-8 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Available Endpoints:</h2>
        <ul className="space-y-2 text-sm">
          <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/helpers/list</code> - List all helpers</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/bookings/availability</code> - Check availability</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/bookings/create</code> - Create booking</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/bookings/list</code> - List user bookings</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/qr/generate</code> - Generate QR code</li>
          <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/qr/validate</code> - Validate QR code</li>
        </ul>
      </div>
    </main>
  );
}
