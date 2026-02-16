import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, courseName, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (action === "parse") {
      systemPrompt = `You are an expert syllabus parser for university courses. Extract structured data from the syllabus text provided. Be thorough and accurate.`;
      tools = [{
        type: "function",
        function: {
          name: "extract_syllabus_data",
          description: "Extract structured syllabus data including dates, grading weights, and readings.",
          parameters: {
            type: "object",
            properties: {
              dates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    date: { type: "string", description: "ISO date format YYYY-MM-DD" },
                    event_type: { type: "string", enum: ["assignment", "midterm", "final", "quiz", "project", "other"] },
                    is_high_stakes: { type: "boolean" }
                  },
                  required: ["title", "event_type", "is_high_stakes"]
                }
              },
              grading_weights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    weight: { type: "number", description: "Percentage weight, e.g. 30 for 30%" }
                  },
                  required: ["category", "weight"]
                }
              },
              readings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    author: { type: "string" },
                    chapter: { type: "string" },
                    due_date: { type: "string", description: "ISO date format YYYY-MM-DD if available" }
                  },
                  required: ["title"]
                }
              }
            },
            required: ["dates", "grading_weights", "readings"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "extract_syllabus_data" } };
    } else if (action === "study_architect") {
      systemPrompt = `You are an expert academic strategist. Given syllabus data for "${courseName}", generate:
1. Assignment effort categorization (low/medium/high/critical based on grade weight %)
2. A 15-week study roadmap with weekly focus areas and tasks
3. Relevant learning resources (YouTube playlists, MIT OCW, Khan Academy, academic databases)

Be specific with resource URLs when possible. For YouTube, suggest search terms. For MIT OCW, suggest actual course pages.`;
      tools = [{
        type: "function",
        function: {
          name: "generate_study_plan",
          description: "Generate study roadmap, effort categorization, and resource suggestions.",
          parameters: {
            type: "object",
            properties: {
              roadmap: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    week_number: { type: "number" },
                    focus_area: { type: "string" },
                    tasks: { type: "array", items: { type: "string" } },
                    effort_level: { type: "string", enum: ["low", "medium", "high", "critical"] }
                  },
                  required: ["week_number", "focus_area", "tasks", "effort_level"]
                }
              },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                    resource_type: { type: "string", enum: ["video", "article", "database", "course", "book"] },
                    source: { type: "string" },
                    topic: { type: "string" }
                  },
                  required: ["title", "resource_type", "source", "topic"]
                }
              }
            },
            required: ["roadmap", "resources"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_study_plan" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-syllabus error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
