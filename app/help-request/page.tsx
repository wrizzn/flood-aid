import HelpRequestForm from "@/components/help-request-form";

export default function HelpRequestPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:p-8">
      <h1 className="text-3xl leading-relaxed font-bold">แจ้งขอความช่วยเหลือ</h1>
      <HelpRequestForm />
    </main>
  );
}
