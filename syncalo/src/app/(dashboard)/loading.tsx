export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-4 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
