"use client";

import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EU_COUNTRIES = [
  "Austria","Belgium","Bulgaria","Croatia","Cyprus","Czech Republic",
  "Denmark","Estonia","Finland","France","Germany","Greece","Hungary",
  "Iceland","Ireland","Italy","Latvia","Liechtenstein","Lithuania",
  "Luxembourg","Malta","Netherlands","Norway","Poland","Portugal",
  "Romania","Slovakia","Slovenia","Spain","Sweden","Switzerland"
];

const DEGREE_LEVELS = [
  { value: "all",      label: "All Levels" },
  { value: "bachelor", label: "Bachelor's" },
  { value: "master",   label: "Master's / MSc" },
  { value: "phd",      label: "PhD / Doctoral" },
];

const SYSTEM_PROMPT = `You are a research assistant helping university students find Erasmus+ internship opportunities at European research institutions.

Use your web_search tool to:
1. Search CORDIS (https://cordis.europa.eu) for real Horizon 2020 / Horizon Europe projects in the requested country and field (2019–2025).
2. For each project found, search the host university's staff/people pages to find researcher email addresses.
3. If needed, also search OpenAIRE (https://explore.openaire.eu) for additional projects.

After all searches are done, respond with ONLY a raw JSON object — no markdown, no backticks, no explanations.

Required JSON structure:
{
  "projects": [
    {
      "title": "Full project title",
      "acronym": "ACRONYM",
      "status": "ONGOING",
      "startDate": "2022-01-01",
      "endDate": "2025-12-31",
      "university": "University Name",
      "country": "Germany",
      "department": "Department of Computer Science",
      "description": "2-3 sentences about the project and what an Erasmus+ intern could learn or contribute.",
      "cordisUrl": "https://cordis.europa.eu/project/id/101012345",
      "universityUrl": "https://uni.de/research/project",
      "fundingProgram": "Horizon Europe",
      "totalCost": "€3.5M",
      "researchers": [
        {
          "name": "Prof. Maria Schmidt",
          "role": "Principal Investigator",
          "email": "m.schmidt@uni.de",
          "profileUrl": "https://uni.de/people/schmidt"
        }
      ],
      "topics": ["Topic A", "Topic B"]
    }
  ],
  "searchSummary": "Found X projects in [country] related to [field]."
}

Return 5–8 real projects. Set email to null only if genuinely not findable.`;

// ─── API (artık /api/search proxy'sine gidiyor, Anthropic'e değil) ────────────

async function callAPI(messages) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages // Sadece mesajları gönderiyoruz, gerisini route.js halledecek
    }),
  });

  const data = await res.json(); // Bu satırı ekle veya bul

  // ÖNEMLİ: Veriyi okurken hata almamak için burayı ekle:
  if (data.content && data.content[0]) {
    return data; // Mevcut kodun veriyi buradan okumaya devam etsin
  }
}

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  return res.json();
}

function extractJSON(text) {
  if (!text) return null;
  let s = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();
  const start = s.indexOf("{");
  const end   = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(s.slice(start, end + 1));
}

async function searchProjects({ country, field, degreeLevel, onStatus }) {
  const userMsg = `Find Erasmus+ internship opportunities at universities in ${country} for a student in "${field}".${
    degreeLevel !== "all" ? ` Student level: ${degreeLevel}.` : ""
  } Search CORDIS and university staff pages, then return only JSON.`;

  let messages = [{ role: "user", content: userMsg }];

  for (let turn = 0; turn < 10; turn++) {
    onStatus(turn === 0 ? "Contacting API…" : `Searching (step ${turn})…`);

    const data = await callAPI(messages);

    if (data.stop_reason === "end_turn") {
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const parsed = extractJSON(text);
      if (!parsed) throw new Error(`Could not parse JSON.\n\nRaw response:\n${text.slice(0, 400)}`);
      return parsed;
    }

    if (data.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: data.content });

      const toolResults = data.content
        .filter(b => b.type === "tool_use")
        .map(toolUse => {
          const resultBlock = data.content.find(
            b => b.type === "tool_result" && b.tool_use_id === toolUse.id
          );
          return {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: resultBlock?.content ?? [{ type: "text", text: "Search executed." }],
          };
        });

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    throw new Error(`Unexpected stop_reason: ${data.stop_reason}`);
  }

  throw new Error("Too many search steps. Please try again.");
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#475569", marginBottom: 6, letterSpacing: "0.01em",
};
const inputStyle = {
  padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
  fontSize: 14, background: "white", width: "100%",
  boxSizing: "border-box", color: "#1e293b",
};
function btn(bg, color, extra = {}) {
  return {
    fontSize: 12, padding: "5px 11px", background: bg, color,
    borderRadius: 6, textDecoration: "none", fontWeight: 500,
    border: "none", cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 4, whiteSpace: "nowrap", ...extra,
  };
}

// ─── Academic SVG ─────────────────────────────────────────────────────────────

function AcademicIllustration() {
  return (
    <svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg"
      style={{ width: 180, height: 95, opacity: 0.92, flexShrink: 0 }}>
      <circle cx="50" cy="70" r="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
        const a = (i*30-90)*Math.PI/180;
        return <circle key={i} cx={50+28*Math.cos(a)} cy={70+28*Math.sin(a)} r="2.5" fill="#FFD700" opacity="0.9"/>;
      })}
      <circle cx="50" cy="70" r="14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"/>
      <line x1="61" y1="81" x2="72" y2="92" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round"/>
      <rect x="95" y="28" width="58" height="72" rx="5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
      {[42,54,66,78,90].map((y,i) => (
        <line key={i} x1="104" y1={y} x2={i===0?140:145} y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      ))}
      <polyline points="107,35 112,41 122,31" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="192" cy="42" r="10" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="192" cy="39" r="4" fill="rgba(255,255,255,0.7)"/>
      <path d="M183 52 Q192 46 201 52" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="153" y1="64" x2="175" y2="64" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3"/>
      <line x1="86" y1="64" x2="95" y2="64" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3"/>
      <rect x="175" y="75" width="36" height="24" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"/>
      <polyline points="175,75 193,89 211,75" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.4)"/>
        </marker>
      </defs>
      <path d="M192 54 L192 73" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#arr)"/>
    </svg>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ status }) {
  const on = status === "ONGOING";
  return (
    <span style={{
      fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:"3px 9px",
      borderRadius:20, background: on?"#dcfce7":"#dbeafe", color: on?"#15803d":"#1d4ed8",
      textTransform:"uppercase", flexShrink:0,
    }}>
      {on ? "● Ongoing" : "✓ Completed"}
    </span>
  );
}

function ResearcherRow({ r }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(r.email).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"10px 14px", background:"#f8fafc", borderRadius:8,
      marginBottom:6, border:"1px solid #f1f5f9", flexWrap:"wrap", gap:8,
    }}>
      <div>
        <div style={{fontSize:14, fontWeight:600, color:"#1e293b"}}>{r.name}</div>
        <div style={{fontSize:12, color:"#64748b"}}>{r.role}</div>
      </div>
      <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
        {r.email ? (
          <>
            <a href={`mailto:${r.email}`} style={btn("#1e3a5f","white")}>✉ {r.email}</a>
            <button onClick={copy} style={btn(copied?"#16a34a":"#e2e8f0", copied?"white":"#374151")}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </>
        ) : (
          <span style={{fontSize:12, color:"#94a3b8", fontStyle:"italic"}}>Email not public</span>
        )}
        {r.profileUrl && (
          <a href={r.profileUrl} target="_blank" rel="noopener noreferrer" style={btn("#f1f5f9","#374151")}>
            🔗 Profile
          </a>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, expanded, onToggle }) {
  const years = [project.startDate?.slice(0,4), project.endDate?.slice(0,4)].filter(Boolean).join("–");
  return (
    <div style={{
      background:"white", borderRadius:12, marginBottom:10,
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1px solid #f1f5f9", overflow:"hidden",
    }}>
      <div onClick={onToggle} style={{padding:"16px 20px", cursor:"pointer"}}>
        <div style={{display:"flex", justifyContent:"space-between", gap:12, alignItems:"flex-start"}}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", marginBottom:6}}>
              <Badge status={project.status}/>
              {project.acronym && <span style={{fontSize:11, color:"#94a3b8", fontWeight:600}}>[{project.acronym}]</span>}
              {years && <span style={{fontSize:11, color:"#94a3b8"}}>{years}</span>}
            </div>
            <h3 style={{margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#0f172a", lineHeight:1.4}}>
              {project.title}
            </h3>
            <div style={{fontSize:13, color:"#64748b"}}>
              🏛 {project.university}{project.department ? ` · ${project.department}` : ""}
            </div>
          </div>
          <span style={{color:"#cbd5e1", fontSize:16, flexShrink:0}}>{expanded?"▲":"▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{padding:"0 20px 20px", borderTop:"1px solid #f8fafc"}}>
          <p style={{margin:"14px 0 12px", fontSize:14, color:"#334155", lineHeight:1.7}}>
            {project.description}
          </p>
          {project.topics?.length > 0 && (
            <div style={{display:"flex", flexWrap:"wrap", gap:5, marginBottom:16}}>
              {project.topics.map((t,i) => (
                <span key={i} style={{fontSize:11, padding:"3px 9px", background:"#f1f5f9", color:"#475569", borderRadius:20, fontWeight:500}}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {project.researchers?.length > 0 && (
            <div style={{marginBottom:16}}>
              <h4 style={{margin:"0 0 8px", fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em"}}>
                Research Team
              </h4>
              {project.researchers.map((r,i) => <ResearcherRow key={i} r={r}/>)}
            </div>
          )}
          <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
            {project.cordisUrl && (
              <a href={project.cordisUrl} target="_blank" rel="noopener noreferrer" style={btn("#eff6ff","#2563eb")}>
                📋 CORDIS Project Page
              </a>
            )}
            {project.universityUrl && (
              <a href={project.universityUrl} target="_blank" rel="noopener noreferrer" style={btn("#f0fdf4","#16a34a")}>
                🏛 University Page
              </a>
            )}
          </div>
          {(project.totalCost || project.fundingProgram) && (
            <div style={{marginTop:12, fontSize:11, color:"#94a3b8"}}>
              {project.fundingProgram}{project.totalCost ? ` · Budget: ${project.totalCost}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner({ status }) {
  return (
    <div style={{textAlign:"center", padding:"40px 0", color:"#64748b"}}>
      <div style={{
        width:44, height:44, margin:"0 auto 18px",
        border:"4px solid #e2e8f0", borderTop:"4px solid #1e3a5f",
        borderRadius:"50%", animation:"spin 0.9s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{fontSize:14, fontWeight:500}}>{status}</div>
      <div style={{fontSize:12, color:"#94a3b8", marginTop:5}}>
        Searching CORDIS, university pages and OpenAIRE — this takes 30–60 seconds.
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [country,  setCountry]  = useState("");
  const [field,    setField]    = useState("");
  const [degree,   setDegree]   = useState("all");
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState("");
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(null);

  const canSearch = !loading && country && field.trim().length > 1;

  const handleSearch = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true); setError(null); setResults(null); setExpanded(null);
    try {
      const data = await searchProjects({
        country, field: field.trim(), degreeLevel: degree,
        onStatus: setStatus,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false); setStatus("");
    }
  }, [canSearch, country, field, degree]);

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", fontFamily:"'Inter',system-ui,-apple-system,sans-serif"}}>

      <div style={{background:"linear-gradient(135deg,#1e3a5f 0%,#1e4976 100%)", color:"white", padding:"28px 24px 32px"}}>
        <div style={{maxWidth:820, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap:"wrap"}}>
          <div style={{flex:1, minWidth:220}}>
            <div style={{fontSize:11, fontWeight:600, letterSpacing:"0.12em", opacity:0.6, textTransform:"uppercase", marginBottom:8}}>
              EU Research Project Explorer
            </div>
            <h1 style={{margin:"0 0 8px", fontSize:26, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.2}}>
              Find Active Research<br/>Projects in Europe
            </h1>
            <p style={{margin:"0 0 18px", fontSize:13, opacity:0.7, lineHeight:1.6}}>
              Search CORDIS and OpenAIRE for Horizon-funded projects — see who&apos;s leading them and how to reach them.
            </p>
            <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>
              {["✉ Researcher emails","📋 CORDIS verified","🎓 Erasmus+ internship ready"].map((t,i)=>(
                <span key={i} style={{fontSize:12, opacity:0.8, fontWeight:500}}>{t}</span>
              ))}
            </div>
          </div>
          <AcademicIllustration/>
        </div>
      </div>

      <div style={{maxWidth:820, margin:"0 auto", padding:"28px 20px"}}>
        <div style={{background:"white", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.07)", marginBottom:24}}>
          <h2 style={{margin:"0 0 18px", fontSize:15, fontWeight:700, color:"#1e3a5f"}}>
            Search for research opportunities
          </h2>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div>
              <label style={labelStyle}>Country *</label>
              <select value={country} onChange={e=>setCountry(e.target.value)} style={inputStyle}>
                <option value="">Select country…</option>
                {EU_COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Degree Level</label>
              <select value={degree} onChange={e=>setDegree(e.target.value)} style={inputStyle}>
                {DEGREE_LEVELS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginTop:14}}>
            <label style={labelStyle}>Research Field / Department *</label>
            <input
              type="text" value={field}
              onChange={e=>setField(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              placeholder="e.g. Machine Learning, Renewable Energy, Biomedical Engineering…"
              style={{...inputStyle, width:"100%"}}
            />
          </div>
          <button
            onClick={handleSearch} disabled={!canSearch}
            style={{
              marginTop:18, width:"100%", padding:"13px",
              background: canSearch?"linear-gradient(135deg,#1e3a5f,#1e4976)":"#e2e8f0",
              color: canSearch?"white":"#94a3b8",
              border:"none", borderRadius:10, fontSize:15, fontWeight:700,
              cursor: canSearch?"pointer":"not-allowed",
            }}
          >
            {loading ? "Searching…" : "Search Projects"}
          </button>
        </div>

        {loading && <Spinner status={status}/>}

        {error && (
          <div style={{padding:16, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#dc2626", fontSize:13, marginBottom:16, whiteSpace:"pre-wrap", wordBreak:"break-word"}}>
            ❌ {error}
          </div>
        )}

        {results && !loading && (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:12, flexWrap:"wrap"}}>
              <div>
                <h2 style={{margin:0, fontSize:18, fontWeight:800, color:"#0f172a"}}>
                  {results.projects?.length ?? 0} Projects Found
                </h2>
                <p style={{margin:"4px 0 0", fontSize:13, color:"#64748b"}}>{results.searchSummary}</p>
              </div>
              <button onClick={()=>{setResults(null);setExpanded(null);}} style={btn("#f1f5f9","#475569",{padding:"7px 14px",fontSize:13})}>
                ← New Search
              </button>
            </div>
            <div style={{fontSize:12, color:"#94a3b8", marginBottom:12}}>
              💡 Click a card to expand researchers and contact details.
            </div>
            {results.projects?.length === 0 && (
              <div style={{textAlign:"center", padding:40, color:"#94a3b8"}}>
                <div style={{fontSize:32}}>🔍</div>
                <div style={{marginTop:8}}>No projects found. Try a broader field or different country.</div>
              </div>
            )}
            {results.projects?.map((p,i)=>(
              <ProjectCard key={i} project={p} expanded={expanded===i} onToggle={()=>setExpanded(expanded===i?null:i)}/>
            ))}
            <div style={{marginTop:20, padding:14, background:"#fffbeb", border:"1px solid #fed7aa", borderRadius:10, fontSize:12, color:"#92400e", lineHeight:1.7}}>
              📌 <strong>Next step:</strong> Click &quot;CORDIS Project Page&quot; to verify the project, then email the researcher — mention you found the project via CORDIS and are seeking an <strong>Erasmus+ traineeship</strong> placement.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
