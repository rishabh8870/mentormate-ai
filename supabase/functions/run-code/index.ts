import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language } = await req.json();
    if (!code || !language) {
      return new Response(JSON.stringify({ error: "Missing code or language" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a code execution engine. Execute the given code mentally and return ONLY the exact output the program would produce when run. Rules:
- Return ONLY the stdout output, nothing else
- If the code has errors, return the exact error message a compiler/interpreter would show
- Do not add explanations, comments, or formatting
- For HTML, describe what would render
- For SQL, show the query result as a table
- Be precise with whitespace and newlines`;

    const userMessage = `Execute this ${language} code and return only the output:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ output: "⚠️ Rate limit exceeded. Try again in a moment." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices[0].message.content;

    return new Response(JSON.stringify({ output }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("run-code error:", error);
    return new Response(JSON.stringify({ output: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
