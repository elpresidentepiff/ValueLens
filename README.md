# ValueLens — Portfolio of Portfolios

Institutional-rails intelligence dashboard for the Portfolio of Portfolios research framework.

## Live deployment

Supabase Edge Function:

https://ltbsxbvfsxtnharjvqcm.supabase.co/functions/v1/portfolio-site

## What it tracks

- Institutional Rails
- Tokenisation & Execution
- Machine Economy
- Asymmetric / Mispriced infrastructure
- Primary-source institutional signals across the US, Europe and Asia
- Native staking, validators and productive infrastructure
- Live market data when the upstream market feed is available
- Constant-market-share scenario engine

## Portfolio architecture

- Institutional Rails — 45%
- Tokenisation & Execution — 25%
- Machine Economy — 18%
- Asymmetric / Mispriced — 12%

The database uses `pop_*` tables in Supabase and public-read-only RLS policies. No service-role key or private credential is shipped to the browser.

## Data model

- `pop_assets`
- `pop_signals`
- `pop_productive_routes`

## Deployment

The live interface is implemented as the Supabase Edge Function at:

`supabase/functions/portfolio-site/index.ts`

Institutional claims are curated from primary sources including DTCC, BIS, SEC, ECB, HKMA, Bank of Japan, Japan FSA and MAS.

## Design rule

Evidence first. Architecture second. Token economics third. Market price last.
