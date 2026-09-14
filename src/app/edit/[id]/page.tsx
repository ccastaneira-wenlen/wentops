import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EditClient from "./EditClient";

export default async function EditWentop({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const wentop = await prisma.wentop.findUnique({
    where: { id: parseInt(unwrappedParams.id, 10) },
    include: { evidences: true }
  });

  if (!wentop) redirect("/my-wentops");

  const isOwner = wentop.userId === (session.user as any).id;
  if (!isOwner || wentop.status !== "ABIERTA") redirect("/my-wentops");

  // We need to pass the initial data to a client component to handle the form
  const serializedWentop = {
    ...wentop,
    date: wentop.date ? wentop.date.toISOString().split('T')[0] : '',
    closingDate: wentop.closingDate ? wentop.closingDate.toISOString().split('T')[0] : '',
  };

  return <EditClient initialData={serializedWentop} />;
}
