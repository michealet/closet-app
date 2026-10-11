import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AddClothingForm } from "@/features/clothing/add-clothing-form";

export const metadata: Metadata = { title: "Add clothing" };

export default function AddClothingPage() {
  return (
    <>
      <PageHeader title="Add clothing" />
      <AddClothingForm />
    </>
  );
}
