import { business } from "@/config/business";

export function PurposeBlock() {
  const { statement, beneficiaryOrganization, donationAmount } = business.purpose;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
        Grown with Purpose
      </p>
      <p className="mt-2 text-xl text-ink">{statement}</p>
      {beneficiaryOrganization && (
        <p className="mt-2 text-ink-soft">
          {donationAmount ? `${donationAmount} of every sale goes to ` : "Proceeds support "}
          {beneficiaryOrganization}.
        </p>
      )}
    </div>
  );
}
