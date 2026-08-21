import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: "orderId dan newStatus diperlukan" }, { status: 400 });
    }

    const validStatuses = ["menunggu", "diproses", "dikirim", "lunas", "dibatalkan"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // ── Auth: wajib login ──────────────────────────────────────────────
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Ownership: pastikan order ini milik bisnis si user ─────────────
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, business_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("id", order.business_id)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Bukan pemilik pesanan ini" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order:", error);
      return NextResponse.json({ error: "Gagal update status pesanan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: data,
      message: `Status pesanan berhasil diubah ke "${newStatus}"`,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
