import { createClient } from "npm:@supabase/supabase-js@2";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
const ALLOWED=new Set(["https://jazaineam1.github.io"]);
function origin(req:Request){const o=req.headers.get("origin");if(!o)return"";if(ALLOWED.has(o)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o))return o;return null}
function headers(req:Request){const o=origin(req);return{"Access-Control-Allow-Origin":o||"https://jazaineam1.github.io","Access-Control-Allow-Headers":"authorization,content-type","Access-Control-Allow-Methods":"GET,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"}}
const out=(r:Request,x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:headers(r)});
function bearer(r:Request){const h=r.headers.get("authorization")||"";return h.toLowerCase().startsWith("bearer ")?h.slice(7).trim():""}
async function sha256(s:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function current(req:Request){const t=bearer(req);if(!t)return null;const h=await sha256(t);const {data:s}=await db.from("lms_auth_sessions").select("id,user_id,expires_at,persistent").eq("token_hash",h).is("revoked_at",null).maybeSingle();if(!s)return null;if(!s.persistent&&(!s.expires_at||new Date(s.expires_at).getTime()<=Date.now()))return null;const {data:u}=await db.from("lms_users").select("id,active,role,display_name,username,email").eq("id",s.user_id).eq("active",true).maybeSingle();return u?{session:s,user:u}:null}
const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
const avg=(xs:number[])=>xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*100)/100:null;
Deno.serve(async req=>{
 if(origin(req)===null)return out(req,{error:"Origen no permitido"},403);
 if(req.method==="OPTIONS")return new Response("ok",{headers:headers(req)});
 if(req.method!=="GET")return out(req,{error:"Método no permitido"},405);
 const ctx=await current(req);if(!ctx)return out(req,{error:"Sesión requerida"},401);
 if(!["teacher","admin"].includes(String(ctx.user.role)))return out(req,{error:"Solo docente"},403);
 const {data:run}=await db.from("lms_course_runs").select("id,course_code,code,title,starts_on,ends_on").eq("active",true).eq("course_code","andesdb").order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(!run)return out(req,{ok:true,run:null,enrolled:0,submitted:0,domains:{},errors:{},rows:[]});
 const {data:enr}=await db.from("lms_enrollments").select("user_id").eq("course_code",run.course_code).eq("role","student").eq("status","active");
 const {data:events,error}=await db.from("lms_events").select("user_id,metadata,created_at,client_at").eq("course_run_id",run.id).eq("session_number",16).eq("activity_code","s16-dp900").eq("event_type","challenge_completed").order("created_at",{ascending:true});
 if(error)return out(req,{error:error.message},500);
 const latest=new Map<string,any>();for(const e of events||[])latest.set(String(e.user_id),e);
 const ids=[...latest.keys()];
 const {data:users}=ids.length?await db.from("lms_users").select("id,display_name,username,email").in("id",ids):{data:[] as any[]};
 const um=new Map((users||[]).map((u:any)=>[String(u.id),u]));
 const domains=["core","rel","nonrel","ana"], domainAgg:any=Object.fromEntries(domains.map(d=>[d,{correct:0,total:0,students:0,pcts:[] as number[]}]));
 const errors:any={C:0,T:0,L:0,U:0},weak:any={core:0,rel:0,nonrel:0,ana:0},survey:any={rel:[],sql:[],transfer:[],next:[]},official:any={guide:0,practice:0,sandbox:0,schedule:0},portfolio:any={};
 const conf:number[]=[],rows:any[]=[];let highConfidenceErrors=0,postSum=0,voucherKnown=0,targetKnown=0,targetAfterVoucher=0;
 for(const [uid,e] of latest.entries()){
   const m=e.metadata||{},scores=m.scores||{},errs=m.errors||{},sv=m.survey||{},off=m.official_exploration||{},pf=m.portfolio||{};
   for(const d of domains){const s=scores[d]||{},c=num(s.correct),t=num(s.total);if(t>0){domainAgg[d].correct+=c;domainAgg[d].total+=t;domainAgg[d].students++;domainAgg[d].pcts.push(c/t*100)}}
   for(const k of ["C","T","L","U"])errors[k]+=num(errs[k]);
   if(weak[m.weakest_domain]!==undefined)weak[m.weakest_domain]++;
   if(Number.isFinite(Number(m.confidence?.average)))conf.push(Number(m.confidence.average));highConfidenceErrors+=num(m.confidence?.high_confidence_errors);
   postSum+=num(m.post_s1_completed);
   if(m.voucher_expiry)voucherKnown++;if(m.exam_target)targetKnown++;if(m.voucher_expiry&&m.exam_target&&String(m.exam_target)>String(m.voucher_expiry))targetAfterVoucher++;
   for(const k of Object.keys(official))if(off[k])official[k]++;
   for(const [k,v] of Object.entries(pf))if(v)portfolio[k]=(portfolio[k]||0)+1;
   for(const k of Object.keys(survey))if(Number.isFinite(Number(sv[k])))survey[k].push(Number(sv[k]));
   const u=um.get(uid)||{};rows.push({user_id:uid,display_name:u.display_name||u.username||uid,email:u.email||"",overall:m.overall||null,scores,errors:errs,weakest_domain:m.weakest_domain||null,confidence:m.confidence||null,voucher_expiry:m.voucher_expiry||null,exam_target:m.exam_target||null,post_s1_completed:num(m.post_s1_completed),portfolio_count:Object.values(pf).filter(Boolean).length,survey:sv,submitted_at:e.client_at||e.created_at});
 }
 const domainSummary=Object.fromEntries(domains.map(d=>[d,{students:domainAgg[d].students,correct:domainAgg[d].correct,total:domainAgg[d].total,avg_pct:avg(domainAgg[d].pcts)}]));
 const surveySummary=Object.fromEntries(Object.entries(survey).map(([k,v]:any)=>[k,{n:v.length,avg:avg(v)}]));
 rows.sort((a,b)=>String(a.display_name).localeCompare(String(b.display_name),"es"));
 return out(req,{ok:true,run,enrolled:(enr||[]).length,submitted:latest.size,events:(events||[]).length,domains:domainSummary,errors,weakest:weak,confidence:{avg:avg(conf),high_confidence_errors:highConfidenceErrors},post_s1_avg:latest.size?Math.round(postSum/latest.size*100)/100:null,voucher:{known:voucherKnown,target_known:targetKnown,target_after_expiry:targetAfterVoucher},official,portfolio,survey:surveySummary,rows});
});