# Deposit

Build DEPOSIT - A tamper-proof move-in / move-out documentation app that protects Arizona renters.



TECH STACK:

- Frontend: React + Tailwind, glassy minimalist design

- Backend: Supabase (auth, database, storage)

- Design System: Colors #FFFFFF white, #F8F7F5 stone background, #111111 charcoal text, #D8CFC7 clay accent, #EAE9E5 borders. Fonts: Fraunces serif for headlines tight tracking -0.02em, Inter for body. Frosted glass nav, 1px borders, soft shadows, rounded-2xl cards. Look like a $50k agency site.



SUPABASE SCHEMA - Create these tables:



users (id uuid pk references auth.users, email text, full_name text)

properties (id uuid pk, user_id uuid fk users, address text, landlord_name text, landlord_email text, deposit_amount numeric, status text default 'draft', created_at timestamptz)

reports (id uuid pk, property_id uuid fk properties, user_id uuid fk users, type text - move_in/move_out/comparison, report_number text like DEP-00192, gps_lat float, gps_lng float, weather_snapshot text, overall_hash text, pdf_url text, qr_verification_url text, created_at timestamptz)

media (id uuid pk, report_id uuid fk reports, room_label text, condition text Good/Fair/Damaged, note text, file_url text, file_hash_sha256 text, gps_lat float, gps_lng float, exif_timestamp timestamptz, created_at timestamptz)

demand_letters (id uuid pk, report_id uuid fk reports, property_id uuid fk properties, user_id uuid fk users, amount_withheld numeric, letter_pdf_url text)



CORE FEATURES TO BUILD:



1. Auth: Email login/signup with Supabase Auth. Dashboard shows list of properties with status chips.



2. Add Property Page: Form with address, unit, landlord name/email, deposit amount, lease dates. Creates row in properties.



3. GUIDED SCANNER FLOW - This is the main feature:

   - Button "Start New Move-In Scan" -> creates new report

   - Show checklist: ["Kitchen - Under Sink (film 5 sec)", "Kitchen - Stovetop & Oven Interior", "Bathroom 1 - Shower Caulk & Grout", "Bathroom 1 - Behind Toilet", "Living Room - Walls & Floor", "Bedroom - Closet Interior", "Front Door & Locks", "Water Heater & AC Unit"]

   - For each item: Camera upload (photo/video) to Supabase Storage bucket "media"

   - ON UPLOAD, automatically capture: GPS lat/lng using navigator.geolocation, timestamp Date.now(), device model navigator.userAgent, generate SHA-256 hash of file_url + timestamp (use crypto.subtle), save to media table

   - Also fetch weather snapshot: call function that returns "112°F Clear - Phoenix, AZ" (mock for now)

   - Force user to complete all rooms, show progress bar



4. Report Generation:

   - After scan complete, generate overall_hash = SHA-256 of all media file_hashes joined

   - Update report with overall_hash, gps, weather

   - Generate PDF preview page: Header DEPOSIT Report # + Type + Date + Address. Table with room | condition | note | thumbnail | hash short | timestamp. Footer with Arizona law compliance: "This report created per A.R.S. § 33-1321(C). Media cryptographically hashed and stored immutably." + QR verification link + signature lines.

   - Make it shareable via email



5. Move-Out + Comparison:

   - Same scanner flow for move-out

   - Auto side-by-side view: left move-in photo, right move-out photo, AI flag "No Change / New Damage / Pre-existing"



6. Monetization Upsell - Demand Letter ($29):

   - Page that auto-fills tenant/landlord info, cites A.R.S. § 33-1321(D) - landlord has 14 business days excluding weekends/holidays to return deposit, and § 33-1321(E) - tenant may recover up to 2x amount wrongfully withheld. Generate formal demand letter PDF.



7. Pricing Page: $14.99 per report, $24.99 bundle Move-In + Move-Out + Comparison, $29 Dispute Letter. Compare to $1,800 average deposit loss.



Make everything fully functional with Supabase. Deploy to live URL. Make UI premium, glassy, minimalist, not generic AI slop. Lavender gradient colored with pretty cursive

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://support-myazdepositportal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6cc9977f-c455-4ff2-b971-9bdbb2f275c6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
