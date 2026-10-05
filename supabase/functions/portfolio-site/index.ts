
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cache: { at: number; data: any } | null = null;

async function rest(path: string) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY }
  });
  if (!r.ok) throw new Error("Database read failed: " + r.status);
  return await r.json();
}

async function market(ids: string[]) {
  try {
    const q = encodeURIComponent(ids.filter(Boolean).join(","));
    const [m, g] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + q + "&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h", { headers: { accept: "application/json" } }),
      fetch("https://api.coingecko.com/api/v3/global", { headers: { accept: "application/json" } })
    ]);
    const coins = m.ok ? await m.json() : [];
    const global = g.ok ? await g.json() : null;
    return { coins, global: global?.data || null, live: m.ok && g.ok };
  } catch {
    return { coins: [], global: null, live: false };
  }
}

async function bundle() {
  if (cache && Date.now() - cache.at < 60000) return cache.data;
  const [assets, signals, routes] = await Promise.all([
    rest("pop_assets?select=*&active=eq.true&order=sort_order.asc"),
    rest("pop_signals?select=*&order=signal_date.desc,id.desc"),
    rest("pop_productive_routes?select=*&order=sort_order.asc")
  ]);
  const mk = await market(assets.map((a:any) => a.cg_id));
  const data = { assets, signals, routes, market: mk, generated_at: new Date().toISOString() };
  cache = { at: Date.now(), data };
  return data;
}

function html() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ValueLens — Portfolio of Portfolios</title>
<meta name="description" content="Institutional rails, tokenisation, productive infrastructure and asymmetric digital-asset research.">
<style>
:root{--bg:#071019;--panel:#0d1823;--panel2:#111f2d;--line:#203449;--text:#edf4fa;--muted:#8ba2b8;--green:#54e6a5;--gold:#f1c96a;--blue:#6cb7ff;--red:#ff7a8c;--max:1480px}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 85% 0,#12304b 0,transparent 28%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:inherit}.wrap{max-width:var(--max);margin:auto;padding:0 24px}.nav{position:sticky;top:0;z-index:10;background:rgba(7,16,25,.86);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.navin{height:68px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;gap:12px;align-items:center;font-weight:800;letter-spacing:.02em}.mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--green),var(--blue));display:grid;place-items:center;color:#041019;font-weight:950}.navlinks{display:flex;gap:18px;color:var(--muted);font-size:13px}.navlinks a{text-decoration:none}.hero{padding:76px 0 34px}.eyebrow{color:var(--green);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800}.hero h1{font-size:clamp(44px,7vw,96px);line-height:.93;max-width:1000px;margin:15px 0 22px;letter-spacing:-.055em}.hero p{max-width:840px;color:#b5c5d4;font-size:18px;line-height:1.65}.pillrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.pill{border:1px solid var(--line);background:#0b1722;padding:9px 12px;border-radius:999px;color:#b8c8d7;font-size:12px}.pill strong{color:var(--text)}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:34px 0 62px}.metric{background:linear-gradient(180deg,#0f1c29,#0b1620);border:1px solid var(--line);border-radius:18px;padding:21px}.metric .k{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}.metric .v{font-size:29px;font-weight:850;margin-top:8px}.metric .s{font-size:12px;color:var(--muted);margin-top:5px}
section{padding:28px 0 56px}.sectionhead{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:20px}.sectionhead h2{font-size:30px;margin:0;letter-spacing:-.03em}.sectionhead p{color:var(--muted);max-width:700px;margin:0;line-height:1.55}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.bucket{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px}.bucket h3{margin:0 0 4px;font-size:16px}.weight{font-size:32px;font-weight:900;margin:9px 0}.assetchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.chip{padding:6px 8px;border-radius:8px;background:#142536;border:1px solid #263d53;font-size:11px;font-weight:750}
.signalgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.signal{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:19px;display:flex;flex-direction:column;min-height:230px}.region{font-size:11px;color:var(--blue);letter-spacing:.12em;text-transform:uppercase}.signal h3{font-size:17px;line-height:1.35;margin:10px 0}.signal p{color:#a9bccd;font-size:13px;line-height:1.55;flex:1}.signal .date{font-size:11px;color:var(--muted)}.source{display:inline-block;margin-top:12px;color:var(--green);font-size:12px;text-decoration:none}
.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.search{background:#0c1721;border:1px solid var(--line);border-radius:12px;color:var(--text);padding:11px 13px;min-width:230px}.scenario{flex:1;min-width:280px;background:#0c1721;border:1px solid var(--line);border-radius:12px;padding:10px 14px}.scenario label{font-size:11px;color:var(--muted)}input[type=range]{width:100%;accent-color:#54e6a5}
.tablewrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:#0b1620}table{width:100%;border-collapse:collapse;min-width:1160px}th,td{padding:13px 12px;text-align:left;border-bottom:1px solid #172a3c;font-size:12px}th{position:sticky;top:67px;background:#0d1a26;color:#88a0b6;text-transform:uppercase;letter-spacing:.08em;font-size:10px;z-index:2}td strong{font-size:13px}.muted{color:var(--muted)}.grade{display:inline-grid;place-items:center;min-width:34px;padding:5px 8px;border-radius:8px;border:1px solid #2a435a;background:#132536;font-weight:850}.conv{font-size:10px;letter-spacing:.07em;padding:5px 7px;border-radius:8px;background:#173024;color:#77efb6;white-space:nowrap}.price{font-variant-numeric:tabular-nums}.up{color:var(--green)}.down{color:var(--red)}
.routes{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.route{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;display:grid;grid-template-columns:76px 1fr;gap:13px}.route .sym{font-size:20px;font-weight:900;color:var(--gold)}.route h3{font-size:15px;margin:0 0 7px}.route p{font-size:12px;color:#a9bccd;line-height:1.5;margin:4px 0}.status{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--green)}
.asym{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.asymcard{border:1px solid var(--line);background:linear-gradient(180deg,#132233,#0b1620);border-radius:18px;padding:18px}.asymcard .big{font-size:26px;font-weight:950}.asymcard p{color:#a7bacb;line-height:1.5;font-size:12px}.asymcard .why{color:var(--gold);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.09em}
.footer{border-top:1px solid var(--line);padding:30px 0 50px;color:var(--muted);font-size:12px;line-height:1.6}
.loading{padding:40px;text-align:center;color:var(--muted)}.error{color:#ff9aaa}
@media(max-width:1050px){.metrics,.grid4{grid-template-columns:repeat(2,1fr)}.signalgrid{grid-template-columns:repeat(2,1fr)}.asym{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.wrap{padding:0 15px}.navlinks{display:none}.hero{padding-top:48px}.metrics,.grid4,.signalgrid,.routes,.asym{grid-template-columns:1fr}.hero p{font-size:15px}.sectionhead{display:block}.sectionhead p{margin-top:9px}.metric .v{font-size:24px}}
</style>
</head>
<body>
<div class="nav"><div class="wrap navin"><div class="brand"><div class="mark">V</div><span>ValueLens</span></div><div class="navlinks"><a href="#signals">Institutional signals</a><a href="#portfolio">Portfolio</a><a href="#productive">Productive assets</a><a href="#asymmetry">Asymmetry lab</a></div></div></div>
<main class="wrap">
<div class="hero">
<div class="eyebrow">Portfolio of Portfolios · Institutional Rails Intelligence</div>
<h1>Follow the rails.<br>Then follow the value.</h1>
<p>A factual map of the infrastructure being built underneath tokenised money, securities, settlement, data and machine economies. Institutional deployment first. Token capture second. Valuation third.</p>
<div class="pillrow"><div class="pill"><strong>BIS</strong> tokenised monetary architecture</div><div class="pill"><strong>DTCC</strong> production tokenisation</div><div class="pill"><strong>ECB</strong> central-bank-money settlement</div><div class="pill"><strong>SEC</strong> custody framework</div><div class="pill"><strong>Asia</strong> real-value tokenised settlement</div></div>
</div>
<div class="metrics" id="metrics"><div class="loading">Loading live portfolio intelligence…</div></div>

<section id="signals"><div class="sectionhead"><div><div class="eyebrow">Primary-source ledger</div><h2>What the market infrastructure owners are doing</h2></div><p>Every card below is tied to an official regulator, central bank, market-infrastructure operator or project source. No anonymous-market narrative.</p></div><div class="signalgrid" id="signalsGrid"></div></section>

<section><div class="sectionhead"><div><div class="eyebrow">100-unit architecture</div><h2>Portfolio of Portfolios</h2></div><p>Four sleeves: institutional rails, tokenisation/execution, machine economy and asymmetric valuation gaps.</p></div><div class="grid4" id="buckets"></div></section>

<section id="portfolio"><div class="sectionhead"><div><div class="eyebrow">Live market layer</div><h2>Master portfolio</h2></div><p>Prices, market caps and all-time highs are requested live from CoinGecko. Scenario values preserve each asset's current market share; they are mathematics, not target prices.</p></div>
<div class="controls"><input id="search" class="search" placeholder="Search symbol, project or thesis"><div class="scenario"><label>Constant-share total crypto market scenario: <strong id="scenarioLabel">$13.0T</strong></label><input id="scenarioRange" type="range" min="5" max="25" step="0.5" value="13"></div></div>
<div class="tablewrap"><table><thead><tr><th>#</th><th>Asset</th><th>Sleeve</th><th>Weight</th><th>Conviction</th><th>Institutional</th><th>Capture</th><th>Price</th><th>24h</th><th>Market cap</th><th>ATH</th><th>Scenario price</th></tr></thead><tbody id="assetRows"></tbody></table></div>
</section>

<section id="productive"><div class="sectionhead"><div><div class="eyebrow">Capital efficiency</div><h2>Make the holdings work</h2></div><p>Native staking, validator ownership and compute-provider economics — separated from third-party yield schemes.</p></div><div class="routes" id="routes"></div></section>

<section id="asymmetry"><div class="sectionhead"><div><div class="eyebrow">Forensic basket</div><h2>Something isn't adding up</h2></div><p>Small or mid-sized valuations attached to infrastructure, token-capture mechanisms or operating businesses that justify deeper forensic work.</p></div><div class="asym" id="asym"></div></section>
</main>
<div class="footer"><div class="wrap"><strong>ValueLens / Portfolio of Portfolios</strong><br>Evidence first. Architecture second. Token economics third. Market price last. Live market data is displayed only when the upstream feed responds; institutional claims remain anchored to the source ledger.</div></div>
<script>
var DATA=null, SCENARIO=13;
function money(n){if(n===null||n===undefined||!isFinite(n))return "—";if(Math.abs(n)>=1e12)return "$"+(n/1e12).toFixed(2)+"T";if(Math.abs(n)>=1e9)return "$"+(n/1e9).toFixed(2)+"B";if(Math.abs(n)>=1e6)return "$"+(n/1e6).toFixed(1)+"M";if(Math.abs(n)>=1000)return "$"+n.toLocaleString(undefined,{maximumFractionDigits:0});if(Math.abs(n)>=1)return "$"+n.toLocaleString(undefined,{maximumFractionDigits:2});return "$"+n.toLocaleString(undefined,{maximumFractionDigits:6})}
function pct(n){if(n===null||n===undefined||!isFinite(n))return "—";return (n>=0?"+":"")+n.toFixed(2)+"%"}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]})}
function liveById(){var o={};(DATA.market.coins||[]).forEach(function(x){o[x.id]=x});return o}
function renderMetrics(){var g=DATA.market.global;var total=g&&g.total_market_cap?g.total_market_cap.usd:null;var w=DATA.assets.reduce(function(a,b){return a+Number(b.target_weight)},0);document.getElementById("metrics").innerHTML='<div class="metric"><div class="k">Portfolio assets</div><div class="v">'+DATA.assets.length+'</div><div class="s">Curated across four infrastructure sleeves</div></div><div class="metric"><div class="k">Target allocation</div><div class="v">'+w.toFixed(0)+'%</div><div class="s">Architecture-weighted research portfolio</div></div><div class="metric"><div class="k">Crypto market</div><div class="v">'+money(total)+'</div><div class="s">'+(DATA.market.live?'Live upstream snapshot':'Live feed unavailable')+'</div></div><div class="metric"><div class="k">Primary-source signals</div><div class="v">'+DATA.signals.length+'</div><div class="s">US · Europe · Asia · Global</div></div>'}
function renderSignals(){document.getElementById("signalsGrid").innerHTML=DATA.signals.slice(0,12).map(function(s){return '<article class="signal"><div class="region">'+esc(s.region)+' · '+s.signal_date+'</div><h3>'+esc(s.headline)+'</h3><p>'+esc(s.fact)+'</p><div class="date">'+esc(s.institution)+'</div><a class="source" target="_blank" rel="noopener" href="'+esc(s.source_url)+'">Open '+esc(s.source_label)+' source →</a></article>'}).join("")}
function renderBuckets(){var map={};DATA.assets.forEach(function(a){if(!map[a.category])map[a.category]=[];map[a.category].push(a)});document.getElementById("buckets").innerHTML=Object.keys(map).map(function(k){var arr=map[k],w=arr.reduce(function(x,y){return x+Number(y.target_weight)},0);return '<div class="bucket"><h3>'+esc(k)+'</h3><div class="weight">'+w.toFixed(0)+'%</div><div class="muted">'+arr.length+' assets</div><div class="assetchips">'+arr.map(function(a){return '<span class="chip">'+a.symbol+' '+Number(a.target_weight).toFixed(a.target_weight%1?1:0)+'%</span>'}).join("")+'</div></div>'}).join("")}
function renderAssets(){var q=document.getElementById("search").value.toLowerCase();var mk=liveById();var global=DATA.market.global&&DATA.market.global.total_market_cap?DATA.market.global.total_market_cap.usd:null;var rows=DATA.assets.filter(function(a){return !q||[a.symbol,a.name,a.category,a.thesis,a.conviction].join(" ").toLowerCase().indexOf(q)>=0}).map(function(a,i){var m=mk[a.cg_id]||{};var scen=(global&&m.current_price)?m.current_price*((SCENARIO*1e12)/global):null;var ch=m.price_change_percentage_24h;return '<tr><td class="muted">'+(i+1)+'</td><td><strong>'+a.symbol+'</strong><br><span class="muted">'+esc(a.name)+'</span></td><td>'+esc(a.category)+'</td><td><strong>'+Number(a.target_weight).toFixed(a.target_weight%1?1:0)+'%</strong></td><td><span class="conv">'+esc(a.conviction)+'</span></td><td><span class="grade">'+esc(a.institutional_grade)+'</span></td><td><span class="grade">'+esc(a.token_capture_grade)+'</span></td><td class="price">'+money(m.current_price)+'</td><td class="'+(ch>=0?'up':'down')+'">'+pct(ch)+'</td><td>'+money(m.market_cap)+'</td><td>'+money(m.ath)+'</td><td><strong>'+money(scen)+'</strong></td></tr>'}).join("");document.getElementById("assetRows").innerHTML=rows}
function renderRoutes(){document.getElementById("routes").innerHTML=DATA.routes.map(function(r){return '<article class="route"><div class="sym">'+r.symbol+'</div><div><div class="status">'+esc(r.status)+'</div><h3>'+esc(r.route_name)+'</h3><p><strong>Requirement:</strong> '+esc(r.requirement||"Protocol dependent")+'</p><p><strong>Economics:</strong> '+esc(r.reward_basis||"")+'</p><p><strong>Custody:</strong> '+esc(r.custody_model)+'</p>'+(r.source_url?'<a class="source" target="_blank" rel="noopener" href="'+esc(r.source_url)+'">Protocol source →</a>':'')+'</div></article>'}).join("")}
function renderAsym(){var syms=["CPOOL","CHEX","AKT","IOTA","XDC"];var why={CPOOL:"Protocol revenue → open-market token buybacks",CHEX:"Regulated capital-markets infrastructure / token linkage",AKT:"AI compute demand + staking/provider economics",IOTA:"Digital-trade infrastructure + native token utility",XDC:"Trade-finance rails + validator economics"};var mk=liveById();document.getElementById("asym").innerHTML=syms.map(function(s){var a=DATA.assets.find(function(x){return x.symbol===s}),m=a?mk[a.cg_id]||{}:{};return '<article class="asymcard"><div class="why">'+esc(why[s])+'</div><div class="big">'+s+'</div><div class="muted">'+money(m.market_cap)+'</div><p>'+esc(a?a.thesis:"")+'</p><span class="grade">Capture '+esc(a?a.token_capture_grade:"—")+'</span></article>'}).join("")}
async function init(){try{var r=await fetch(location.pathname+"?data=1");DATA=await r.json();renderMetrics();renderSignals();renderBuckets();renderAssets();renderRoutes();renderAsym()}catch(e){document.getElementById("metrics").innerHTML='<div class="error">Data load failed. Refresh to retry.</div>'}}
document.getElementById("search").addEventListener("input",renderAssets);document.getElementById("scenarioRange").addEventListener("input",function(e){SCENARIO=Number(e.target.value);document.getElementById("scenarioLabel").textContent="$"+SCENARIO.toFixed(1)+"T";renderAssets()});init();
</script>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (url.searchParams.get("health") === "1") return new Response(JSON.stringify({ ok: true, service: "portfolio-site" }), { headers: { ...cors, "content-type": "application/json" } });
  if (url.searchParams.get("data") === "1") {
    try {
      const data = await bundle();
      return new Response(JSON.stringify(data), { headers: { ...cors, "content-type": "application/json", "cache-control": "public,max-age=30" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    }
  }
  return new Response(html(), { headers: { ...cors, "content-type": "text/html; charset=utf-8", "cache-control": "public,max-age=60" } });
});
