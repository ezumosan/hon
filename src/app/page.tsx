export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-4 text-3xl font-bold">📚 蔵書管理システム</h1>
      <p className="mb-8 text-gray-600">
        バーコードスキャンまたは手動入力で、家にある本を簡単に管理できます。
      </p>
      <div className="flex gap-4">
        <a
          href="/books/scan"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          📷 バーコードスキャン
        </a>
        <a
          href="/books/new"
          className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100"
        >
          ✏️ 手動で登録
        </a>
      </div>
    </div>
  );
}
