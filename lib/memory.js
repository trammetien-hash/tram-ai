import supabase from "./supabase.js";

export async function addMessage(role, content) {
  await supabase.from("messages").insert([
    { role, content }
  ]);
}

export async function getMessages() {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(30);

  return data || [];
}
