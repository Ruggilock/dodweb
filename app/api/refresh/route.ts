import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST() {
  revalidateTag("pretalx", { expire: 0 });
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
