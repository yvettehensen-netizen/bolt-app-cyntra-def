# Environment Setup Helper - Gebruikershandleiding

## 📍 Locatie

De Environment Setup Helper is toegankelijk via `/env` en is **alleen beschikbaar voor administrators**.

## 🎯 Doel

Deze pagina helpt administrators om:
1. Alle environment variables te verifiëren
2. Database setup te controleren en uit te voeren
3. Problemen met configuratie op te lossen

## 🔑 Environment Variables

### Vereiste Variabelen (Vite)

Deze applicatie gebruikt **Vite** (niet Next.js), dus de environment variables gebruiken het `VITE_` prefix:

```env
# Supabase Configuratie (Verplicht)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API (Optioneel - voor AI-powered analysis)
VITE_OPENAI_API_KEY=sk-proj-...
```

### Waar te Vinden

1. **Supabase URL & Anon Key:**
   - Log in op https://supabase.com/dashboard
   - Selecteer je project
   - Ga naar: **Project Settings** → **API**
   - Kopieer:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_ANON_KEY`

2. **OpenAI API Key** (optioneel):
   - Log in op https://platform.openai.com
   - Ga naar **API Keys**
   - Maak een nieuwe key aan
   - Kopieer → `VITE_OPENAI_API_KEY`

## 📊 Features van de /env Pagina

### 1. Environment Variables Status

**Card Grid:**
- ✅ **Groene badge**: Variable is ingesteld
- ❌ **Rode badge**: Verplichte variable ontbreekt
- ⚠️ **Gele badge**: Optionele variable ontbreekt

**Gemaskeerde Waarden:**
- Toont alleen eerste 4 + laatste 4 karakters
- Voorbeeld: `https...co` of `eyJh...ZVg`
- Volledige waarden worden NOOIT getoond (veiligheid)

**Per Variable:**
- Naam van de key
- Status (Present/Missing)
- Gemaskeerde preview (als aanwezig)
- Hint waar deze te vinden is

### 2. Summary Banner

**Rood (problemen):**
- Toont lijst van ontbrekende verplichte variables
- "How to Fix" knop opent modal met instructies

**Groen (alles OK):**
- "All required environment variables are set"
- Bevestigt dat configuratie compleet is

### 3. Database Setup Sectie

**Blauwe Banner:**
- Waarschuwing als `quickscan_responses` tabel niet bestaat
- "Database Setup Instructies" knop

**Modal Inhoud:**
- Volledige SQL migratie (kopieer/plak ready)
- 5 stappen in het Nederlands:
  1. Open Supabase Dashboard
  2. Open SQL Editor
  3. Kopieer de Migratie SQL
  4. Voer de Query Uit
  5. Verifieer en Test

**SQL Inhoud:**
```sql
CREATE TABLE quickscan_responses (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  bedrijfsnaam text,
  sector text,
  omzet_range text,
  aantal_ftes text,
  data_maturiteit text,
  hoofdknelpunt text,
  doel_analyse text,
  numerieke_score integer,
  sterktes text[],
  verbeterpunten text[],
  advies text,
  created_at timestamptz
);

-- Plus RLS policies en indexes
```

## 🚨 Non-Blocking Toasts

Op `/dashboard` en `/quickscan` pagina's:
- Gele toast verschijnt als verplichte env vars ontbreken
- Kan worden gesloten (dismissed voor 1 uur)
- Voor admins: link naar /env pagina
- Non-blocking: app blijft werken met mock data

## 🔐 Toegangscontrole

**Admin Only:**
- Pagina checkt `user?.role === 'admin'`
- Niet-admins zien "Access Denied" bericht
- Navbar link verschijnt alleen voor admins

**Environment Link in Navbar:**
- Settings icoon + "Environment" tekst
- Alleen zichtbaar als `user.role === 'admin'`
- Actieve status highlighting

## 🛠️ useEnvOK Hook

**Locatie:** `src/hooks/useEnvOK.ts`

**Return Type:**
```typescript
interface EnvStatus {
  ok: boolean;              // True als alle verplichte vars aanwezig
  missing: string[];        // Array van ontbrekende verplichte vars
  all: EnvCheck[];         // Volledige details van alle vars
}
```

**Gebruik:**
```typescript
import { useEnvOK } from '../hooks/useEnvOK';

function MyComponent() {
  const envStatus = useEnvOK();

  if (!envStatus.ok) {
    console.log('Missing:', envStatus.missing);
  }

  return <div>...</div>;
}
```

## 📝 Stappen voor Nieuwe Deployment

### 1. Environment Variables Instellen
```bash
# In .env bestand
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=eyJ..." >> .env
echo "VITE_OPENAI_API_KEY=sk-..." >> .env
```

### 2. Database Setup
1. Ga naar `/env` als admin
2. Klik "Database Setup Instructies"
3. Kopieer SQL uit modal
4. Plak in Supabase SQL Editor
5. Run query
6. Verifieer in Table Editor

### 3. Verificatie
1. Check `/env` pagina - alles moet groen zijn
2. Test login
3. Test quickscan form
4. Verifieer data opslag

## 🎨 Styling

**Design Systeem:**
- Witte achtergrond
- Slate tekst (#475569, #64748b, #0f172a)
- Primary blauw (#2563EB)
- Rounded corners (rounded-xl, rounded-2xl)
- Shadow-md op cards
- Professional consultancy look

**Badges:**
- Groen: `bg-green-100 text-green-800 border-green-300`
- Rood: `bg-red-100 text-red-800 border-red-300`
- Geel: `bg-yellow-100 text-yellow-800 border-yellow-300`

**Animaties:**
- Slide-up voor toasts (0.3s ease-out)
- Smooth transitions op buttons
- Modal fade in/out

## 🔍 Troubleshooting

### "Access Denied" op /env
**Probleem:** User is geen admin
**Oplossing:**
- Zorg dat de user record in auth.users een role='admin' heeft
- Of voeg admin check toe in je user management

### Toast blijft verschijnen
**Probleem:** Dismissed toast komt terug
**Oplossing:**
- Toast gebruikt localStorage voor 1 uur dismiss
- Clear browser storage of wacht 1 uur
- Of fix de ontbrekende environment variables

### "Could not find table"
**Probleem:** Database migratie niet uitgevoerd
**Oplossing:**
- Ga naar `/env` → "Database Setup Instructies"
- Voer SQL uit in Supabase dashboard
- Verifieer tabel bestaat in Table Editor

### Environment variables niet zichtbaar
**Probleem:** Vite ziet de vars niet
**Oplossing:**
- Herstart dev server na .env wijzigingen
- Check dat vars beginnen met `VITE_`
- Verifieer .env bestand in project root

## ✅ Checklist voor Productie

- [ ] Alle VITE_SUPABASE_* vars ingesteld
- [ ] VITE_OPENAI_API_KEY ingesteld (optioneel)
- [ ] Database migratie uitgevoerd
- [ ] `/env` pagina toont alles groen
- [ ] Login werkt
- [ ] Quickscan werkt
- [ ] Reports worden opgeslagen
- [ ] Dashboard toont data

## 📚 Gerelateerde Bestanden

- `/src/pages/EnvSetupPage.tsx` - Hoofdpagina
- `/src/hooks/useEnvOK.ts` - Environment checker hook
- `/src/components/EnvWarningToast.tsx` - Toast component
- `/src/components/Navbar.tsx` - Navbar met admin link
- `DATABASE_SETUP.md` - Database setup documentatie
- `supabase/migrations/20251017130000_update_quickscan_responses.sql` - SQL migratie

## 🎉 Success Criteria

✅ Admins kunnen /env pagina openen
✅ Alle env vars worden correct getoond (gemaskeerd)
✅ Missing vars worden duidelijk aangegeven
✅ Modal met setup instructies werkt
✅ Database setup instructies zijn compleet
✅ Toasts verschijnen op andere paginas
✅ Alle tekst is in het Nederlands
✅ Design is clean en professional
