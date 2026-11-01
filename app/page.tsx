import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">
        ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย
      </h1>
      <Link className="inline-block text-blue-700 underline" href="/help-request">
        แจ้งขอความช่วยเหลือ
      </Link>
    </main>
  );
}
